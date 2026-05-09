// File này chứa API gọi media-service.
// Lưu ý:
// - video upload là flow 2 bước
// - document upload hiện là flow 1 bước
import apiClient from './apiClient';

interface ApiResponse<T = any> {
  status: string;
  message?: string;
  data?: T;
}

export interface IVideoAsset {
  _id: string;
  status: 'INITIATED' | 'UPLOADING' | 'PROCESSING' | 'READY' | 'FAILED';
  processingProgress?: number;
  originalFileName?: string;
  durationSec?: number;
  manifestPath?: string;
  errorMessage?: string | null;
}

export interface IDocumentAsset {
  _id: string;
  status: 'INITIATED' | 'UPLOADING' | 'READY' | 'FAILED';
  originalFileName?: string;
  pageCount?: number;
  errorMessage?: string | null;
}

export const initiateVideoUpload = async (payload: { courseId: string; lessonId: string }) => {
  const { data } = await apiClient.post<ApiResponse<IVideoAsset>>('/api/media/videos/initiate-upload', payload);
  return data;
};

export const completeVideoUpload = async (videoAssetId: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post<ApiResponse<IVideoAsset>>(`/api/media/videos/${videoAssetId}/upload-complete`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const getVideoAsset = async (videoAssetId: string) => {
  const { data } = await apiClient.get<ApiResponse<IVideoAsset>>(`/api/media/videos/${videoAssetId}`);
  return data;
};

export const uploadDocumentAsset = async (payload: { courseId: string; lessonId: string; file: File }) => {
  const formData = new FormData();
  formData.append('courseId', payload.courseId);
  formData.append('lessonId', payload.lessonId);
  formData.append('file', payload.file);

  const { data } = await apiClient.post<ApiResponse<IDocumentAsset>>('/api/media/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};
