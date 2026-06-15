// ========================
// Hook: useLearningInteractions
// Mục đích:
// - tải tài liệu, ghi chú cá nhân và thảo luận của bài học
// - gom mutation tương tác để learning page chỉ giữ state giao diện
// ========================
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createLessonDiscussion,
  getLearningNote,
  getLessonDiscussions,
  saveLearningNote,
} from '@/services/courseApi';
import { getDocumentAsset } from '@/services/mediaApi';

export const learningInteractionKeys = {
  note: (courseId: string, lessonId: string) => ['learning', 'note', courseId, lessonId] as const,
  discussions: (courseId: string, lessonId: string) =>
    ['learning', 'discussions', courseId, lessonId] as const,
};

export function useLearningResources(attachmentIds: string[]) {
  return useQueries({
    queries: attachmentIds.map((attachmentId) => ({
      queryKey: ['learning', 'document', attachmentId],
      queryFn: async () => {
        const response = await getDocumentAsset(attachmentId);
        if (response.status === 'ERR' || !response.data) {
          throw new Error(response.message || 'Không thể tải tài liệu.');
        }
        return response.data;
      },
      staleTime: 5 * 60_000,
    })),
  });
}

export function useLearningNote(courseId: string, lessonId: string) {
  return useQuery({
    queryKey: learningInteractionKeys.note(courseId, lessonId),
    queryFn: async () => (await getLearningNote(courseId, lessonId)).data || null,
    enabled: Boolean(courseId && lessonId),
  });
}

export function useSaveLearningNote(courseId: string, lessonId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { content: string; timestampSec: number }) =>
      saveLearningNote(courseId, lessonId, payload),
    onSuccess: (response) => {
      queryClient.setQueryData(
        learningInteractionKeys.note(courseId, lessonId),
        response.data || null,
      );
    },
  });
}

export function useLessonDiscussions(courseId: string, lessonId: string) {
  return useQuery({
    queryKey: learningInteractionKeys.discussions(courseId, lessonId),
    queryFn: async () => (await getLessonDiscussions(courseId, lessonId)).data || [],
    enabled: Boolean(courseId && lessonId),
  });
}

export function useCreateLessonDiscussion(courseId: string, lessonId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { content: string; timestampSec: number }) =>
      createLessonDiscussion(courseId, lessonId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: learningInteractionKeys.discussions(courseId, lessonId),
      });
    },
  });
}
