// File này là UI upload video thật cho lesson type VIDEO.
// Flow:
// - initiate asset
// - upload file
// - bind asset vào lesson
// - poll media-service để cập nhật processing status
import React, { useEffect, useRef, useState } from 'react';
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  X,
  Loader2,
  Play,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ILesson, VideoProcessingStatus } from '@/services/courseApi';
import { bindVideoAssetToLesson, removeVideoAssetFromLesson } from '@/services/courseApi';
import { completeVideoUpload, getVideoAsset, initiateVideoUpload } from '@/services/mediaApi';
import { Button } from '@/components/ui/button';

interface LessonVideoUploaderProps {
  courseId: string;
  lessonId?: string;
  lesson: ILesson;
  onUpdate: (field: keyof ILesson, value: any) => void;
}

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

const mapAssetStatus = (status?: string): VideoProcessingStatus => {
  if (status === 'READY') return 'DONE';
  if (status === 'FAILED') return 'FAILED';
  if (status === 'PROCESSING') return 'PROCESSING';
  if (status === 'UPLOADING' || status === 'INITIATED') return 'PENDING';
  return 'NONE';
};

export const LessonVideoUploader: React.FC<LessonVideoUploaderProps> = ({
  courseId,
  lessonId,
  lesson,
  onUpdate,
}) => {
  const status: VideoProcessingStatus = lesson.processingStatus ?? 'NONE';
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Poll trạng thái asset để phản ánh tiến trình encode HLS lên UI editor.
  const syncAssetState = async (videoAssetId: string) => {
    const response = await getVideoAsset(videoAssetId);
    if (response.status === 'ERR' || !response.data) {
      throw new Error(response.message || 'Không thể lấy trạng thái video.');
    }

    const asset = response.data;
    onUpdate('videoAssetId', asset._id);
    onUpdate('videoFileName', asset.originalFileName || lesson.videoFileName);
    onUpdate('videoDurationSec', asset.durationSec || lesson.videoDurationSec);
    onUpdate('processingProgress', asset.processingProgress || 0);
    onUpdate('processingStatus', mapAssetStatus(asset.status));

    if (asset.status === 'READY' || asset.status === 'FAILED') {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }
  };

  const startPolling = (videoAssetId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      void syncAssetState(videoAssetId);
    }, 2500);
  };

  // Đây là chỗ thay thế flow simulate upload trước đây.
  const uploadRealVideo = async (file: File) => {
    if (!lessonId) {
      toast.error('Bạn cần lưu khóa học trước khi tải video lên.');
      return;
    }

    onUpdate('processingStatus', 'PENDING');
    onUpdate('videoFileName', file.name);
    setUploadProgress(15);

    const initiateResponse = await initiateVideoUpload({ courseId, lessonId });
    if (initiateResponse.status === 'ERR' || !initiateResponse.data?._id) {
      throw new Error(initiateResponse.message || 'Không thể khởi tạo upload video.');
    }

    const videoAssetId = initiateResponse.data._id;
    onUpdate('videoAssetId', videoAssetId);

    setUploadProgress(50);
    const uploadResponse = await completeVideoUpload(videoAssetId, file);
    if (uploadResponse.status === 'ERR' || !uploadResponse.data?._id) {
      throw new Error(uploadResponse.message || 'Không thể tải video lên.');
    }

    setUploadProgress(100);
    const bindResponse = await bindVideoAssetToLesson(courseId, lessonId, videoAssetId);
    if (bindResponse.status === 'ERR') {
      throw new Error(bindResponse.message || 'Không thể gắn video vào bài học.');
    }

    onUpdate('processingStatus', 'PROCESSING');
    onUpdate('processingProgress', 10);
    startPolling(videoAssetId);
  };

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('video/')) {
      toast.error('Vui lòng chọn file video hợp lệ.');
      return;
    }

    try {
      await uploadRealVideo(file);
      toast.success('Đã nhận video, hệ thống đang mã hóa.');
    } catch (error: any) {
      onUpdate('processingStatus', 'FAILED');
      toast.error(error.message || 'Upload video thất bại.');
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileSelect(file);
    }
    e.target.value = '';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      await handleFileSelect(file);
    }
  };

  const resetLocalState = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    onUpdate('processingStatus', 'NONE');
    onUpdate('videoAssetId', undefined);
    onUpdate('videoFileName', undefined);
    onUpdate('processingProgress', undefined);
    onUpdate('videoDurationSec', undefined);
    onUpdate('status', 'DRAFT');
    setUploadProgress(0);
  };

  const handleRemove = async () => {
    if (!lessonId) {
      resetLocalState();
      return;
    }

    try {
      const response = await removeVideoAssetFromLesson(courseId, lessonId);
      if (response.status === 'ERR') {
        throw new Error(response.message || 'Không thể gỡ video khỏi bài học.');
      }

      resetLocalState();
      toast.success('Đã gỡ video khỏi bài học.');
    } catch (error: any) {
      toast.error(error.message || 'Gỡ video thất bại.');
    }
  };

  const handleRetry = async () => {
    if (!lesson.videoFileName || !fileInputRef.current) {
      await handleRemove();
      return;
    }
    fileInputRef.current.click();
  };

  if (!lessonId) {
    return (
      <div className="mt-2 rounded-xl border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
        Lưu khóa học trước để hệ thống tạo `lessonId`, sau đó bạn mới có thể tải video thật lên.
      </div>
    );
  }

  if (status === 'NONE') {
    return (
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`mt-2 flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 group ${
          isDragging
            ? 'border-primary bg-primary/5 scale-[1.005]'
            : 'border-zinc-200 dark:border-zinc-700 hover:border-primary/40 hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(event) => { void handleInputChange(event); }}
        />
        <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-800 group-hover:bg-primary/10 rounded-lg flex items-center justify-center shrink-0 transition-colors">
          <Upload className="w-4 h-4 text-zinc-400 group-hover:text-primary transition-colors" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
            {isDragging ? 'Thả video vào đây...' : 'Tải video lên'}
          </p>
          <p className="text-xs text-zinc-400">MP4, MOV, AVI, MKV · Tự động mã hóa HLS AES-128</p>
        </div>
      </div>
    );
  }

  if (status === 'PENDING') {
    return (
      <div className="mt-2 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
        <div className="flex items-center gap-3 mb-2">
          <Loader2 className="w-4 h-4 text-blue-500 animate-spin shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-400 truncate">
              Đang tải lên: {lesson.videoFileName}
            </p>
            <p className="text-xs text-blue-500 dark:text-blue-500/80">
              Upload tới Media Service...
            </p>
          </div>
          <span className="text-sm font-bold text-blue-600 dark:text-blue-400 shrink-0">
            {Math.round(uploadProgress)}%
          </span>
        </div>
        <div className="w-full bg-blue-100 dark:bg-blue-500/20 rounded-full h-1.5">
          <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-150" style={{ width: `${uploadProgress}%` }} />
        </div>
      </div>
    );
  }

  if (status === 'PROCESSING') {
    const prog = lesson.processingProgress ?? 0;
    return (
      <div className="mt-2 px-4 py-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-4 h-4 shrink-0">
            <svg className="animate-spin text-indigo-500 w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-indigo-700 dark:text-indigo-400 truncate">
              Đang mã hóa HLS: {lesson.videoFileName}
            </p>
            <p className="text-xs text-indigo-500 dark:text-indigo-500/80">
              Phân đoạn .ts · AES-128 encryption
            </p>
          </div>
          <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
            {Math.round(prog)}%
          </span>
        </div>
        <div className="w-full bg-indigo-100 dark:bg-indigo-500/20 rounded-full h-1.5">
          <div className="bg-indigo-500 h-1.5 rounded-full transition-all duration-150" style={{ width: `${prog}%` }} />
        </div>
      </div>
    );
  }

  if (status === 'DONE') {
    const dur = lesson.videoDurationSec;
    return (
      <div className="mt-2 px-4 py-2.5 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 flex items-center gap-3">
        <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-green-700 dark:text-green-400 truncate max-w-[240px]">
              {lesson.videoFileName}
            </p>
            <span className="text-xs text-green-600 dark:text-green-500 bg-green-100 dark:bg-green-500/20 px-2 py-0.5 rounded-full shrink-0">
              HLS · AES-128
            </span>
            {dur ? (
              <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-500">
                <Play className="w-3 h-3" />
                {formatDuration(dur)}
              </span>
            ) : null}
          </div>
          <p className="text-xs text-green-500 dark:text-green-600 mt-0.5">Sẵn sàng phát · Đã mã hóa AES-128</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => void handleRemove()}
          className="p-1.5 rounded-lg hover:bg-green-100 dark:hover:bg-green-500/20 text-green-400 hover:text-green-600 transition-colors shrink-0"
          title="Xóa video"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-2 px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-center gap-3">
      <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center shrink-0">
        <AlertCircle className="w-4 h-4 text-red-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-red-700 dark:text-red-400">
          Xử lý video thất bại
        </p>
        <p className="text-xs text-red-500 mt-0.5 truncate">{lesson.videoFileName}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          type="button"
          variant="ghost"
          onClick={() => void handleRetry()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/30 rounded-lg transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Thử lại
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => void handleRemove()}
          className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 text-red-400 hover:text-red-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(event) => { void handleInputChange(event); }}
      />
    </div>
  );
};
