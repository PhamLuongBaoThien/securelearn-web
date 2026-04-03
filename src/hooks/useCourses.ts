import { useQuery } from '@tanstack/react-query';
import type { CourseSnippet } from '../features/courses/cartSlice';

// Simulated API Call
const fetchCourses = async (): Promise<CourseSnippet[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: '1', title: 'React 18 Mastery', price: 2490000, instructor: 'John Doe' },
        { id: '2', title: 'Advanced Microservices', price: 3490000, instructor: 'Jane Smith' },
        { id: '3', title: 'Framer Motion Animations', price: 1290000, instructor: 'Alice Wonderland' }
      ]);
    }, 1000);
  });
};

export const useCourses = () => {
  return useQuery({
    queryKey: ['courses'],
    queryFn: fetchCourses,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
};
