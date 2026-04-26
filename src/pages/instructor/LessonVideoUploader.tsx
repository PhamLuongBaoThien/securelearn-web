// ========================
// LessonVideoUploader: Component upload video inline trong CourseEditor
// Mock simulate progression: idle → uploading → processing(HLS) → done/failed
// Sẵn sàng wire vào Media Service API thật bằng cách thay simulateUpload().
// ========================
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  X,
  Loader2,
  Play,
} from 'lucide-react';
import type { ILesson, VideoProcessingStatus } from '@/services/courseApi';
import { Button } from '@/components/ui/button';

// ===== Props =====
interface LessonVideoUploaderProps {
  lesson: ILesson;
  /** callback để cập nhật field của lesson trong state CourseEditor */
  onUpdate: (field: keyof ILesson, value: any) => void;
}

// ===== Helper: format duration =====
const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

export const LessonVideoUploader: React.FC<LessonVideoUploaderProps> = ({
  lesson,
  onUpdate,
}) => {
  const status: VideoProcessingStatus = lesson.processingStatus ?? 'NONE';

  // Upload progress (0-100), chỉ dùng khi status = PENDING
  const [uploadProgress, setUploadProgress] = useState(0);
  // Processing progress (0-100), chỉ dùng khi status = PROCESSING
  const [processingProgress, setProcessingProgress] = useState(0);
  // Dragging state
  const [isDragging, setIsDragging] = useState(false);

  const uploadIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const processingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (uploadIntervalRef.current) clearInterval(uploadIntervalRef.current);
      if (processingIntervalRef.current) clearInterval(processingIntervalRef.current);
    };
  }, []);

  // ─── Phase 2: Simulate HLS Encoding (gọi sau khi upload xong) ───
  const simulateProcessing = useCallback(() => {
    onUpdate('processingStatus', 'PROCESSING');
    setProcessingProgress(0);

    processingIntervalRef.current = setInterval(() => {
      setProcessingProgress((prev) => {
        const next = prev + Math.random() * 4 + 1; // 1-5% mỗi 150ms
        if (next >= 100) {
          clearInterval(processingIntervalRef.current!);
          processingIntervalRef.current = null;
          // Hoàn tất — cập nhật lesson
          setTimeout(() => {
            onUpdate('processingStatus', 'DONE');
            onUpdate('playbackUrl', 'https://cdn.securelearn.vn/hls/mock-video/index.m3u8');
            onUpdate('processingProgress', 100);
          }, 300);
          return 100;
        }
        onUpdate('processingProgress', Math.round(next));
        return next;
      });
    }, 150);
  }, [onUpdate]);

  // ─── Phase 1: Simulate Upload ───
  const simulateUpload = useCallback((file: File) => {
    onUpdate('processingStatus', 'PENDING');
    onUpdate('videoFileName', file.name);
    onUpdate('videoDurationSec', Math.floor(Math.random() * 2400 + 300)); // 5-45 min
    setUploadProgress(0);

    uploadIntervalRef.current = setInterval(() => {
      setUploadProgress((prev) => {
        const next = prev + Math.random() * 6 + 2; // 2-8% mỗi 80ms
        if (next >= 100) {
          clearInterval(uploadIntervalRef.current!);
          uploadIntervalRef.current = null;
          setTimeout(() => simulateProcessing(), 400);
          return 100;
        }
        return next;
      });
    }, 80);
  }, [simulateProcessing, onUpdate]);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('video/')) {
      alert('Vui lòng chọn file video (MP4, MOV, AVI, MKV).');
      return;
    }
    simulateUpload(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    // reset input để chọn lại cùng file được
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleRemove = () => {
    if (uploadIntervalRef.current) clearInterval(uploadIntervalRef.current);
    if (processingIntervalRef.current) clearInterval(processingIntervalRef.current);
    onUpdate('processingStatus', 'NONE');
    onUpdate('videoId', undefined);
    onUpdate('videoFileName', undefined);
    onUpdate('playbackUrl', undefined);
    onUpdate('processingProgress', undefined);
    onUpdate('videoDurationSec', undefined);
    setUploadProgress(0);
    setProcessingProgress(0);
  };

  const handleRetry = () => {
    if (lesson.videoFileName) {
      // Simulate retry với file cũ
      simulateUpload(new File([], lesson.videoFileName, { type: 'video/mp4' }));
    } else {
      handleRemove();
    }
  };

  // ─────────────── RENDER ───────────────

  // STATE: NONE — Upload zone
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
          onChange={handleInputChange}
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

  // STATE: PENDING (uploading)
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
              Tải lên tới Media Service...
            </p>
          </div>
          <span className="text-sm font-bold text-blue-600 dark:text-blue-400 shrink-0">
            {Math.round(uploadProgress)}%
          </span>
        </div>
        <div className="w-full bg-blue-100 dark:bg-blue-500/20 rounded-full h-1.5">
          <div
            className="bg-blue-500 h-1.5 rounded-full transition-all duration-150"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      </div>
    );
  }

  // STATE: PROCESSING (HLS encoding)
  if (status === 'PROCESSING') {
    const prog = lesson.processingProgress ?? processingProgress;
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
              Phân đoạn .ts · AES-128 encryption · CDN distribution
            </p>
          </div>
          <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
            {Math.round(prog)}%
          </span>
        </div>
        <div className="w-full bg-indigo-100 dark:bg-indigo-500/20 rounded-full h-1.5">
          <div
            className="bg-indigo-500 h-1.5 rounded-full transition-all duration-150"
            style={{ width: `${prog}%` }}
          />
        </div>
      </div>
    );
  }

  // STATE: DONE
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
            {dur && (
              <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-500">
                <Play className="w-3 h-3" />
                {formatDuration(dur)}
              </span>
            )}
          </div>
          <p className="text-xs text-green-500 dark:text-green-600 mt-0.5">Sẵn sàng phát · Đã mã hóa AES-128</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleRemove}
          className="p-1.5 rounded-lg hover:bg-green-100 dark:hover:bg-green-500/20 text-green-400 hover:text-green-600 transition-colors shrink-0"
          title="Xóa video"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  // STATE: FAILED
  if (status === 'FAILED') {
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
            onClick={handleRetry}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/30 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Thử lại
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleRemove}
            className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 text-red-400 hover:text-red-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return null;
};
