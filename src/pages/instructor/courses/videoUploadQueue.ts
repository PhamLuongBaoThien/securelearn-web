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

const toSnapshot = (job: VideoUploadQueueJob): VideoUploadQueueJobSnapshot => ({
  id: job.id,
  lessonId: job.lessonId,
  fileName: job.fileName,
  status: job.status,
  progress: job.progress,
  speedBps: job.speedBps,
  etaSec: job.etaSec,
});

// Bắn snapshot mới cho UI. Store giữ job thật, component chỉ nhận bản sao nhẹ để render.
const emit = () => {
  const snapshot = jobs.map(toSnapshot);
  listeners.forEach((listener) => listener(snapshot));
};

const getVideoUploadQueueSnapshot = () => jobs.map(toSnapshot);

// Component gọi hàm này để theo dõi danh sách queue.
// Tác dụng: mọi LessonVideoUploader trong cùng tab đồng bộ chung một hàng đợi.
export const subscribeVideoUploadQueue = (listener: Listener) => {
  listeners.add(listener);
  listener(getVideoUploadQueueSnapshot());
  return () => {
    listeners.delete(listener);
  };
};

export const updateVideoUploadQueueJob = (
  jobId: string,
  patch: Partial<Pick<VideoUploadQueueJobSnapshot, 'status' | 'progress' | 'speedBps' | 'etaSec'>>,
) => {
  const job = jobs.find((item) => item.id === jobId);
  if (!job) return;
  Object.assign(job, patch);
  emit();
};

// dequeue nội bộ: lấy phần tử queued đầu tiên nhưng không expose ra UI.
// UI chỉ enqueue/cancel; quyền quyết định chạy job tiếp theo nằm ở processNext.
const dequeueNext = () => jobs.find((job) => job.status === 'queued');

// Runner tuần tự của queue.
// Nếu chưa có job active, lấy job đầu tiên đang queued, chuyển sang uploading,
// truyền AbortSignal vào upload flow, rồi tự chạy job kế tiếp khi xong/lỗi/hủy.
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

// enqueue: thêm file vào cuối hàng đợi và kích hoạt runner nếu queue đang rảnh.
// run(jobId, signal) là upload flow thật của LessonVideoUploader.
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

// cancel: hủy job đang chờ hoặc đang upload.
// Nếu đang upload, AbortController sẽ dừng các XMLHttpRequest PUT part hiện tại.
export const cancelVideoUpload = (jobId: string) => {
  const job = jobs.find((item) => item.id === jobId);
  if (!job || job.status === 'done' || job.status === 'failed' || job.status === 'canceled') return;
  job.status = 'canceled';
  job.speedBps = 0;
  job.etaSec = null;
  job.controller?.abort();
  emit();
};
