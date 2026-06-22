// [XEM TÀI LIỆU ẢNH BẢO MẬT - BƯỚC 5]
// Component hiển thị các tài liệu dạng hình ảnh đính kèm bài học.
// Vai trò chính:
// 1. Nhận signed URL tạm thời, tải file ảnh dạng Blob bằng JS (downloadDocumentFromSession).
// 2. Chuyển đổi Blob thành URL cục bộ (URL.createObjectURL) để hiển thị trong thẻ <img> nhằm ẩn URL thật của S3/MinIO.
// 3. Tự động thu hồi (revokeObjectURL) khi đóng màn hình xem để giải phóng bộ nhớ RAM trình duyệt.

import { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { downloadDocumentFromSession, type IDocumentAsset } from '@/services/mediaApi';

type ImageDocumentViewerProps = {
  asset: IDocumentAsset;
  viewerUrl: string;
  onClose: () => void;
};

export function ImageDocumentViewer({
  asset,
  viewerUrl,
  onClose,
}: ImageDocumentViewerProps) {
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl = '';

    const loadImage = async () => {
      setIsLoading(true);
      setHasError(false);
      try {
        const blob = await downloadDocumentFromSession(viewerUrl);
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setImageUrl(objectUrl);
      } catch {
        if (active) {
          setHasError(true);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadImage();

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [viewerUrl]);

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-zinc-950 text-white">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-white/10 bg-zinc-950/95 px-3">
        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-white hover:bg-white/10" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{asset.originalFileName || 'Hình ảnh bài học'}</p>
          <p className="text-xs text-zinc-400">Xem trước hình ảnh</p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-auto bg-zinc-900 p-6">
        {isLoading ? (
          <Loader2 className="h-7 w-7 animate-spin text-white" />
        ) : hasError || !imageUrl ? (
          <div className="text-sm text-zinc-300">Không thể mở hình ảnh.</div>
        ) : (
          <img
            src={imageUrl}
            alt={asset.originalFileName || 'Hình ảnh bài học'}
            className="max-h-full max-w-full rounded border border-white/10 object-contain shadow-2xl"
          />
        )}
      </div>
    </div>
  );
}
