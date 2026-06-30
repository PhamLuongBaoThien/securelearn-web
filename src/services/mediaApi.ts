// File này chứa API gọi media-service.
// Video: initiate upload session → PUT từng part trực tiếp lên storage → confirm upload.
// Attachment document: flow 1 bước — upload thẳng
import apiClient from './apiClient';
import type { AxiosProgressEvent } from 'axios';

interface ApiResponse<T = undefined> {
  status: string;
  message?: string;
  data?: T;
}

export interface IVideoRendition {
  quality: string;
  width: number;
  height: number;
  bandwidth: number;
  manifestKey?: string;
  playlistPath?: string;
}

export interface IVideoAsset {
  _id: string;
  status: 'INITIATED' | 'UPLOADING' | 'UPLOADED' | 'PROCESSING' | 'READY' | 'FAILED';
  processingProgress?: number;
  originalFileName?: string;
  mimeType?: string;
  sourceSizeBytes?: number;
  durationSec?: number;
  errorMessage?: string | null;
  uploadCompletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  availableQualities?: string[];
  sourceWidth?: number | null;
  sourceHeight?: number | null;
  renditions?: IVideoRendition[];
}

export interface IDocumentAsset {
  _id: string;
  status: 'INITIATED' | 'READY' | 'FAILED';
  originalFileName?: string;
  mimeType?: string;
  sizeBytes?: number;
  filePath?: string;
  pageCount?: number;
}

export interface IVideoUploadSession {
  _id: string;
  rawObjectKey?: string;
  multipartUploadId?: string;
}

export const initiateVideoUpload = async (payload: {
  courseId: string;
  lessonId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}) => {
  const { data } = await apiClient.post<ApiResponse<IVideoUploadSession>>(
    '/api/media/videos/initiate-upload',
    payload,
  );
  return data;
};

export const getBatchPartPresignedUrls = async (videoAssetId: string, totalParts: number) => {
  const { data } = await apiClient.get<ApiResponse<{ urls: string[] }>>(
    `/api/media/videos/${videoAssetId}/batch-part-urls?totalParts=${totalParts}`,
  );
  return data;
};

export const confirmVideoUpload = async (
  videoAssetId: string,
  parts: { ETag: string; PartNumber: number }[],
) => {
  const { data } = await apiClient.post<ApiResponse<IVideoAsset>>(
    `/api/media/videos/${videoAssetId}/confirm-upload`,
    { parts },
  );
  return data;
};

export const abortVideoUpload = async (videoAssetId: string) => {
  const { data } = await apiClient.post<ApiResponse>(
    `/api/media/videos/${videoAssetId}/abort-upload`,
  );
  return data;
};

export const getVideoAsset = async (videoAssetId: string) => {
  const { data } = await apiClient.get<ApiResponse<IVideoAsset>>(
    `/api/media/videos/${videoAssetId}`,
  );
  return data;
};

export interface IVideoPlaybackSession {
  asset: IVideoAsset;
  playbackUrl: string;
  expiresIn: number;
  segmentExpiresIn?: number;
}

export const createPlaybackSession = async (videoAssetId: string, learningSession?: { id: string; token: string }, clientInstanceId?: string) => {
  const { data } = await apiClient.post<ApiResponse<IVideoPlaybackSession>>(
    `/api/media/videos/${videoAssetId}/playback-session`,
    {},
    { headers: learningSession ? { 'X-Learning-Session-Id': learningSession.id, 'X-Learning-Session-Token': learningSession.token, ...(clientInstanceId ? { 'X-Learning-Client-Instance-Id': clientInstanceId } : {}) } : undefined },
  );
  return data;
};

export const uploadDocumentAsset = async (payload: {
  courseId: string;
  lessonId: string;
  file: File;
}, onProgress?: (percent: number) => void) => {
  const formData = new FormData();
  formData.append('courseId', payload.courseId);
  formData.append('lessonId', payload.lessonId);
  formData.append('file', payload.file);

  const { data } = await apiClient.post<ApiResponse<IDocumentAsset>>(
    '/api/media/documents/upload',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event: AxiosProgressEvent) => {
        if (event.total && onProgress) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      },
    },
  );
  return data;
};

export const getDocumentAsset = async (documentAssetId: string) => {
  const { data } = await apiClient.get<ApiResponse<IDocumentAsset>>(
    `/api/media/documents/${documentAssetId}`,
  );
  return data;
};

export const viewDocument = async (documentAssetId: string) => {
  const { data } = await apiClient.get<Blob>(
    `/api/media/documents/${documentAssetId}/view`,
    {
      responseType: 'blob',
    },
  );
  return data;
};

export const downloadDocument = async (documentAssetId: string) => {
  const { data } = await apiClient.get<Blob>(
    `/api/media/documents/${documentAssetId}/download`,
    { responseType: 'blob' },
  );
  return data;
};
