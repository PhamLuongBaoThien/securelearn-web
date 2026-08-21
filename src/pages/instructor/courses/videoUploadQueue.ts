// Queue upload video chạy trong memory của tab hiện tại.
// Công dụng chính:
// 1. enqueueVideoUpload: thêm video vào hàng đợi.
// 2. processNext/dequeueNext: chỉ cho 1 video chạy tại một thời điểm.
// 3. updateVideoUploadQueueJob: nhận progress từ upload flow để UI hiển thị.
// 4. cancelVideoUpload: hủy job queued/uploading bằng AbortController.
export type VideoUploadQueueStatus = 'queued' | 'uploading' | 'done' | 'failed' | 'canceled';

export type VideoUploadQueueJobSnapshot = {
  id: string;
  lessonId: string;
  fileName: string;
  status: VideoUploadQueueStatus;
  progress: number;
  speedBps: number;
  etaSec: number | null;
};

type VideoUploadQueueJob = VideoUploadQueueJobSnapshot & {
  run: (jobId: string, signal: AbortSignal) => Promise<void>;
  controller?: AbortController;
};

type Listener = (jobs: VideoUploadQueueJobSnapshot[]) => void;

const jobs: VideoUploadQueueJob[] = [];
const listeners = new Set<Listener>();
let activeJobId: string | null = null;

/** Loại bỏ callback và AbortController trước khi chuyển dữ liệu job cho giao diện. */
const toSnapshot = (job: VideoUploadQueueJob): VideoUploadQueueJobSnapshot => ({
  id: job.id,
  lessonId: job.lessonId,
  fileName: job.fileName,
  status: job.status,
  progress: job.progress,
  speedBps: job.speedBps,
  etaSec: job.etaSec,
});

/** Bắn snapshot mới cho UI; store giữ job thật, component chỉ nhận bản sao nhẹ để render. */
const emit = () => {
  const snapshot = jobs.map(toSnapshot);
  listeners.forEach((listener) => listener(snapshot));
};

/** Tạo ảnh chụp hiện tại của hàng đợi để subscriber không sửa trực tiếp job nội bộ. */
const getVideoUploadQueueSnapshot = () => jobs.map(toSnapshot);

/**
 * Đăng ký theo dõi hàng đợi để mọi LessonVideoUploader trong cùng tab hiển thị cùng trạng thái.
 * Hàm trả về callback cleanup dùng khi component unmount.
 */
export const subscribeVideoUploadQueue = (listener: Listener) => {
  listeners.add(listener);
  listener(getVideoUploadQueueSnapshot());
  return () => {
    listeners.delete(listener);
  };
};

/** Cập nhật trạng thái/progress/tốc độ/ETA của một job và thông báo lại cho giao diện. */
export const updateVideoUploadQueueJob = (
  jobId: string,
  patch: Partial<Pick<VideoUploadQueueJobSnapshot, 'status' | 'progress' | 'speedBps' | 'etaSec'>>,
) => {
  const job = jobs.find((item) => item.id === jobId);
  if (!job) return;
  Object.assign(job, patch);
  emit();
};

/** Lấy job đang chờ đầu tiên; quyền chọn job chạy tiếp theo chỉ nằm trong module queue. */
const dequeueNext = () => jobs.find((job) => job.status === 'queued');

/**
 * Runner tuần tự: lấy job chờ đầu tiên, truyền AbortSignal vào upload flow và tự chạy job kế tiếp.
 * Queue chỉ cho một video thực hiện luồng upload tại một thời điểm trong cùng tab.
 */
const processNext = () => {
  if (activeJobId) return;
  const job = dequeueNext();
  if (!job) return;

  activeJobId = job.id;
  job.controller = new AbortController();
  job.status = 'uploading';
  job.progress = 0;
  job.speedBps = 0;
  job.etaSec = null;
  emit();

  void job.run(job.id, job.controller.signal)
    .then(() => {
      if (job.status !== 'canceled') {
        job.status = 'done';
        job.progress = 100;
        job.speedBps = 0;
        job.etaSec = null;
      }
    })
    .catch(() => {
      if (job.status !== 'canceled') {
        job.status = 'failed';
        job.speedBps = 0;
        job.etaSec = null;
      }
    })
    .finally(() => {
      job.controller = undefined;
      activeJobId = null;
      emit();
      processNext();
    });
};

/**
 * Thêm file vào cuối hàng đợi và kích hoạt runner nếu queue rảnh.
 * `run(jobId, signal)` là toàn bộ upload flow do LessonVideoUploader cung cấp.
 */
export const enqueueVideoUpload = (input: {
  lessonId: string;
  file: File;
  run: (jobId: string, signal: AbortSignal) => Promise<void>;
}) => {
  const id = `${input.lessonId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const job: VideoUploadQueueJob = {
    id,
    lessonId: input.lessonId,
    fileName: input.file.name,
    status: 'queued',
    progress: 0,
    speedBps: 0,
    etaSec: null,
    run: input.run,
  };
  jobs.push(job);
  emit();
  processNext();
  return id;
};

/**
 * Hủy job đang chờ hoặc đang upload; AbortController dừng các XMLHttpRequest PUT part hiện tại.
 */
export const cancelVideoUpload = (jobId: string) => {
  const job = jobs.find((item) => item.id === jobId);
  if (!job || job.status === 'done' || job.status === 'failed' || job.status === 'canceled') return;
  job.status = 'canceled';
  job.speedBps = 0;
  job.etaSec = null;
  job.controller?.abort();
  emit();
};
