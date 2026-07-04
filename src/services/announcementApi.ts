import apiClient from './apiClient';
import { notificationApi } from './notificationApi';
export interface CourseAnnouncement {
  _id:string; courseId:string; courseTitle?:string; instructorId:string; instructorName:string; instructorAvatarUrl?:string;
  title:string; content:string; status:'PUBLISHED'|'HIDDEN'; revision:number;
  publishedAt:string; pinnedAt?:string|null; hiddenAt?:string|null; createdAt:string; updatedAt:string; unread?:boolean;
}
export interface AnnouncementPage { items:CourseAnnouncement[]; nextCursor:string|null; hasMore:boolean }
export const listCourseAnnouncements=async(courseId:string,params:Record<string,unknown>={})=>(await apiClient.get<{status:string;data:AnnouncementPage}>(`/api/courses/${courseId}/announcements`,{params})).data.data;
export const getAnnouncementUnread=async(courseId:string)=>(await apiClient.get<{status:string;data:{count:number}}>(`/api/courses/${courseId}/announcements/unread-count`)).data.data.count;
export const readAnnouncement = async (courseId: string, id: string) => {
  const actionUrl = `/student/courses/${courseId}/learn?tab=announcements&announcementId=${id}`;
  const [courseResponse] = await Promise.all([
    apiClient.patch(`/api/courses/${courseId}/announcements/${id}/read`),
    notificationApi.markReadByUrl(actionUrl).catch(() => null),
  ]);
  return courseResponse.data;
};
export const listInstructorAnnouncements=async(params:Record<string,unknown>={})=>(await apiClient.get<{status:string;data:AnnouncementPage}>('/api/courses/instructor/announcements',{params})).data.data;
export const createAnnouncement=async(courseId:string,input:{title:string;content:string})=>(await apiClient.post(`/api/courses/${courseId}/announcements`,input)).data.data as CourseAnnouncement;
export const updateAnnouncement=async(courseId:string,id:string,input:{title:string;content:string;notifyAgain?:boolean})=>(await apiClient.patch(`/api/courses/${courseId}/announcements/${id}`,input)).data.data as CourseAnnouncement;
export const setAnnouncementVisibility=async(courseId:string,id:string,visible:boolean)=>(await apiClient.patch(`/api/courses/${courseId}/announcements/${id}/visibility`,{visible})).data.data as CourseAnnouncement;
export const setAnnouncementPinned=async(courseId:string,id:string,pinned:boolean)=>(await apiClient.patch(`/api/courses/${courseId}/announcements/${id}/pin`,{pinned})).data.data as CourseAnnouncement;