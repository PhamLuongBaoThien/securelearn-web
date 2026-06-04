// File: index.ts
// Barrel export cho thư mục course-detail.
// Giúp các file khác (như routes/index.tsx) chỉ cần import từ một điểm duy nhất
// thay vì phải nhớ đường dẫn đến từng file cụ thể.
// Ví dụ: import { CourseDetail } from '@/pages/public/course-detail'

export { CourseDetail } from './CourseDetail';
