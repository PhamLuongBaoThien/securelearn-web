// File này chứa API gọi media-service.
// Video: initiate upload session → PUT từng part trực tiếp lên storage → confirm upload.
// Attachment document: flow 1 bước — upload thẳng
import apiClient from './apiClient';
import type { AxiosProgressEvent } from 'axios';

interface ApiResponse<T = any> {
  status: string;
  message?: string;
  data?: T;
}

export interface IVideoAsset {
  _id: string;
  status: 'INITIATED' | 'UPLOADING' | 'UPLOADED' | 'PROCESSING' | 'READY' | 'FAILED';
  processingProgress?: number;
  originalFileName?: string;
  mimeType?: string;
  sourceSizeBytes?: number;
  durationSec?: number;
  manifestPath?: string;
  errorMessage?: string | null;
  uploadCompletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface IDocumentAsset {
  _id: string;
  status: 'INITIATED' | 'READY' | 'FAILED';
  originalFileName?: string;
  mimeType?: string;
  sizeBytes?: number;
  filePath?: string;
  pageCount?: number;
  errorMessage?: string | null;
}

// --- VIDEO ---

export interface IVideoUploadSession {
  _id: string;
  rawObjectKey?: string;
  multipartUploadId?: string;
}

/**
 * Bước 1: Khởi tạo upload session — luôn dùng direct multipart.
 * Trả về presigned info để FE upload thẳng lên MinIO.
 */
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

/**
 * Lấy tất cả presigned URLs cho 1 file trong 1 lần gọi API.
 * Giúp loại bỏ N round-trips (1 per chunk) trước khi bắt đầu upload song song.
 */
export const getBatchPartPresignedUrls = async (videoAssetId: string, totalParts: number) => {
  const { data } = await apiClient.get<ApiResponse<{ urls: string[] }>>(
    `/api/media/videos/${videoAssetId}/batch-part-urls?totalParts=${totalParts}`,
  );
  return data;
};

/** Hoàn tất multipart upload sau khi tất cả parts đã PUT xong. */
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

/** Hủy multipart session khi user cancel upload. */
export const abortVideoUpload = async (videoAssetId: string) => {
  const { data } = await apiClient.post<ApiResponse>(
    `/api/media/videos/${videoAssetId}/abort-upload`,
  );
  return data;
};

/**
 * Poll trạng thái xử lý video (status + processingProgress).
 */
export const getVideoAsset = async (videoAssetId: string) => {
  const { data } = await apiClient.get<ApiResponse<IVideoAsset>>(
    `/api/media/videos/${videoAssetId}`,
  );
  return data;
};

// --- ATTACHMENT DOCUMENT ---

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
      _suppressLoadingToast: true,
    } as any,
  );
  return data;
};

export const getDocumentAsset = async (documentAssetId: string) => {
  const { data } = await apiClient.get<ApiResponse<IDocumentAsset>>(
    `/api/media/documents/${documentAssetId}`,
  );
  return data;
};
