// File này là UI upload document cho lesson type DOCUMENT.
// Flow hiện tại:
// - upload file sang media-service
// - bind documentAssetId vào lesson ở course-service
import { useState } from 'react';
import { FileText, Loader2, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { uploadDocumentAsset } from '@/services/mediaApi';
import { bindDocumentAssetToLesson, removeDocumentAssetFromLesson, type ILesson } from '@/services/courseApi';

interface LessonDocumentUploaderProps {
  courseId: string;
  lessonId?: string;
  lesson: ILesson;
  onUploaded?: (documentAssetId: string) => void;
  onRemoved?: () => void;
}

export function LessonDocumentUploader({ courseId, lessonId, lesson, onUploaded, onRemoved }: LessonDocumentUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleSelectFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !lessonId) return;

    try {
      setIsUploading(true);
      const response = await uploadDocumentAsset({ courseId, lessonId, file });
      if (response.status === 'ERR' || !response.data?._id) {
        throw new Error(response.message || 'Upload tài liệu thất bại.');
      }

      const bindResponse = await bindDocumentAssetToLesson(courseId, lessonId, response.data._id);
      if (bindResponse.status === 'ERR') {
        throw new Error(bindResponse.message || 'Không thể gắn tài liệu vào bài học.');
      }

      onUploaded?.(response.data._id);
      toast.success('Đã tải tài liệu lên thành công.');
    } catch (error: any) {
      toast.error(error.message || 'Upload tài liệu thất bại.');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleRemoveDocument = async () => {
    if (!lessonId || !lesson.documentAssetId) return;

    try {
      setIsRemoving(true);
      const response = await removeDocumentAssetFromLesson(courseId, lessonId);
      if (response.status === 'ERR') {
        throw new Error(response.message || 'Không thể gỡ tài liệu khỏi bài học.');
      }

      onRemoved?.();
      toast.success('Đã gỡ tài liệu khỏi bài học.');
    } catch (error: any) {
      toast.error(error.message || 'Gỡ tài liệu thất bại.');
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="mt-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {lesson.documentAssetId ? 'Tài liệu đã được gắn' : 'Tải tài liệu lên'}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              PDF, DOCX, PPTX hoặc tài liệu học tập khác
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
        <label>
          <input type="file" className="hidden" onChange={handleSelectFile} disabled={isUploading || !lessonId} />
          <span className="inline-flex">
            <Button type="button" variant="outline" className="gap-2 rounded-xl" disabled={isUploading || !lessonId}>
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Chọn file
            </Button>
          </span>
        </label>
          {lesson.documentAssetId ? (
            <Button type="button" variant="ghost" size="icon" className="rounded-xl text-zinc-400 hover:text-red-500" disabled={isRemoving} onClick={() => void handleRemoveDocument()}>
              {isRemoving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
