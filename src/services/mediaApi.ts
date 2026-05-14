// File này chứa API gọi media-service.
// Video: flow 2 bước — initiate-upload → upload-complete (file qua backend)
// Document: flow 1 bước — upload thẳng
import apiClient from './apiClient';

interface ApiResponse<T = any> {
  status: string;
  message?: string;
  data?: T;
}

export interface IVideoAsset {
  _id: string;
  status: 'INITIATED' | 'PROCESSING' | 'READY' | 'FAILED';
  processingProgress?: number;
  originalFileName?: string;
  durationSec?: number;
  manifestPath?: string;
  errorMessage?: string | null;
}

export interface IDocumentAsset {
  _id: string;
  status: 'INITIATED' | 'READY' | 'FAILED';
  originalFileName?: string;
  pageCount?: number;
  errorMessage?: string | null;
}

// --- VIDEO ---

/**
 * Bước 1: Khởi tạo asset record, nhận _id để gắn file vào.
 */
export const initiateVideoUpload = async (payload: { courseId: string; lessonId: string }) => {
  const { data } = await apiClient.post<ApiResponse<{ _id: string }>>(
    '/api/media/videos/initiate-upload',
    payload,
  );
  return data;
};

/**
 * Bước 2: Upload file qua backend (multipart/form-data).
 * Hỗ trợ real progress qua axios onUploadProgress.
 *
 * TODO #4: Khi migrate lên R2, thay bằng presigned PUT URL (uploadVideoViaPresignedUrl).
 *
 * @param onProgress Callback nhận % tiến trình upload (0-100)
 */
export const completeVideoUpload = async (
  videoAssetId: string,
  file: File,
  onProgress?: (percent: number) => void,
) => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post<ApiResponse<IVideoAsset>>(
    `/api/media/videos/${videoAssetId}/upload-complete`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (e.total && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      },
    },
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

// --- DOCUMENT ---

export const uploadDocumentAsset = async (payload: {
  courseId: string;
  lessonId: string;
  file: File;
}) => {
  const formData = new FormData();
  formData.append('courseId', payload.courseId);
  formData.append('lessonId', payload.lessonId);
  formData.append('file', payload.file);

  const { data } = await apiClient.post<ApiResponse<IDocumentAsset>>(
    '/api/media/documents/upload',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data;
};

export const getDocumentAsset = async (documentAssetId: string) => {
  const { data } = await apiClient.get<ApiResponse<IDocumentAsset>>(
    `/api/media/documents/${documentAssetId}`,
  );
  return data;
};
