// Component upload video cho 1 bài học của instructor.
// Thứ tự flow chính:
// 1. User chọn file → handleFile validate nhẹ và enqueue job vào videoUploadQueue.
// 2. Queue tới lượt → uploadVideo chạy initiate → batch presign URLs → PUT chunks song song.
// 3. PUT xong → bind asset vào lesson → confirm multipart upload.
// 4. Backend xử lý HLS → startPolling/syncAssetState cập nhật trạng thái READY/FAILED.
// 5. User hủy → cancelVideoUpload abort XHR, cleanup multipart nếu đã tạo asset.
import React, { useEffect, useRef, useState } from 'react';
import { Upload, CheckCircle2, AlertCircle, RotateCcw, X, Loader2, Play } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { ILesson, LessonStatus, VideoProcessingStatus } from '@/services/courseApi';
import { bindVideoAssetToLesson, removeVideoAssetFromLesson } from '@/services/courseApi';
import {
  getVideoAsset, initiateVideoUpload, getBatchPartPresignedUrls,
  confirmVideoUpload, abortVideoUpload, type IVideoAsset,
} from '@/services/mediaApi';
import {
  cancelVideoUpload, // hủy job đang chờ hoặc đang upload.
  enqueueVideoUpload, // đưa file vào hàng đợi.
  subscribeVideoUploadQueue, // component lắng nghe queue để biết job nào đang chạy.
  updateVideoUploadQueueJob, // component lắng nghe queue để biết job nào đang chạy.
  type VideoUploadQueueJobSnapshot,
} from './videoUploadQueue';

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
  phase: 'queued' | 'uploading'; // queued: chờ lượt trong FE queue; uploading: đang PUT chunks lên storage
  progress: number;
  speedBps: number;
  etaSec: number | null;
};

// Store progress upload ở cấp module để không mất tiến độ khi component bị unmount.
// Ví dụ: user thu nhỏ lesson row rồi mở lại trong khi browser vẫn đang PUT lên MinIO.
// Store này chỉ sống trong cùng tab hiện tại, không dùng để resume sau khi refresh trang.
const uploadSnapshots = new Map<string, UploadSnapshot>(); // key là lessonId, value là snapshot tiến độ upload hiện tại của bài học đó
const uploadListeners = new Map<string, Set<(snapshot: UploadSnapshot | null) => void>>(); // key là lessonId, value là tập hợp các callback đang subscribe để nhận thông báo khi snapshot của bài học đó thay đổi

