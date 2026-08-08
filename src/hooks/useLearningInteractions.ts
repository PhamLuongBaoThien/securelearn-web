// ========================
// Hook: useLearningInteractions
// Mục đích:
// - tải tài liệu, ghi chú cá nhân và thảo luận của bài học
// - gom mutation tương tác để learning page chỉ giữ state giao diện
// ========================
import { useCallback, useEffect, useRef, useState } from 'react';
import { useInfiniteQuery, useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';
import {
  createLearningNote,
  createLessonDiscussion,
  deleteLearningNote,
  deleteLessonDiscussion,
  getDiscussionContext,
  getLearningNotes,
  getLessonDiscussionReplies,
  getLessonDiscussions,
  moderateLessonDiscussion,
  pinLessonDiscussion,
  setLessonDiscussionReaction,
  updateLearningNote,
  updateLessonDiscussion,
} from '@/services/courseApi';
import type { IDiscussionPage } from '@/services/courseApi';
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

export function useDiscussionContext(courseId: string, discussionId: string) {
  return useQuery({
    queryKey: ['learning', 'discussion-context', courseId, discussionId],
    queryFn: async () => {
      const response = await getDiscussionContext(courseId, discussionId);
      if (response.status === 'ERR' || !response.data) {
        throw new Error(response.message || 'Không thể xác định bài học của thảo luận.');
      }
      return response.data;
    },
    enabled: Boolean(courseId && discussionId),
    staleTime: 5 * 60_000,
  });
}

export function useLessonDiscussions(courseId: string, lessonId: string, focusId = '', sort: 'latest' | 'popular' = 'latest') {
  return useInfiniteQuery({
    queryKey: [...learningInteractionKeys.discussions(courseId, lessonId), focusId, sort],
    queryFn: async ({ pageParam }) => (
      await getLessonDiscussions(courseId, lessonId, { cursor: pageParam || undefined, limit: 20, focusId: focusId || undefined, sort })
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

export function useLessonDiscussionReaction(courseId: string, lessonId: string) {
  const queryClient = useQueryClient();
  const desiredStates = useRef(new Map<string, boolean>());
  const runningIds = useRef(new Set<string>());
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const errorHandlers = useRef(new Map<string, (error: unknown) => void>());
  const mounted = useRef(true);
  const [pendingCount, setPendingCount] = useState(0);
  const queryKey = learningInteractionKeys.discussions(courseId, lessonId);

  const updateCache = useCallback((discussionId: string, liked: boolean) => {
    queryClient.setQueriesData<InfiniteData<IDiscussionPage>>({ queryKey }, (old) => {
      if (!old?.pages) return old;
      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          items: page.items.map((item) => {
            if (item._id !== discussionId || item.likedByViewer === liked) return item;
            return {
              ...item,
              likedByViewer: liked,
              likeCount: Math.max(0, (Number(item.likeCount) || 0) + (liked ? 1 : -1)),
            };
          }),
        })),
      };
    });
  }, [queryClient, queryKey]);

  const sync = useCallback(async (discussionId: string) => {
    if (runningIds.current.has(discussionId)) return;
    const desired = desiredStates.current.get(discussionId);
    if (desired === undefined) return;

    runningIds.current.add(discussionId);
    if (mounted.current) setPendingCount(runningIds.current.size + timers.current.size);
    const sentState = desired;
    let failed: unknown;
    try {
      await setLessonDiscussionReaction(courseId, lessonId, discussionId, sentState);
    } catch (error) {
      failed = error;
    } finally {
      runningIds.current.delete(discussionId);
    }

    const latestDesired = desiredStates.current.get(discussionId);
    if (latestDesired !== undefined && latestDesired !== sentState) {
      updateCache(discussionId, latestDesired);
      void sync(discussionId);
      return;
    }

    desiredStates.current.delete(discussionId);
    if (failed) errorHandlers.current.get(discussionId)?.(failed);
    errorHandlers.current.delete(discussionId);
    if (mounted.current) setPendingCount(runningIds.current.size + timers.current.size);
    await queryClient.invalidateQueries({ queryKey });
  }, [courseId, lessonId, queryClient, queryKey, updateCache]);

  const mutate = useCallback((
    variables: { discussionId: string; liked: boolean },
    options?: { onError?: (error: unknown) => void },
  ) => {
    const { discussionId, liked } = variables;
    void queryClient.cancelQueries({ queryKey });
    desiredStates.current.set(discussionId, liked);
    if (options?.onError) errorHandlers.current.set(discussionId, options.onError);
    updateCache(discussionId, liked);

    const currentTimer = timers.current.get(discussionId);
    if (currentTimer) clearTimeout(currentTimer);
    const timer = setTimeout(() => {
      timers.current.delete(discussionId);
      if (mounted.current) setPendingCount(runningIds.current.size + timers.current.size);
      void sync(discussionId);
    }, 200);
    timers.current.set(discussionId, timer);
    if (mounted.current) setPendingCount(runningIds.current.size + timers.current.size);
  }, [queryClient, queryKey, sync, updateCache]);

  useEffect(() => () => {
    mounted.current = false;
    timers.current.forEach(timer => clearTimeout(timer));
    timers.current.clear();
  }, []);

  return { mutate, isPending: pendingCount > 0 };
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


