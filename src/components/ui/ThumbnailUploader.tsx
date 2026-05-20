// ========================
// ThumbnailUploader: Upload & preview hình ảnh quảng cáo khóa học
// Tỉ lệ 16:9, drag & drop hoặc click để chọn file
// ========================
import React, { useRef, useState, useCallback } from 'react';
import { ImagePlus, X, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';

interface ThumbnailUploaderProps {
  value: string;          // URL hiện tại (rỗng nếu chưa có)
  onChange: (previewUrl: string, file: File | null) => void;
  disabled?: boolean;
}

export const ThumbnailUploader: React.FC<ThumbnailUploaderProps> = ({ value, onChange, disabled = false }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh hợp lệ.');
      return;
    }
    try {
      setIsLoading(true);
      const previewUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve((event.target?.result as string) || '');
        reader.onerror = () => reject(new Error('Không thể đọc file ảnh.'));
        reader.readAsDataURL(file);
      });
      onChange(previewUrl, file);
    } catch (error: unknown) {
      toast.error((error as Error).message || 'Không thể xem trước thumbnail.');
    } finally {
      setIsLoading(false);
    }
  }, [onChange]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
    // Reset input để có thể chọn cùng file lại
    e.target.value = '';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled || isLoading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled || isLoading) return;
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('', null);
  };

  return (
    <div className="space-y-2">
      {/* Hidden input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(event) => { void handleFileChange(event); }}
        disabled={disabled || isLoading}
      />

      {value ? (
        /* Preview mode */
        <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 group shadow-sm">
          <img
            src={value}
            alt="Thumbnail khóa học"
            className="w-full h-full object-cover"
          />
          {/* Overlay actions */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              disabled={disabled || isLoading}
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm text-zinc-900 dark:text-white rounded-xl text-sm font-medium hover:bg-white dark:hover:bg-zinc-800 transition-colors shadow"
            >
              <ImagePlus className="w-4 h-4" />
              {isLoading ? 'Đang xử lý...' : 'Thay ảnh'}
            </button>
            <button
              type="button"
              disabled={disabled || isLoading}
              onClick={handleRemove}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/90 backdrop-blur-sm text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors shadow"
            >
              <X className="w-4 h-4" />
              Xóa
            </button>
          </div>
          {/* Corner badge */}
          <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-xs rounded-lg font-medium">
            16:9
          </div>
        </div>
      ) : (
        /* Drop zone */
        <div
          onClick={() => {
            if (!disabled && !isLoading) inputRef.current?.click();
          }}
          onDrop={(event) => { void handleDrop(event); }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            w-full aspect-video rounded-xl border-2 border-dashed cursor-pointer
            flex flex-col items-center justify-center gap-3 transition-all duration-200
            ${isDragOver
              ? 'border-primary bg-primary/5 scale-[0.99]'
              : 'border-zinc-300 dark:border-zinc-700 hover:border-primary/60 hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
            }
          `}
        >
          {isLoading ? (
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <div className={`
                w-14 h-14 rounded-2xl flex items-center justify-center transition-colors
                ${isDragOver ? 'bg-primary/15' : 'bg-zinc-100 dark:bg-zinc-800'}
              `}>
                <UploadCloud className={`w-7 h-7 ${isDragOver ? 'text-primary' : 'text-zinc-400'}`} />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  {isDragOver ? 'Thả ảnh vào đây' : 'Kéo & thả hoặc click để upload'}
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  JPG, PNG, WebP · Xem trước trước khi lưu · Tỉ lệ 16:9 được khuyến nghị
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