// Cập nhật snapshot upload và thông báo cho mọi instance LessonVideoUploader
// đang subscribe cùng lessonId.
const emitUploadSnapshot = (key: string, snapshot: UploadSnapshot | null) => {
  if (snapshot) uploadSnapshots.set(key, snapshot);
  else uploadSnapshots.delete(key); // Nếu snapshot = null nghĩa là upload đã xong hoặc bị hủy, xóa luôn khỏi store để tránh nhầm lẫn khi mở lại component mới sau này.
  uploadListeners.get(key)?.forEach((listener) => listener(snapshot)); // Khi có snapshot mới, gọi tất cả callback đang đăng ký để họ cập nhật giao diện
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
  // --- STATE QUẢN LÝ GIAO DIỆN VÀ DỮ LIỆU ---
  // assetMeta: Lưu toàn bộ thông tin chi tiết của video (tên, dung lượng, % xử lý...) kéo từ media-service về.
  const [assetMeta, setAssetMeta] = useState<AssetMeta | null>(null);
  // uploadProgress: Phần trăm quá trình trình duyệt đẩy file lên MinIO (0-100%)
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadPhase, setUploadPhase] = useState<'queued' | 'uploading'>('uploading');
  // uploadSpeedBps: Tốc độ mạng đang tải lên (Byte / giây)
  const [uploadSpeedBps, setUploadSpeedBps] = useState(0);
  // uploadEtaSec: Thời gian ước tính còn lại để tải xong (Giây)
  const [uploadEtaSec, setUploadEtaSec] = useState<number | null>(null);
  // processingElapsed: Đếm số giây video đã nằm ở trạng thái PROCESSING (để hiện cảnh báo nếu FFmpeg chạy quá lâu)
  const [processingElapsed, setProcessingElapsed] = useState(0);
  // isDragging: Trạng thái UI khi người dùng đang giữ chuột kéo file lơ lửng trên vùng dropzone
  const [isDragging, setIsDragging] = useState(false);
  // Snapshot queue toàn tab. Component chỉ dùng job của lesson hiện tại để lấy progress và jobId khi hủy.
  const [queueJobs, setQueueJobs] = useState<VideoUploadQueueJobSnapshot[]>([]);

  // --- REFS LƯU TRỮ GIÁ TRỊ (KHÔNG LÀM RENDER LẠI COMPONENT) ---
  const fileInputRef = useRef<HTMLInputElement>(null); // Dùng để gọi click() mở hộp thoại chọn file ẩn
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null); // Lưu ID của bộ hẹn giờ polling API
  const pollDelayRef = useRef(POLL_INITIAL_MS); // Khoảng thời gian chờ giữa 2 lần gọi API polling (sẽ tự động tăng dần)
  const isPollingRef = useRef(false); // Cờ cắm đánh dấu "đang trong quá trình poll hay không"
  const onUpdateRef = useRef(onUpdate); // Lưu callback onUpdate mới nhất để gọi trong useEffect mà không bị cảnh báo lặp
  
  // Dùng ref này để đánh dấu asset nào ĐÃ ĐƯỢC kéo dữ liệu chi tiết về, tránh việc component re-render làm gọi API liên tục.
  const hydratedAssetIdRef = useRef<string | null>(null);

  // Ưu tiên assetMeta local vì nó là trạng thái mới nhất trong component.
  // Nếu chưa có assetMeta thì fallback về lesson prop lấy từ course-service.
  const status: VideoProcessingStatus = assetMeta?.status
    ? mapAssetStatus(assetMeta.status)
    : (lesson.processingStatus ?? mapLessonStatus(lesson.status, lesson.videoAssetId));

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  // Theo dõi queue store để khung upload biết job hiện tại đang queued/uploading và có thể hủy.
  useEffect(() => subscribeVideoUploadQueue(setQueueJobs), []);

  // EFFECT 1: ĐĂNG KÝ THEO DÕI TIẾN ĐỘ UPLOAD TOÀN CỤC (GLOBAL SUBSCRIPTION)
  // Rất quan trọng: Nếu user đang upload mà nhấn thu nhỏ bài học (unmount component) rồi mở lại,
  // biến state local sẽ bị mất. Effect này sẽ đọc tiến độ lưu trong biến toàn cục `uploadSnapshots` 
  // và khôi phục lại giao diện tải lên y như cũ.
  useEffect(() => {
    if (!lessonId) return;
    return subscribeUploadSnapshot(lessonId, (snapshot) => {
      if (!snapshot) return;
      // Khôi phục progress upload khi component bị unmount rồi mount lại.
      // Backend không biết browser đã PUT được bao nhiêu byte, nên thông tin này phải giữ hoàn toàn ở frontend.
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
      setUploadPhase(snapshot.phase);
      setUploadSpeedBps(snapshot.speedBps);
      setUploadEtaSec(snapshot.etaSec);
      if (snapshot.assetId) onUpdateRef.current('videoAssetId', snapshot.assetId);
      onUpdateRef.current('videoFileName', snapshot.fileName);
      onUpdateRef.current('processingStatus', 'PENDING');
    });
  }, [lessonId]);

  // EFFECT 2: DỌN DẸP KHI ĐÓNG COMPONENT (CLEANUP)
  // Nếu user chuyển trang hoặc đóng bài học, phải dập tắt ngay vòng lặp polling API ngầm.
  useEffect(() => () => {
    isPollingRef.current = false;
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
  }, []);

  // EFFECT 3: BỘ ĐẾM THỜI GIAN XỬ LÝ (PROCESSING TIMER)
  // Chỉ kích hoạt khi trạng thái là PROCESSING. Sau 1 phút, 3 phút, giao diện sẽ đổi text 
  // báo cho user biết hệ thống vẫn đang chạy, để user không bị hoang mang.
  useEffect(() => {
    if (status !== 'PROCESSING') { setProcessingElapsed(0); return; }
    const t0 = Date.now();
    const id = setInterval(() => setProcessingElapsed(Math.floor((Date.now() - t0) / 1000)), 1000);
    return () => clearInterval(id);
  }, [status, assetMeta?._id]);

  // EFFECT 4: KÉO DỮ LIỆU CHI TIẾT KHI MỞ TRANG (HYDRATION)
  // Khi mở editor, DB (course-service) chỉ lưu mỗi cái ID của video (`lesson.videoAssetId`).
  // Cần gọi API sang media-service kéo toàn bộ chi tiết (tên file, tiến độ 50%, độ dài...) về hiển thị.
  useEffect(() => {
    if (!lesson.videoAssetId || hydratedAssetIdRef.current === lesson.videoAssetId) return;
    hydratedAssetIdRef.current = lesson.videoAssetId;
    void syncAssetState(lesson.videoAssetId).then((s) => {
      if (s === 'PROCESSING') startPolling(lesson.videoAssetId!);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.videoAssetId]);

  // HÀM ĐỒNG BỘ TRẠNG THÁI (SYNC ASSET STATE)
  // Gọi API lấy dữ liệu video mới nhất và cập nhật toàn bộ Form (thông qua onUpdate) và UI local.
  const syncAssetState = async (id: string): Promise<VideoProcessingStatus | null> => {
    const res = await getVideoAsset(id);
    if (res.status === 'ERR' || !res.data) return null;
    const a = res.data;
    setAssetMeta({ _id: a._id, status: a.status, originalFileName: a.originalFileName,
      mimeType: a.mimeType, sourceSizeBytes: a.sourceSizeBytes, durationSec: a.durationSec,
      processingProgress: a.processingProgress, errorMessage: a.errorMessage,
      uploadCompletedAt: a.uploadCompletedAt, updatedAt: a.updatedAt });
    
    // Bắn dữ liệu cập nhật ngược lại form tổng (CourseEditor)
    onUpdate('videoAssetId', a._id);
    onUpdate('videoFileName', a.originalFileName || lesson.videoFileName);
    onUpdate('videoDurationSec', a.durationSec || lesson.videoDurationSec || 0);
    onUpdate('processingProgress', clamp(a.processingProgress));
    onUpdate('processingStatus', mapAssetStatus(a.status));
    
    const ls = assetToLessonStatus(a.status);
    if (ls) onUpdate('status', ls); // Chuyển status của Lesson thành READY nếu video xử lý xong
    
    // Nếu xử lý xong hoặc lỗi hẳn, tắt polling API đi và refresh course data
    if (a.status === 'READY' || a.status === 'FAILED') {
      isPollingRef.current = false;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      // Refresh course data để backend trả về duration, status mới nhất
      // và đồng thời invalidate cache danh sách khóa học (myCourses)
      void onRefresh?.(); // hàm onRefresh này được truyền từ CourseEditor
    }
    return mapAssetStatus(a.status);
  };

  // HÀM POLLING: KIỂM TRA TRẠNG THÁI LIÊN TỤC
  // Sau khi video tải lên thành công, Backend bắt đầu convert (HLS). 
  // Frontend phải hỏi BE liên tục: "Xong chưa? Xong chưa?"
  // Áp dụng thuật toán Exponential Backoff: Khoảng cách giữa các lần hỏi sẽ giãn dần ra (3s -> 4.2s -> 6s -> ... max 15s) 
  // để chống sập server do bị spam request.
  const startPolling = (id: string, immediate = false) => {
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    isPollingRef.current = true; // Bật cờ cho phép chạy
    pollDelayRef.current = POLL_INITIAL_MS; // Reset bộ đếm về 3 giây ban đầu
    
    const schedule = () => {
      pollTimerRef.current = setTimeout(async () => {
        let next: VideoProcessingStatus | null = null;
        try { next = await syncAssetState(id); } catch { next = 'PROCESSING'; }
        
        // Nếu vẫn đang xử lý, tăng delay lên 1.4 lần và tự gọi lại chính nó
        if (isPollingRef.current && next === 'PROCESSING') {
          pollDelayRef.current = Math.min(pollDelayRef.current * POLL_MULT, POLL_MAX_MS);
          schedule();
        }
      }, pollDelayRef.current);
    };
    
    // immediate = true nghĩa là gọi API ngay lập tức 1 lần trước khi hẹn giờ chạy lặp
    if (immediate) void syncAssetState(id).then((s) => { if (s === 'PROCESSING') schedule(); });
    else schedule();
  };

  // QUY TRÌNH UPLOAD CHÍNH (MAIN UPLOAD FLOW)
  // Hàm này chỉ chạy khi queue gọi tới lượt job.
  // signal dùng để hủy giữa chừng: trước/sau mỗi API call đều kiểm tra, còn XMLHttpRequest thì abort trực tiếp.
  const uploadVideo = async (file: File, queueJobId: string, signal: AbortSignal) => {
    if (!lessonId) { toast.error('Lưu khóa học trước khi tải video lên.'); return; }
    if (signal.aborted) throw new Error('Đã hủy upload.');

    const uploadKey = lessonId;
    let assetId: string | undefined; // Sau bước initiateVideoUpload, backend trả về VideoAsset._id
    let confirmed = false; // chưa confirm upload với media-service, dùng cho cleanup khi lỗi
    let bound = false; // chưa gắn asset vào lesson (chưa gọi bindVideoAssetToLesson), cũng dùng cho cleanup

    // Snapshot dùng để khôi phục trạng thái nếu user chuyển tab
    let currentSnapshot: UploadSnapshot = {
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      phase: 'uploading',
      progress: 0,
      speedBps: 0,
      etaSec: null,
    };

    const updateUploadSnapshot = (patch: Partial<UploadSnapshot>) => {
      currentSnapshot = { ...currentSnapshot, ...patch };
      emitUploadSnapshot(uploadKey, currentSnapshot); // để lưu snapshot và báo cho UI
      updateVideoUploadQueueJob(queueJobId, {
        progress: currentSnapshot.progress,
        speedBps: currentSnapshot.speedBps,
        etaSec: currentSnapshot.etaSec,
        status: currentSnapshot.phase === 'queued' ? 'queued' : 'uploading',
      });
    }; // khi có assetId thì updateUploadSnapshot({ assetId });

    // Reset giao diện về trạng thái chuẩn bị upload
    setAssetMeta({ _id: '', status: 'UPLOADING', originalFileName: file.name, mimeType: file.type,
      sourceSizeBytes: file.size, durationSec: 0, processingProgress: 0,
      errorMessage: null, uploadCompletedAt: null, updatedAt: undefined });
    setUploadPhase('uploading');
    setUploadProgress(0);
    setUploadSpeedBps(0);
    setUploadEtaSec(null);
    onUpdate('processingStatus', 'PENDING');
    onUpdate('videoFileName', file.name);
    updateUploadSnapshot({ phase: 'uploading', progress: 0, speedBps: 0, etaSec: null });
    isPollingRef.current = false; // Tắt cờ polling đề phòng trường hợp user chọn file mới khi đang có 1 upload chưa xong, tránh việc 2 luồng upload cùng chạy song song
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current); // Dọn dẹp bộ hẹn giờ polling cũ nếu có, đề phòng trường hợp user chọn file mới khi đang có 1 upload chưa xong, tránh việc 2 luồng upload cùng chạy song song

    try {
      const totalStartedAt = performance.now(); // performance là API của trình duyệt để đo thời gian chính xác hơn Date.now()
      let phaseStartedAt = totalStartedAt;
      
      // Hàm ghi log đo lường xem mỗi giai đoạn tốn bao nhiêu thời gian (chỉ chạy ở dev mode)
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

      // BƯỚC 1: KHỞI TẠO (INITIATE)
      // Nói với backend: "Tui chuẩn bị đẩy file này lên nè, tạo record trong DB và cho tui cái ID đi"
      if (signal.aborted) throw new Error('Đã hủy upload.');
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

      // `loaded` lưu tổng số byte đã tải xong (dùng mảng 1 phần tử để pass-by-reference).
      // Được cập nhật mỗi khi có part nào đó báo tiến độ.
      const loaded = [0];
      
      // `t0`: Thời điểm chốt sổ gần nhất (để đo tốc độ mỗi giây).
      // `bytes0`: Tổng số byte tải được kể từ `t0`.
      let t0 = Date.now(), bytes0 = 0;

      // Hàm tick: Chịu trách nhiệm tính tốc độ, ETA, và cập nhật UI progress.
      // Được gọi liên tục mỗi khi có 1 chunk nào đó vừa tải thêm được 1 lượng byte (`delta`).
      const tick = (delta: number) => {
        bytes0 += delta; // Cộng dồn số byte vừa tải được vào biến của chu kỳ đo hiện tại
        const elapsed = (Date.now() - t0) / 1000; // Tính số giây đã trôi qua kể từ lần chốt sổ trước (t0)
        
        // Throttling: CHỈ tính toán lại tốc độ và ETA MỖI 1 GIÂY một lần (giúp UI không bị giật/nhảy số liên tục)
        if (elapsed >= 1) { 
          // 1. Tính tốc độ (bps - bytes per second)
          const bps = bytes0 / elapsed; 
          setUploadSpeedBps(bps); 
          
          // 2. Lấy tổng số byte đã tải của TOÀN BỘ file tính đến lúc này
          const done = loaded.reduce((a, b) => a + b, 0); 
          
          // 3. Tính thời gian còn lại (ETA) = Số byte còn lại / tốc độ hiện tại
          const etaSec = bps > 0 ? Math.ceil((file.size - done) / bps) : null; 
          setUploadEtaSec(etaSec);
          updateUploadSnapshot({ speedBps: bps, etaSec });
          
          // 4. Đặt lại đồng hồ và đếm byte về 0 để chuẩn bị đo cho 1 giây tiếp theo
          t0 = Date.now(); 
          bytes0 = 0;
        }
        
        // Tính phần trăm Progress (Cái này phải cập nhật UI liên tục để thanh progress bar chạy mượt).
        // Giới hạn max ở mức 99% (chờ BE xác nhận xong multipart upload mới cho lên 100%)
        const progress = Math.min(Math.round((loaded.reduce((a, b) => a + b, 0) / file.size) * 100), 99);
        setUploadProgress(progress);
        updateUploadSnapshot({ progress });
      };

      // BƯỚC 2: XIN ĐƯỜNG DẪN PRESIGNED VÀ TIẾN HÀNH UPLOAD
      const storageUploadStartedAt = performance.now(); // Dùng để đo tổng thời gian upload lên MinIO
      const totalParts = Math.ceil(file.size / CHUNK_SIZE);
      
      // Xin backend tạo 40 cái URLs nếu file có 40 parts (giả sử)
      if (signal.aborted) throw new Error('Đã hủy upload.');
      const batchRes = await getBatchPartPresignedUrls(assetId, totalParts);
      if (batchRes.status === 'ERR' || !batchRes.data?.urls?.length) throw new Error('Không lấy được URL upload.');
      const urls = batchRes.data.urls;
      const parts = new Array<{ ETag: string; PartNumber: number }>(totalParts);
      
      // `partLoaded` là mảng lưu xem MỖI PART đã tải được chính xác bao nhiêu byte.
      // Ví dụ file chia làm 40 parts thì mảng này có 40 phần tử. 
      // Do MinIO hỗ trợ upload song song, trình duyệt sẽ bắn event liên tục cho nhiều part xen kẽ nhau.
      const partLoaded = new Array<number>(totalParts).fill(0); 

      // Hàm tickPart: Hàm hứng event `onprogress` từ trình duyệt cho TỪNG PART.
      const tickPart = (partIndex: number, nextLoadedBytes: number) => {
        // 1. Tính số byte VỪA TẢI THÊM được kể từ lần event trước của CÙNG 1 PART
        const delta = nextLoadedBytes - partLoaded[partIndex]; 
        
        // 2. Cập nhật sổ ghi chép xem part này hiện đang ở mốc bao nhiêu byte
        partLoaded[partIndex] = nextLoadedBytes; 
        
        // 3. Tính tổng số byte đã tải của TOÀN BỘ file (bằng cách cộng lại tổng tiến độ của tất cả các part)
        loaded[0] = partLoaded.reduce((a, b) => a + b, 0); 
        
        // 4. Đẩy số byte vừa tải thêm (delta) qua hàm `tick` để tính tổng vận tốc của toàn hệ thống.
        tick(delta); 
      };

      // Hàm uploadPart: Bắn 1 part (chunk) trực tiếp lên MinIO thông qua Presigned URL bằng XMLHttpRequest (để track progress)
      // Lưu ý: Không set Content-Type ở đây để tránh làm sai lệch chữ ký (signature) của URL
      const uploadPart = async (i: number) => {
        if (signal.aborted) throw new Error('Đã hủy upload.');
        const chunk = file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        const etag = await new Promise<string>((res, rej) => {
          const xhr = new XMLHttpRequest();
          const abort = () => {
            xhr.abort();
            rej(new Error('Đã hủy upload.'));
          };
          if (signal.aborted) {
            abort();
            return;
          }
          signal.addEventListener('abort', abort, { once: true });
          xhr.open('PUT', urls[i], true);
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) tickPart(i, e.loaded);
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const etag = xhr.getResponseHeader('etag'); // Lấy chữ ký nhận dạng của đoạn file trên server (bắt buộc)
              signal.removeEventListener('abort', abort);
              if (etag) { tickPart(i, chunk.size); res(etag); }
              else rej(new Error(`Part ${i + 1} thiếu ETag.`));
            } else {
              signal.removeEventListener('abort', abort);
              rej(new Error(`Part ${i + 1} lỗi HTTP ${xhr.status}.`));
            }
          };
          xhr.onerror = () => {
            signal.removeEventListener('abort', abort);
            rej(new Error(`Part ${i + 1}: lỗi mạng.`));
          };
          xhr.send(chunk);
        });
        // Ghi chú lại ETag để xíu nữa gửi về cho BE kiểm tra tính toàn vẹn
        parts[i] = { ETag: etag, PartNumber: i + 1 };
      };

      // TẠO WORKER POOL ĐỂ UPLOAD SONG SONG
      // Giới hạn CONCURRENCY = 5 (tối đa 5 request chạy cùng lúc để không làm cháy mạng của trình duyệt)
      let next = 0;
      const worker = async () => { while (!signal.aborted && next < totalParts) { const i = next++; await uploadPart(i); } };
      await Promise.all(Array.from({ length: Math.min(CONCURRENCY, totalParts) }, worker));
      if (signal.aborted) throw new Error('Đã hủy upload.');
      if (parts.some((p) => !p)) throw new Error('Upload chưa hoàn tất đủ parts.');

      const storageUploadMs = performance.now() - storageUploadStartedAt;
      const averageBps = file.size / Math.max(storageUploadMs / 1000, 0.001);
      logTiming('put-to-storage', { averageMBps: Math.round((averageBps / 1024 / 1024) * 100) / 100 });

      setUploadProgress(100);
      updateUploadSnapshot({ progress: 100, speedBps: 0, etaSec: null });

      // BƯỚC 3: GẮN (BIND) VIDEO VÀO BÀI HỌC
      // Làm trước khi confirm để nhỡ server convert cực nhanh, bắn event về thì FE cũng biết là video này thuộc bài học này.
      if (signal.aborted) throw new Error('Đã hủy upload.');
      const bindRes = await bindVideoAssetToLesson(courseId, lessonId, assetId);
      if (bindRes.status === 'ERR') throw new Error(bindRes.message || 'Không thể gắn video vào bài học.');
      bound = true;
      logTiming('bind-video-asset');

      // BƯỚC 4: XÁC NHẬN (CONFIRM) HOÀN TẤT
      // Gửi danh sách ETag về cho BE. BE sẽ lệnh cho MinIO ghép 40 parts lại thành 1 file .mp4 duy nhất.
      // Sau đó BE đẩy file sang RabbitMQ để gọi worker chạy FFmpeg convert ra HLS.
      if (signal.aborted) throw new Error('Đã hủy upload.');
      const confirmRes = await confirmVideoUpload(assetId, parts);
      if (confirmRes.status === 'ERR') throw new Error(confirmRes.message || 'Confirm upload thất bại.');
      confirmed = true;
      logTiming('confirm-upload');

      onUpdate('processingStatus', 'PROCESSING');
      setAssetMeta((p) => p ? { ...p, status: 'UPLOADED', processingProgress: 5 } : p);
      emitUploadSnapshot(uploadKey, null);
      updateVideoUploadQueueJob(queueJobId, { progress: 100, speedBps: 0, etaSec: null });
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
      onUpdate('processingStatus', signal.aborted ? 'NONE' : 'FAILED');
      setUploadProgress(0);
      throw err;
    }
  };

  // Bước user chọn file: chỉ validate nhẹ + đưa vào queue.
  // Chưa gọi initiate-upload ở đây để tránh tạo multipart session khi job vẫn đang chờ.
  const handleFile = async (file: File) => {
//     enqueueVideoUpload
//     chờ tới lượt
//     queue gọi uploadVideo
//     lúc đó mới initiate-upload
    if (!file.type.startsWith('video/')) { toast.error('Vui lòng chọn file video hợp lệ.'); return; }
    if (!lessonId) { toast.error('Lưu khóa học trước khi tải video lên.'); return; }

    const queuedSnapshot: UploadSnapshot = {
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      phase: 'queued',
      progress: 0,
      speedBps: 0,
      etaSec: null,
    };
    setAssetMeta({ _id: '', status: 'UPLOADING', originalFileName: file.name, mimeType: file.type,
      sourceSizeBytes: file.size, durationSec: 0, processingProgress: 0,
      errorMessage: null, uploadCompletedAt: null, updatedAt: undefined });
    setUploadPhase('queued');
    setUploadProgress(0);
    setUploadSpeedBps(0);
    setUploadEtaSec(null);
    onUpdate('processingStatus', 'PENDING');
    onUpdate('videoFileName', file.name);
    emitUploadSnapshot(lessonId, queuedSnapshot);

    // Đưa file vào hàng đợi
    enqueueVideoUpload({
      lessonId,
      file,
      run: (jobId, signal) => uploadVideo(file, jobId, signal),
    });
    toast.info('Đã thêm video vào hàng đợi upload.');
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
    setUploadPhase('uploading');
    setUploadProgress(0);
    hydratedAssetIdRef.current = null;
    onUpdate('processingStatus', 'NONE');
    onUpdate('videoAssetId', undefined);
    onUpdate('videoFileName', undefined);
    onUpdate('processingProgress', undefined);
    onUpdate('videoDurationSec', undefined);
    onUpdate('status', 'DRAFT');
  };

  // Queue store có thể giữ cả job done/failed/canceled để debug nội bộ,
  // nhưng UI lesson chỉ cần biết job đang chờ/đang upload để hiển thị progress và nút hủy.
  const visibleQueueJobs = queueJobs.filter(
    (job) =>
      job.lessonId === lessonId &&
      (job.status === 'queued' || job.status === 'uploading'),
  );
  const activeQueueJob = visibleQueueJobs.find((job) => job.status === 'queued' || job.status === 'uploading');

  // Hủy từ UI: dừng queue job, xóa snapshot local và đưa lesson về dropzone nếu đang pending.
  const handleCancelQueueJob = (jobId: string) => {
    cancelVideoUpload(jobId);
    if (lessonId) emitUploadSnapshot(lessonId, null);
    if (status === 'PENDING') {
      resetState();
    }
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
    <>
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
    </>
  );

  // Đang upload từ browser lên MinIO.
  if (status === 'PENDING') {
    const isQueued = uploadPhase === 'queued' || activeQueueJob?.status === 'queued';
    const displayedProgress = activeQueueJob ? activeQueueJob.progress : uploadProgress;
    const spd = fmt.speed(activeQueueJob?.speedBps ?? uploadSpeedBps);
    const etaValue = activeQueueJob?.etaSec ?? uploadEtaSec;
    const eta = etaValue && etaValue > 0 ? fmt.eta(etaValue) : null;
    return (
      <>
        <div className="mt-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-500/20 dark:bg-blue-500/10">
          <div className="flex items-center gap-3">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-blue-500" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium text-blue-700 dark:text-blue-300">
                  {isQueued ? 'Đang chờ trong hàng đợi' : `Đang tải lên — ${Math.round(displayedProgress)}%`}
                </p>
                {!isQueued && spd && <span className="shrink-0 text-xs text-blue-500">{spd}{eta ? ` · còn ${eta}` : ''}</span>}
              </div>
              <p className="mt-0.5 truncate text-xs text-blue-500">{name}{size ? ` · ${size}` : ''}</p>
            </div>
            {activeQueueJob && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" onClick={() => handleCancelQueueJob(activeQueueJob.id)} className="h-8 w-8 shrink-0 rounded-lg text-blue-400 hover:bg-blue-100 hover:text-red-500 dark:hover:bg-blue-500/20">
                    <X className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Hủy upload</TooltipContent>
              </Tooltip>
            )}
          </div>
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-blue-100 dark:bg-blue-500/20">
            <div className="h-full rounded-full bg-blue-500 transition-all duration-200 ease-out" style={{ width: `${displayedProgress}%` }} />
          </div>
          <p className="mt-2 text-xs text-blue-400">
            {isQueued ? 'Video sẽ tự bắt đầu khi lượt upload hiện tại hoàn tất.' : 'Đừng đóng tab này trong khi đang tải lên.'}
          </p>
        </div>
      </>
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
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="h-8 rounded-lg px-2.5 text-xs text-green-700 hover:bg-green-100 hover:text-green-700 dark:text-green-400 dark:hover:bg-green-500/20 dark:hover:text-green-400"
        >
          Đổi video
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => void handleRemove()}
              className="h-8 w-8 rounded-lg text-green-400 hover:bg-green-100 hover:text-green-600 dark:hover:bg-green-500/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Xóa video</TooltipContent>
        </Tooltip>
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
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="h-8 gap-1.5 rounded-lg bg-red-100 px-3 text-xs text-red-600 hover:bg-red-200 hover:text-red-600 dark:bg-red-500/20 dark:text-red-400 dark:hover:bg-red-500/30 dark:hover:text-red-400"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Thử lại
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => void handleRemove()}
              className="h-8 w-8 rounded-lg text-red-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-500/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Xóa video lỗi</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};
