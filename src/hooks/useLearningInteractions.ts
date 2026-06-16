// ========================
// Hook: useLearningInteractions
// Mục đích:
// - tải tài liệu, ghi chú cá nhân và thảo luận của bài học
// - gom mutation tương tác để learning page chỉ giữ state giao diện
// ========================
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createLearningNote,
  createLessonDiscussion,
  deleteLearningNote,
  getLearningNotes,
  getLessonDiscussions,
  updateLearningNote,
} from '@/services/courseApi';
import { getDocumentAsset } from '@/services/mediaApi';

export const learningInteractionKeys = {
  notes: (courseId: string, lessonId: string) => ['learning', 'notes', courseId, lessonId] as const,
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

export function useLearningNotes(courseId: string, lessonId: string) {
  return useQuery({
    queryKey: learningInteractionKeys.notes(courseId, lessonId),
    queryFn: async () => (await getLearningNotes(courseId, lessonId)).data || [],
    enabled: Boolean(courseId && lessonId),
  });
}

export function useCreateLearningNote(courseId: string, lessonId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { content: string; timestampSec: number }) =>
      createLearningNote(courseId, lessonId, payload),
    onSuccess: (response) => {
      queryClient.setQueryData(
        learningInteractionKeys.notes(courseId, lessonId),
        response.data || [],
      );
    },
  });
}

export function useUpdateLearningNote(courseId: string, lessonId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ noteId, content, timestampSec }: { noteId: string; content: string; timestampSec: number }) =>
      updateLearningNote(courseId, lessonId, noteId, { content, timestampSec }),
    onSuccess: (response) => {
      queryClient.setQueryData(
        learningInteractionKeys.notes(courseId, lessonId),
        response.data || [],
      );
    },
  });
}

export function useDeleteLearningNote(courseId: string, lessonId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => deleteLearningNote(courseId, lessonId, noteId),
    onSuccess: (response) => {
      queryClient.setQueryData(
        learningInteractionKeys.notes(courseId, lessonId),
        response.data || [],
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
