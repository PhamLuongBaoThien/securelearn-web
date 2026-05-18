// Component upload video cho bài học của instructor.
// Luồng: FE xin multipart session → batch presign URLs → PUT chunks song song
// → bind asset vào lesson → confirm → media-service xử lý HLS → FE poll trạng thái.
import React, { useEffect, useRef, useState } from 'react';
import { Upload, CheckCircle2, AlertCircle, RotateCcw, X, Loader2, Play } from 'lucide-react';
import { toast } from 'sonner';
import type { ILesson, LessonStatus, VideoProcessingStatus } from '@/services/courseApi';
import { bindVideoAssetToLesson, removeVideoAssetFromLesson } from '@/services/courseApi';
import {
  getVideoAsset, initiateVideoUpload, getBatchPartPresignedUrls,
  confirmVideoUpload, abortVideoUpload, type IVideoAsset,
} from '@/services/mediaApi';

// Các hàm format nhỏ chỉ phục vụ hiển thị trên UI.
const fmt = {
  duration: (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`,
  size: (b?: number) => {
    if (!b || b <= 0) return null;
    if (b >= 1024 ** 3) return `${(b / 1024 ** 3).toFixed(1)} GB`;
    if (b >= 1024 ** 2) return `${(b / 1024 ** 2).toFixed(1)} MB`;
    return `${Math.round(b / 1024)} KB`;
  },
  speed: (bps: number) => {
    if (bps <= 0) return '';
    if (bps >= 1024 * 1024) return `${(bps / (1024 * 1024)).toFixed(1)} MB/s`;
    return `${Math.round(bps / 1024)} KB/s`;
  },
  eta: (s: number) => {
    if (s <= 0) return '';
    if (s >= 3600) return `${Math.floor(s / 3600)}g ${Math.floor((s % 3600) / 60)}p`;
    if (s >= 60) return `${Math.floor(s / 60)}p ${s % 60}s`;
    return `${s}s`;
  },
};

const clamp = (v?: number) =>
  typeof v !== 'number' || Number.isNaN(v) ? 0 : Math.max(0, Math.min(100, Math.round(v)));

// Media-service dùng status kỹ thuật. FE map về status dễ hiển thị hơn.
const mapAssetStatus = (s?: string): VideoProcessingStatus => {
  if (s === 'READY') return 'DONE';
  if (s === 'FAILED') return 'FAILED';
  if (s === 'PROCESSING' || s === 'UPLOADED') return 'PROCESSING';
  if (s === 'INITIATED' || s === 'UPLOADING') return 'PENDING';
  return 'NONE';
};

// Course-service chỉ lưu status của lesson. Khi reload editor, nếu chưa hydrate
// được media asset thì FE vẫn cần suy ra trạng thái hiển thị từ lesson.
const mapLessonStatus = (s?: string, assetId?: string | null): VideoProcessingStatus => {
  if (!assetId) return 'NONE';
  if (s === 'READY') return 'DONE';
  if (s === 'FAILED') return 'FAILED';
  if (s === 'PROCESSING') return 'PROCESSING';
  return 'NONE';
};

// Khi đọc được status thật từ media-service, FE sync ngược lại status lesson local
// để badge, publish gate và row state không bị lệch.
const assetToLessonStatus = (s?: IVideoAsset['status']): LessonStatus | null => {
  if (s === 'READY') return 'READY';
  if (s === 'FAILED') return 'FAILED';
  if (s === 'UPLOADED' || s === 'PROCESSING') return 'PROCESSING';
  return null;
};

// Cấu hình polling và multipart upload.
const POLL_INITIAL_MS = 3000;
const POLL_MULT = 1.4;
const POLL_MAX_MS = 15000;
const CHUNK_SIZE = 25 * 1024 * 1024;   // 25 MB — MinIO yêu cầu part ≥ 5MB (trừ part cuối)
const CONCURRENCY = 5;                  // Số chunks upload song song tối đa

// Metadata asset dùng riêng cho UI. Những field này được hydrate từ media-service.
type AssetMeta = Pick<IVideoAsset,
  '_id' | 'status' | 'originalFileName' | 'mimeType' | 'sourceSizeBytes' |
  'durationSec' | 'processingProgress' | 'errorMessage' | 'uploadCompletedAt' | 'updatedAt'>;

type UploadSnapshot = {
  assetId?: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  progress: number;
  speedBps: number;
  etaSec: number | null;
};

// Store progress upload ở cấp module để không mất tiến độ khi component bị unmount.
// Ví dụ: user thu nhỏ lesson row rồi mở lại trong khi browser vẫn đang PUT lên MinIO.
// Store này chỉ sống trong cùng tab hiện tại, không dùng để resume sau khi refresh trang.
const uploadSnapshots = new Map<string, UploadSnapshot>();
const uploadListeners = new Map<string, Set<(snapshot: UploadSnapshot | null) => void>>();

// Cập nhật snapshot upload và thông báo cho mọi instance LessonVideoUploader
// đang subscribe cùng lessonId.
const emitUploadSnapshot = (key: string, snapshot: UploadSnapshot | null) => {
  if (snapshot) uploadSnapshots.set(key, snapshot);
  else uploadSnapshots.delete(key);
  uploadListeners.get(key)?.forEach((listener) => listener(snapshot));
};

// Khi component mount lại, hàm này trả ngay snapshot hiện có nếu upload vẫn chạy.
const subscribeUploadSnapshot = (key: string, listener: (snapshot: UploadSnapshot | null) => void) => {
  const listeners = uploadListeners.get(key) ?? new Set<(snapshot: UploadSnapshot | null) => void>();
  listeners.add(listener);
  uploadListeners.set(key, listeners);
  listener(uploadSnapshots.get(key) ?? null);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) uploadListeners.delete(key);
  };
};


interface Props {
  courseId: string;
  lessonId?: string;
  lesson: ILesson;
  onUpdate: (field: keyof ILesson, value: ILesson[keyof ILesson]) => void;
  onRefresh?: () => Promise<void>;
}

// Component chính.
export const LessonVideoUploader: React.FC<Props> = ({ courseId, lessonId, lesson, onUpdate, onRefresh }) => {
  const [assetMeta, setAssetMeta] = useState<AssetMeta | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeedBps, setUploadSpeedBps] = useState(0);
  const [uploadEtaSec, setUploadEtaSec] = useState<number | null>(null);
  const [processingElapsed, setProcessingElapsed] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollDelayRef = useRef(POLL_INITIAL_MS);
  const isPollingRef = useRef(false);
  const onUpdateRef = useRef(onUpdate);
  // Dùng ref này để biết asset nào đã hydrate, tránh gọi media-service lại ở mỗi re-render.
  const hydratedAssetIdRef = useRef<string | null>(null);

  // Ưu tiên assetMeta local vì nó là trạng thái mới nhất trong component.
  // Nếu chưa có assetMeta thì fallback về lesson prop lấy từ course-service.
  const status: VideoProcessingStatus = assetMeta?.status
    ? mapAssetStatus(assetMeta.status)
    : (lesson.processingStatus ?? mapLessonStatus(lesson.status, lesson.videoAssetId));

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (!lessonId) return;
    return subscribeUploadSnapshot(lessonId, (snapshot) => {
      if (!snapshot) return;
      // Khôi phục progress upload khi component bị unmount rồi mount lại.
      // Backend không biết browser đã PUT được bao nhiêu byte, nên thông tin này phải giữ ở FE.
      setAssetMeta({
        _id: snapshot.assetId || '',
        status: 'UPLOADING',
        originalFileName: snapshot.fileName,
        mimeType: snapshot.mimeType,
        sourceSizeBytes: snapshot.sizeBytes,
        durationSec: 0,
        processingProgress: 0,
        errorMessage: null,
        uploadCompletedAt: null,
        updatedAt: undefined,
      });
      setUploadProgress(snapshot.progress);
      setUploadSpeedBps(snapshot.speedBps);
      setUploadEtaSec(snapshot.etaSec);
      if (snapshot.assetId) onUpdateRef.current('videoAssetId', snapshot.assetId);
      onUpdateRef.current('videoFileName', snapshot.fileName);
      onUpdateRef.current('processingStatus', 'PENDING');
    });
  }, [lessonId]);

  // Dọn timer polling khi component unmount để tránh update state sau khi component mất.
  useEffect(() => () => {
    isPollingRef.current = false;
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
  }, []);

  // Đếm thời gian xử lý để đổi thông báo mềm hơn nếu video xử lý lâu.
  useEffect(() => {
    if (status !== 'PROCESSING') { setProcessingElapsed(0); return; }
    const t0 = Date.now();
    const id = setInterval(() => setProcessingElapsed(Math.floor((Date.now() - t0) / 1000)), 1000);
    return () => clearInterval(id);
  }, [status, assetMeta?._id]);

  // Khi mở lại editor, lesson chỉ có videoAssetId từ course-service.
  // FE cần hydrate thêm metadata thật từ media-service như tên file, progress và duration.
  useEffect(() => {
    if (!lesson.videoAssetId || hydratedAssetIdRef.current === lesson.videoAssetId) return;
    hydratedAssetIdRef.current = lesson.videoAssetId;
    void syncAssetState(lesson.videoAssetId).then((s) => {
      if (s === 'PROCESSING') startPolling(lesson.videoAssetId!);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.videoAssetId]);

  // Đọc trạng thái thật của video asset từ media-service và sync vào state local.
  const syncAssetState = async (id: string): Promise<VideoProcessingStatus | null> => {
    const res = await getVideoAsset(id);
    if (res.status === 'ERR' || !res.data) return null;
    const a = res.data;
    setAssetMeta({ _id: a._id, status: a.status, originalFileName: a.originalFileName,
      mimeType: a.mimeType, sourceSizeBytes: a.sourceSizeBytes, durationSec: a.durationSec,
      processingProgress: a.processingProgress, errorMessage: a.errorMessage,
      uploadCompletedAt: a.uploadCompletedAt, updatedAt: a.updatedAt });
    onUpdate('videoAssetId', a._id);
    onUpdate('videoFileName', a.originalFileName || lesson.videoFileName);
    onUpdate('videoDurationSec', a.durationSec || lesson.videoDurationSec || 0);
    onUpdate('processingProgress', clamp(a.processingProgress));
    onUpdate('processingStatus', mapAssetStatus(a.status));
    const ls = assetToLessonStatus(a.status);
    if (ls) onUpdate('status', ls);
    if (a.status === 'READY' || a.status === 'FAILED') {
      isPollingRef.current = false;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    }
    return mapAssetStatus(a.status);
  };

  // Poll trạng thái xử lý sau khi upload đã confirm.
  // Upload lên MinIO dùng XHR progress, còn xử lý HLS dùng progress từ media-service.
  const startPolling = (id: string, immediate = false) => {
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    isPollingRef.current = true;
    pollDelayRef.current = POLL_INITIAL_MS;
    const schedule = () => {
      pollTimerRef.current = setTimeout(async () => {
        let next: VideoProcessingStatus | null = null;
        try { next = await syncAssetState(id); } catch { next = 'PROCESSING'; }
        if (isPollingRef.current && next === 'PROCESSING') {
          pollDelayRef.current = Math.min(pollDelayRef.current * POLL_MULT, POLL_MAX_MS);
          schedule();
        }
      }, pollDelayRef.current);
    };
    if (immediate) void syncAssetState(id).then((s) => { if (s === 'PROCESSING') schedule(); });
    else schedule();
  };

  // Upload video mới hoặc đổi video.
  // Không có API replace riêng: FE tạo asset mới, bind asset mới vào lesson,
  // course-service sẽ phát cleanup event để media-service xóa asset cũ.
  const uploadVideo = async (file: File) => {
    if (!lessonId) { toast.error('Lưu khóa học trước khi tải video lên.'); return; }

    const uploadKey = lessonId;
    let assetId: string | undefined;
    let confirmed = false;
    let bound = false;
    let currentSnapshot: UploadSnapshot = {
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      progress: 0,
      speedBps: 0,
      etaSec: null,
    };

    const updateUploadSnapshot = (patch: Partial<UploadSnapshot>) => {
      currentSnapshot = { ...currentSnapshot, ...patch };
      emitUploadSnapshot(uploadKey, currentSnapshot);
    };

    setAssetMeta({ _id: '', status: 'UPLOADING', originalFileName: file.name, mimeType: file.type,
      sourceSizeBytes: file.size, durationSec: 0, processingProgress: 0,
      errorMessage: null, uploadCompletedAt: null, updatedAt: undefined });
    setUploadProgress(0);
    setUploadSpeedBps(0);
    setUploadEtaSec(null);
    onUpdate('processingStatus', 'PENDING');
    onUpdate('videoFileName', file.name);
    updateUploadSnapshot({ progress: 0, speedBps: 0, etaSec: null });
    isPollingRef.current = false;
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);

    try {
      const totalStartedAt = performance.now();
      let phaseStartedAt = totalStartedAt;
      const logTiming = (phase: string, extra: Record<string, unknown> = {}) => {
        if (!import.meta.env.DEV) return;
        console.info('[LessonVideoUploader] upload timing', {
          phase,
          assetId,
          fileName: file.name,
          sizeMiB: Math.round((file.size / 1024 / 1024) * 10) / 10,
          elapsedMs: Math.round(performance.now() - phaseStartedAt),
          totalMs: Math.round(performance.now() - totalStartedAt),
          ...extra,
        });
        phaseStartedAt = performance.now();
      };

      const initRes = await initiateVideoUpload({
        courseId,
        lessonId,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      });
      if (initRes.status === 'ERR' || !initRes.data?._id) throw new Error(initRes.message || 'Không khởi tạo được upload.');
      assetId = initRes.data._id;
      onUpdate('videoAssetId', assetId);
      setAssetMeta((p) => p ? { ...p, _id: assetId! } : p);
      updateUploadSnapshot({ assetId });
      logTiming('initiate-upload');

      const loaded = [0];
      let t0 = Date.now(), bytes0 = 0;

      // Cập nhật progress tổng, tốc độ upload và ETA.
      // Progress này là progress browser PUT lên MinIO, không phải progress xử lý FFmpeg.
      const tick = (delta: number) => {
        bytes0 += delta;
        const elapsed = (Date.now() - t0) / 1000;
        if (elapsed >= 1) {
          const bps = bytes0 / elapsed;
          setUploadSpeedBps(bps);
          const done = loaded.reduce((a, b) => a + b, 0);
          const etaSec = bps > 0 ? Math.ceil((file.size - done) / bps) : null;
          setUploadEtaSec(etaSec);
          updateUploadSnapshot({ speedBps: bps, etaSec });
          t0 = Date.now(); bytes0 = 0;
        }
        const progress = Math.min(Math.round((loaded.reduce((a, b) => a + b, 0) / file.size) * 100), 99);
        setUploadProgress(progress);
        updateUploadSnapshot({ progress });
      };

      // Bước 2: batch presign + parallel multipart upload.
      const storageUploadStartedAt = performance.now();
      const totalParts = Math.ceil(file.size / CHUNK_SIZE);
      const batchRes = await getBatchPartPresignedUrls(assetId, totalParts);
      if (batchRes.status === 'ERR' || !batchRes.data?.urls?.length) throw new Error('Không lấy được URL upload.');
      const urls = batchRes.data.urls;
      const parts = new Array<{ ETag: string; PartNumber: number }>(totalParts);
      const partLoaded = new Array<number>(totalParts).fill(0);

      const tickPart = (partIndex: number, nextLoadedBytes: number) => {
        const delta = nextLoadedBytes - partLoaded[partIndex];
        partLoaded[partIndex] = nextLoadedBytes;
        loaded[0] = partLoaded.reduce((a, b) => a + b, 0);
        tick(delta);
      };

      // Upload một chunk lên MinIO bằng presigned URL.
      // Không set Content-Type ở đây để tránh lệch chữ ký presigned URL.
      const uploadPart = async (i: number) => {
        const chunk = file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        const etag = await new Promise<string>((res, rej) => {
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', urls[i], true);
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) tickPart(i, e.loaded);
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const etag = xhr.getResponseHeader('etag');
              if (etag) { tickPart(i, chunk.size); res(etag); }
              else rej(new Error(`Part ${i + 1} thiếu ETag.`));
            } else rej(new Error(`Part ${i + 1} lỗi HTTP ${xhr.status}.`));
          };
          xhr.onerror = () => rej(new Error(`Part ${i + 1}: lỗi mạng.`));
          xhr.send(chunk);
        });
        parts[i] = { ETag: etag, PartNumber: i + 1 };
      };

      // Worker pool: nhiều worker cùng lấy part tiếp theo để upload song song.
      let next = 0;
      const worker = async () => { while (next < totalParts) { const i = next++; await uploadPart(i); } };
      await Promise.all(Array.from({ length: Math.min(CONCURRENCY, totalParts) }, worker));
      if (parts.some((p) => !p)) throw new Error('Upload chưa hoàn tất đủ parts.');

      const storageUploadMs = performance.now() - storageUploadStartedAt;
      const averageBps = file.size / Math.max(storageUploadMs / 1000, 0.001);
      logTiming('put-to-storage', { averageMBps: Math.round((averageBps / 1024 / 1024) * 100) / 100 });

      setUploadProgress(100);
      updateUploadSnapshot({ progress: 100, speedBps: 0, etaSec: null });

      // Bước 3: bind asset vào lesson trước khi confirm.
      // Video nhỏ có thể xử lý xong rất nhanh sau confirm.
      // Nếu bind sau confirm, event READY có thể về trước khi lesson có videoAssetId.
      const bindRes = await bindVideoAssetToLesson(courseId, lessonId, assetId);
      if (bindRes.status === 'ERR') throw new Error(bindRes.message || 'Không thể gắn video vào bài học.');
      bound = true;
      logTiming('bind-video-asset');

      // Bước 4: confirm → media-service bắt đầu xử lý HLS.
      const confirmRes = await confirmVideoUpload(assetId, parts);
      if (confirmRes.status === 'ERR') throw new Error(confirmRes.message || 'Confirm upload thất bại.');
      confirmed = true;
      logTiming('confirm-upload');

      onUpdate('processingStatus', 'PROCESSING');
      setAssetMeta((p) => p ? { ...p, status: 'UPLOADED', processingProgress: 5 } : p);
      emitUploadSnapshot(uploadKey, null);
      startPolling(assetId, true);
      void onRefresh?.();
    } catch (err) {
      // Nếu lỗi trước khi confirm thành công, hủy multipart session để tránh asset/file mồ côi.
      emitUploadSnapshot(uploadKey, null);
      if (assetId && !confirmed) {
        await abortVideoUpload(assetId).catch(() => {});
        if (bound) await removeVideoAssetFromLesson(courseId, lessonId).catch(() => {});
        onUpdate('videoAssetId', undefined);
      }
      throw err;
    }
  };

  // Validate file được chọn rồi chạy upload.
  const handleFile = async (file: File) => {
    if (!file.type.startsWith('video/')) { toast.error('Vui lòng chọn file video hợp lệ.'); return; }
    try {
      await uploadVideo(file);
      toast.success('Đã tải video lên, hệ thống sẽ xử lý nền.');
    } catch (e: unknown) {
      onUpdate('processingStatus', 'FAILED');
      setUploadProgress(0);
      toast.error(e instanceof Error ? e.message : 'Upload video thất bại.');
    }
  };

  // Gỡ video khỏi lesson. Course-service sẽ phát cleanup event để media-service xóa file.
  const handleRemove = async () => {
    if (!lessonId) { resetState(); return; }
    if (status === 'PENDING' && lesson.videoAssetId) await abortVideoUpload(lesson.videoAssetId).catch(() => {});
    try {
      const r = await removeVideoAssetFromLesson(courseId, lessonId);
      if (r.status === 'ERR') throw new Error(r.message);
      resetState();
      await onRefresh?.();
      toast.success('Đã gỡ video khỏi bài học.');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Gỡ video thất bại.');
    }
  };

  // Reset toàn bộ state UI về trạng thái chưa có video.
  const resetState = () => {
    isPollingRef.current = false;
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    if (lessonId) emitUploadSnapshot(lessonId, null);
    setAssetMeta(null);
    setUploadProgress(0);
    hydratedAssetIdRef.current = null;
    onUpdate('processingStatus', 'NONE');
    onUpdate('videoAssetId', undefined);
    onUpdate('videoFileName', undefined);
    onUpdate('processingProgress', undefined);
    onUpdate('videoDurationSec', undefined);
    onUpdate('status', 'DRAFT');
  };

  // Input file ẩn được dùng lại cho upload mới, đổi video và thử lại.
  const fileInput = (
    <input ref={fileInputRef} type="file" accept="video/*" className="hidden"
      onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); e.target.value = ''; }} />
  );

  // Các giá trị hiển thị được gom lại để JSX phía dưới ngắn hơn.
  const name = assetMeta?.originalFileName || lesson.videoFileName || 'Video bài học';
  const size = fmt.size(assetMeta?.sourceSizeBytes);
  const progress = clamp(assetMeta?.processingProgress ?? lesson.processingProgress);
  const duration = assetMeta?.durationSec || lesson.videoDurationSec || lesson.duration || 0;
  const helperText = processingElapsed >= 180
    ? 'Video đang xử lý lâu hơn bình thường. Bạn có thể quay lại sau.'
    : processingElapsed >= 60
      ? 'Video vẫn đang xử lý. Không cần giữ tab này mở.'
      : 'Video sẽ sẵn sàng sau vài phút. Bạn có thể tiếp tục chỉnh sửa.';

  // Chưa có lessonId nghĩa là lesson chưa được lưu, nên chưa thể bind media asset.
  if (!lessonId) return (
    <div className="mt-2 rounded-lg border border-dashed border-amber-200 bg-amber-50/60 px-3 py-2.5 text-xs text-amber-600 dark:border-amber-500/20 dark:bg-amber-500/5 dark:text-amber-400">
      Lưu thông tin khóa học trước để có thể tải video lên.
    </div>
  );

  // Chưa có video: hiển thị dropzone.
  if (status === 'NONE') return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} // Khi kéo vào ngăn chặn trình duyệt mở video
      onDragLeave={() => setIsDragging(false)} // Khi kéo ra thì reset lại trạng thái
      onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) void handleFile(f); }} // Khi thả vào thì xử lý file
      onClick={() => fileInputRef.current?.click()} // Khi click vào thì mở file explorer
      className={`mt-2 flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed px-4 py-3 transition-all duration-200 group ${isDragging ? 'border-primary bg-primary/5' : 'border-zinc-200 hover:border-primary/50 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800/50'}`}
    >
      {fileInput}
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${isDragging ? 'bg-primary/15' : 'bg-zinc-100 group-hover:bg-primary/10 dark:bg-zinc-800'}`}>
        <Upload className={`h-4 w-4 transition-colors ${isDragging ? 'text-primary' : 'text-zinc-400 group-hover:text-primary'}`} />
      </div>
      <div>
        <p className="text-sm font-medium text-zinc-600 transition-colors group-hover:text-zinc-900 dark:text-zinc-400 dark:group-hover:text-white">
          {isDragging ? 'Thả video vào đây...' : 'Tải video lên'}
        </p>
        <p className="mt-0.5 text-xs text-zinc-400">MP4, MOV, AVI, MKV</p>
      </div>
    </div>
  );

  // Đang upload từ browser lên MinIO.
  if (status === 'PENDING') {
    const spd = fmt.speed(uploadSpeedBps);
    const eta = uploadEtaSec && uploadEtaSec > 0 ? fmt.eta(uploadEtaSec) : null;
    return (
      <div className="mt-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-500/20 dark:bg-blue-500/10">
        <div className="flex items-center gap-3">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-blue-500" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-medium text-blue-700 dark:text-blue-300">Đang tải lên — {Math.round(uploadProgress)}%</p>
              {spd && <span className="shrink-0 text-xs text-blue-500">{spd}{eta ? ` · còn ${eta}` : ''}</span>}
            </div>
            <p className="mt-0.5 truncate text-xs text-blue-500">{name}{size ? ` · ${size}` : ''}</p>
          </div>
        </div>
        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-blue-100 dark:bg-blue-500/20">
          <div className="h-full rounded-full bg-blue-500 transition-all duration-200 ease-out" style={{ width: `${uploadProgress}%` }} />
        </div>
        <p className="mt-2 text-xs text-blue-400">
          Đừng đóng tab này trong khi đang tải lên.
        </p>
      </div>
    );
  }

  // Đang xử lý HLS ở backend sau khi upload đã hoàn tất.
  if (status === 'PROCESSING') return (
    <div className="mt-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 dark:border-violet-500/20 dark:bg-violet-500/10">
      <div className="flex items-center gap-3">
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-violet-500" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-violet-700 dark:text-violet-300">Đang xử lý video</p>
            {progress > 5 && <span className="text-sm font-semibold text-violet-600 dark:text-violet-400">{progress}%</span>}
          </div>
          <p className="mt-0.5 truncate text-xs text-violet-500">{name}</p>
        </div>
      </div>
      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-violet-100 dark:bg-violet-500/20">
        {progress > 5
          ? <div className="h-full rounded-full bg-violet-500 transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
          : <div className="h-full w-full animate-pulse rounded-full bg-violet-400" />}
      </div>
      <p className="mt-2 text-xs text-violet-400">{helperText}</p>
    </div>
  );

  // Video đã xử lý xong và sẵn sàng phát.
  if (status === 'DONE') return (
    <div className="mt-2 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-3.5 py-2.5 dark:border-green-500/20 dark:bg-green-500/10">
      {fileInput}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-500/15">
        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-green-700 dark:text-green-300">{name}</p>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-green-600 dark:text-green-500">
          <span>Sẵn sàng phát</span>
          {duration > 0 && <><span className="opacity-40">·</span><span className="flex items-center gap-1"><Play className="h-2.5 w-2.5" />{fmt.duration(duration)}</span></>}
          {size && <><span className="opacity-40">·</span><span>{size}</span></>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button type="button" onClick={() => fileInputRef.current?.click()}
          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-500/20">
          Đổi video
        </button>
        <button type="button" onClick={() => void handleRemove()} title="Xóa video"
          className="rounded-lg p-1.5 text-green-400 transition-colors hover:bg-green-100 hover:text-green-600 dark:hover:bg-green-500/20">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  // Video xử lý thất bại.
  return (
    <div className="mt-2 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 dark:border-red-500/20 dark:bg-red-500/10">
      {fileInput}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/15">
        <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-red-700 dark:text-red-300">Xử lý video thất bại</p>
        <p className="mt-0.5 text-xs text-red-400">
          {assetMeta?.errorMessage || 'Vui lòng thử tải lên lại.'}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button type="button" onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-200 dark:bg-red-500/20 dark:text-red-400 dark:hover:bg-red-500/30">
          <RotateCcw className="h-3.5 w-3.5" /> Thử lại
        </button>
        <button type="button" onClick={() => void handleRemove()} title="Xóa"
          className="rounded-lg p-1.5 text-red-400 transition-colors hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-500/20">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
