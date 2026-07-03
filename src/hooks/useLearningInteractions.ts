// ========================
// Hook: useLearningInteractions
// Mục đích:
// - tải tài liệu, ghi chú cá nhân và thảo luận của bài học
// - gom mutation tương tác để learning page chỉ giữ state giao diện
// ========================
import { useInfiniteQuery, useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createLearningNote,
  createLessonDiscussion,
  deleteLearningNote,
  deleteLessonDiscussion,
  getLearningNotes,
  getLessonDiscussionReplies,
  getLessonDiscussions,
  moderateLessonDiscussion,
  pinLessonDiscussion,
  updateLearningNote,
  updateLessonDiscussion,
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

export function useLessonDiscussions(courseId: string, lessonId: string, focusId = '') {
  return useInfiniteQuery({
    queryKey: [...learningInteractionKeys.discussions(courseId, lessonId), focusId],
    queryFn: async ({ pageParam }) => (
      await getLessonDiscussions(courseId, lessonId, { cursor: pageParam || undefined, limit: 20, focusId: focusId || undefined })
    ).data!,
    initialPageParam: '',
    getNextPageParam: lastPage => lastPage.hasMore ? lastPage.nextCursor || undefined : undefined,
    enabled: Boolean(courseId && lessonId),
  });
}

export function useLessonDiscussionReplies(courseId: string, lessonId: string, discussionId: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: [...learningInteractionKeys.discussions(courseId, lessonId), 'replies', discussionId],
    queryFn: async ({ pageParam }) => (
      await getLessonDiscussionReplies(courseId, lessonId, discussionId, { cursor: pageParam || undefined, limit: 10 })
    ).data!,
    initialPageParam: '',
    getNextPageParam: lastPage => lastPage.hasMore ? lastPage.nextCursor || undefined : undefined,
    enabled: Boolean(courseId && lessonId && discussionId && enabled),
  });
}

export function useCreateLessonDiscussion(courseId: string, lessonId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { content: string; parentId?: string; replyToId?: string }) =>
      createLessonDiscussion(courseId, lessonId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: learningInteractionKeys.discussions(courseId, lessonId) }),
  });
}

export function useUpdateLessonDiscussion(courseId: string, lessonId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ discussionId, content }: { discussionId: string; content: string }) =>
      updateLessonDiscussion(courseId, lessonId, discussionId, content),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: learningInteractionKeys.discussions(courseId, lessonId) }),
  });
}

export function useDeleteLessonDiscussion(courseId: string, lessonId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (discussionId: string) => deleteLessonDiscussion(courseId, lessonId, discussionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: learningInteractionKeys.discussions(courseId, lessonId) }),
  });
}

export function usePinLessonDiscussion(courseId: string, lessonId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ discussionId, pinned }: { discussionId: string; pinned: boolean }) =>
      pinLessonDiscussion(courseId, lessonId, discussionId, pinned),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: learningInteractionKeys.discussions(courseId, lessonId) }),
  });
}

export function useModerateLessonDiscussion(courseId: string, lessonId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ discussionId, hidden }: { discussionId: string; hidden: boolean }) =>
      moderateLessonDiscussion(courseId, lessonId, discussionId, hidden),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: learningInteractionKeys.discussions(courseId, lessonId) }),
  });
}



