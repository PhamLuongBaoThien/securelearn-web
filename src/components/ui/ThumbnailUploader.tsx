// ========================
// ThumbnailUploader: Upload & preview hình ảnh quảng cáo khóa học
// Tỉ lệ 16:9, drag & drop hoặc click để chọn file
// ========================
import React, { useRef, useState, useCallback } from 'react';
import { ImagePlus, X, UploadCloud } from 'lucide-react';

interface ThumbnailUploaderProps {
  value: string;          // URL hiện tại (rỗng nếu chưa có)
  onChange: (url: string) => void;
}

export const ThumbnailUploader: React.FC<ThumbnailUploaderProps> = ({ value, onChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      return;
    }
    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      onChange(e.target?.result as string);
      setIsLoading(false);
    };
    reader.readAsDataURL(file);
  }, [onChange]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset input để có thể chọn cùng file lại
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div className="space-y-2">
      {/* Hidden input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
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
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm text-zinc-900 dark:text-white rounded-xl text-sm font-medium hover:bg-white dark:hover:bg-zinc-800 transition-colors shadow"
            >
              <ImagePlus className="w-4 h-4" />
              Thay ảnh
            </button>
            <button
              type="button"
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
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
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
                  JPG, PNG, WebP · Tỉ lệ 16:9 được khuyến nghị
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
