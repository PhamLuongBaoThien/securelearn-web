import apiClient from './apiClient';

export type ChatbotIntent = 'COURSE' | 'OUT_OF_SCOPE' | 'SMALL_TALK';

export type ChatbotSource = {
  type: 'COURSE';
  title: string;
  url: string;
  price?: number;
};

export type SuggestedCourse = {
  title: string;
  slug: string;
  url: string;
  price: number;
};

export type ChatbotResponse = {
  conversationId: string;
  guestToken?: string;
  reply: string;
  intent: ChatbotIntent;
  suggestedCourses: SuggestedCourse[];
  sources: ChatbotSource[];
};

export type ChatbotConversation = {
  id: string;
  title: string;
  lastMessage: string;
  lastIntent?: ChatbotIntent;
  updatedAt: string;
  createdAt: string;
};

export type ChatbotHistoryMessage = {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  intent?: ChatbotIntent;
  suggestedCourses?: SuggestedCourse[];
  sources?: ChatbotSource[];
  createdAt: string;
};

type ApiResponse<T> = { status: 'OK' | 'ERR'; data: T; message?: string };

type ChatbotSessionPayload = {
  conversationId?: string;
  guestToken?: string;
};

export const sendChatbotMessage = async (payload: {
  message: string;
  conversationId?: string;
  guestToken?: string;
}) => {
  const { data } = await apiClient.post<ApiResponse<ChatbotResponse>>('/api/chatbot/message', payload);
  return data.data;
};

export const getChatbotConversations = async (session?: ChatbotSessionPayload) => {
  const { data } = await apiClient.get<ApiResponse<ChatbotConversation[]>>('/api/chatbot/conversations', {
    params: {
      conversationId: session?.conversationId,
      guestToken: session?.guestToken,
    },
  });
  return data.data;
};

export const getChatbotMessages = async (conversationId: string, session?: ChatbotSessionPayload) => {
  const { data } = await apiClient.get<ApiResponse<ChatbotHistoryMessage[]>>(`/api/chatbot/conversations/${conversationId}/messages`, {
    params: { guestToken: session?.guestToken },
  });
  return data.data;
};

export const deleteChatbotConversation = async (conversationId: string, session?: ChatbotSessionPayload) => {
  const { data } = await apiClient.delete<ApiResponse<{ deleted: boolean }>>(`/api/chatbot/conversations/${conversationId}`, {
    data: { guestToken: session?.guestToken },
  });
  return data.data;
};

export const clearChatbotConversations = async (session?: ChatbotSessionPayload) => {
  const { data } = await apiClient.delete<ApiResponse<{ deletedCount: number }>>('/api/chatbot/conversations', {
    data: {
      conversationId: session?.conversationId,
      guestToken: session?.guestToken,
    },
  });
  return data.data;
};
