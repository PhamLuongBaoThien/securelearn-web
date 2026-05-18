// File này là UI quản lý tài liệu đính kèm cho lesson (cả VIDEO lẫn QUIZ).
// Flow:
// - Upload file → media-service → nhận documentAssetId
// - Bind documentAssetId vào lesson.attachments[] qua course-service
// - Xóa attachment → gỡ khỏi lesson + cleanup file trên R2
import { useEffect, useRef, useState } from 'react';
import {
  FileArchive,
  FileSpreadsheet,
  FileText,
  FileType,
  Loader2,
  Paperclip,
  Presentation,
  Trash2,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { getDocumentAsset, uploadDocumentAsset } from '@/services/mediaApi';
import { addAttachmentToLesson, removeAttachmentFromLesson, type ILesson } from '@/services/courseApi';

interface AttachmentInfo {
  id: string;
  name: string;
  mimeType?: string;
}

export type AttachmentOperation = {
  phase: 'uploading' | 'binding' | 'removing';
  fileName?: string;
  progress?: number;
};

interface LessonAttachmentManagerProps {
  courseId: string;
  lessonId?: string;
  lesson: ILesson;
  onRefresh?: () => Promise<void>;
  onAttachmentsChange?: (attachments: string[]) => void;
  onOperationChange?: (operation: AttachmentOperation | null) => void;
}

// Chọn icon phù hợp theo mimeType
const getFileIcon = (mimeType?: string) => {
  if (!mimeType) return <FileText className="h-4 w-4" />;
  if (mimeType === 'application/pdf') return <FileType className="h-4 w-4 text-red-500" />;
  if (mimeType.includes('word')) return <FileText className="h-4 w-4 text-blue-500" />;
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint'))
    return <Presentation className="h-4 w-4 text-orange-500" />;
  if (mimeType.includes('sheet') || mimeType.includes('excel'))
    return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
  if (mimeType.includes('zip') || mimeType.includes('archive'))
    return <FileArchive className="h-4 w-4 text-yellow-600" />;
  return <FileText className="h-4 w-4 text-zinc-400" />;
};

export function LessonAttachmentManager({
  courseId,
  lessonId,
  lesson,
  onRefresh,
  onAttachmentsChange,
  onOperationChange,
}: LessonAttachmentManagerProps) {
  const [attachmentInfos, setAttachmentInfos] = useState<AttachmentInfo[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState<string | null>(null);
  const [uploadPhase, setUploadPhase] = useState<'uploading' | 'binding' | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const hydratedRef = useRef<string[]>([]);

  // Hydrate thông tin các attachment khi lesson.attachments thay đổi
  useEffect(() => {
    const currentIds = lesson.attachments ?? [];

    // So sánh để tránh fetch lại khi không cần thiết
    const currentKey = currentIds.join(',');
    const prevKey = hydratedRef.current.join(',');
    if (currentKey === prevKey) return;
    hydratedRef.current = [...currentIds];

    if (currentIds.length === 0) {
      setAttachmentInfos([]);
      return;
    }

    void (async () => {
      const results = await Promise.allSettled(
        currentIds.map(async (id) => {
          const res = await getDocumentAsset(id);
          return {
            id,
            name: res.data?.originalFileName || id,
            mimeType: res.data?.mimeType,
          };
        })
      );

      const infos: AttachmentInfo[] = results
        .filter((r) => r.status === 'fulfilled')
        .map((r) => (r as PromiseFulfilledResult<AttachmentInfo>).value);

      setAttachmentInfos(infos);
    })();
  }, [lesson.attachments]);

  const handleSelectFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !lessonId) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadingFileName(file.name);
      setUploadPhase('uploading');
      onOperationChange?.({ phase: 'uploading', fileName: file.name, progress: 0 });

      // Bước 1: Upload file lên media-service
      const uploadRes = await uploadDocumentAsset({ courseId, lessonId, file }, (progress) => {
        setUploadProgress(progress);
        onOperationChange?.({ phase: 'uploading', fileName: file.name, progress });
      });
      if (uploadRes.status === 'ERR' || !uploadRes.data?._id) {
        throw new Error(uploadRes.message || 'Upload tài liệu thất bại.');
      }

      // Bước 2: Bind vào lesson.attachments[]
      setUploadPhase('binding');
      setUploadProgress(100);
      onOperationChange?.({ phase: 'binding', fileName: file.name, progress: 100 });
      const bindRes = await addAttachmentToLesson(courseId, lessonId, uploadRes.data._id);
      if (bindRes.status === 'ERR') {
        throw new Error(bindRes.message || 'Không thể đính kèm tài liệu vào bài học.');
      }

      const newAttachment: AttachmentInfo = {
        id: uploadRes.data._id,
        name: uploadRes.data.originalFileName || file.name,
      };
      const newList = [...attachmentInfos, newAttachment];
      setAttachmentInfos(newList);
      hydratedRef.current = newList.map((a) => a.id);

      onAttachmentsChange?.(newList.map((a) => a.id));
      await onRefresh?.();
      toast.success('Đã thêm tài liệu đính kèm.');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Upload thất bại.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadingFileName(null);
      setUploadPhase(null);
      onOperationChange?.(null);
      event.target.value = '';
    }
  };

  const handleRemove = async (attachmentId: string) => {
    if (!lessonId) return;

    try {
      setRemovingId(attachmentId);
      const attachmentName = attachmentInfos.find((attachment) => attachment.id === attachmentId)?.name;
      onOperationChange?.({ phase: 'removing', fileName: attachmentName });

      const res = await removeAttachmentFromLesson(courseId, lessonId, attachmentId);
      if (res.status === 'ERR') {
        throw new Error(res.message || 'Không thể gỡ tài liệu.');
      }

      const newList = attachmentInfos.filter((a) => a.id !== attachmentId);
      setAttachmentInfos(newList);
      hydratedRef.current = newList.map((a) => a.id);

      onAttachmentsChange?.(newList.map((a) => a.id));
      await onRefresh?.();
      toast.success('Đã gỡ tài liệu đính kèm.');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Gỡ tài liệu thất bại.');
    } finally {
      setRemovingId(null);
      onOperationChange?.(null);
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/60">
        <div className="flex items-center gap-2">
          <Paperclip className="h-4 w-4 text-zinc-400" />
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Tài liệu đính kèm</span>
          {attachmentInfos.length > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-medium">
              {attachmentInfos.length}
            </span>
          )}
        </div>
        <label className="cursor-pointer">
          <input
            type="file"
            className="hidden"
            onChange={handleSelectFile}
            disabled={isUploading || !lessonId}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-lg h-8 text-xs pointer-events-none"
            disabled={isUploading || !lessonId}
            tabIndex={-1}
          >
            {isUploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            {isUploading ? 'Đang tải' : 'Tải lên'}
          </Button>
        </label>
      </div>

      {isUploading && (
        <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/60 bg-blue-50/60 dark:bg-blue-500/5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-blue-600 dark:text-blue-400" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-blue-700 dark:text-blue-300">
                  {uploadPhase === 'binding' ? 'Đang gắn tài liệu vào bài học' : 'Đang tải tài liệu'}
                </p>
                {uploadingFileName && (
                  <p className="truncate text-xs text-blue-600/80 dark:text-blue-300/70">{uploadingFileName}</p>
                )}
              </div>
            </div>
            <span className="shrink-0 text-xs font-semibold text-blue-700 dark:text-blue-300">{uploadProgress}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-blue-100 dark:bg-blue-950">
            <div className="h-full rounded-full bg-blue-500 transition-all duration-200 ease-out" style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      )}

      {/* Danh sách attachments */}
      {attachmentInfos.length === 0 ? (
        <div className="px-4 py-5 text-center">
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Chưa có tài liệu đính kèm.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
          {attachmentInfos.map((attachment) => (
            <li key={attachment.id} className="flex items-center gap-3 px-4 py-2.5 group hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                {getFileIcon(attachment.mimeType)}
              </div>
              <span className="flex-1 text-sm text-zinc-700 dark:text-zinc-300 truncate min-w-0">
                {attachment.name}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-zinc-300 hover:text-red-500 dark:text-zinc-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded-lg"
                disabled={removingId === attachment.id}
                onClick={() => void handleRemove(attachment.id)}
              >
                {removingId === attachment.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
