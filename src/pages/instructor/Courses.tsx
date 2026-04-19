import React from 'react';
import { Plus, Search, MoreVertical, Edit, Trash2, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';

const MOCK_COURSES = [
  {
    id: 1,
    title: 'Khởi đầu lập trình web với HTML, CSS & JavaScript',
    thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=600',
    status: 'PUBLISHED',
    price: 499000,
    students: 1248,
    rating: 4.8,
    lastModified: '12/04/2026',
  },
  {
    id: 2,
    title: 'Python cơ bản đến nâng cao (Mới nhất 2026)',
    thumbnail: 'https://images.unsplash.com/photo-1526379095098-d400fd0bfce8?auto=format&fit=crop&q=80&w=600',
    status: 'PUBLISHED',
    price: 599000,
    students: 856,
    rating: 4.9,
    lastModified: '01/03/2026',
  },
  {
    id: 3,
    title: 'Master React & Redux Toolkit',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=600',
    status: 'DRAFT',
    price: 0,
    students: 0,
    rating: 0,
    lastModified: '14/04/2026',
  },
  {
    id: 4,
    title: 'Docker cơ bản cho Developer',
    thumbnail: 'https://images.unsplash.com/photo-1605745341112-85968b19335b?auto=format&fit=crop&q=80&w=600',
    status: 'IN_REVIEW',
    price: 299000,
    students: 0,
    rating: 0,
    lastModified: '10/04/2026',
  }
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'PUBLISHED':
      return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20">Đã xuất bản</Badge>;
    case 'DRAFT':
      return <Badge variant="secondary" className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">Bản nháp</Badge>;
    case 'IN_REVIEW':
      return <Badge className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border-yellow-500/20">Đang chờ duyệt</Badge>;
    default:
      return null;
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export const InstructorCourses: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Khóa học của tôi
          </h1>
          <p className="text-muted-foreground mt-2">Quản lý các khóa học đang có và tạo khóa học mới.</p>
        </div>
        
        <Button className="shrink-0 h-11 px-6 rounded-xl font-medium gap-2">
          <Plus className="w-5 h-5" />
          Tạo khóa học mới
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <Input 
            placeholder="Tìm kiếm khóa học..." 
            className="pl-10 h-11 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl"
          />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
           {/* Add filter dropdowns here later */}
           <Button variant="outline" className="h-11 rounded-xl w-full sm:w-auto text-sm border-zinc-200 dark:border-zinc-800">
              Trạng thái: Tất cả
           </Button>
           <Button variant="outline" className="h-11 rounded-xl w-full sm:w-auto text-sm border-zinc-200 dark:border-zinc-800">
              Mới nhất
           </Button>
        </div>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_COURSES.map((course) => (
          <div key={course.id} className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col">
            {/* Thumbnail */}
            <div className="relative aspect-video overflow-hidden bg-zinc-100 dark:bg-zinc-800">
              <img 
                src={course.thumbnail} 
                alt={course.title} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute top-3 left-3">
                {getStatusBadge(course.status)}
              </div>
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="h-8 w-8 bg-white/90 dark:bg-black/80 backdrop-blur-sm rounded-full flex items-center justify-center text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem className="gap-2 cursor-pointer">
                      <Edit className="w-4 h-4" /> Thêm bài giảng
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 cursor-pointer">
                      <Eye className="w-4 h-4" /> Xem trước
                    </DropdownMenuItem>
                    {course.status === 'DRAFT' && (
                      <DropdownMenuItem className="gap-2 cursor-pointer text-red-500 focus:text-red-500">
                        <Trash2 className="w-4 h-4" /> Xóa bản nháp
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col flex-1">
              <h3 className="font-bold text-lg text-zinc-900 dark:text-white line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                {course.title}
              </h3>
              
              <div className="mt-4 flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500 dark:text-zinc-400">Giá bán</span>
                  <span className="font-medium text-zinc-900 dark:text-white">
                    {course.price > 0 ? formatCurrency(course.price) : 'Miễn phí'}
                  </span>
                </div>
                
                {course.status === 'PUBLISHED' && (
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-zinc-500 dark:text-zinc-400">Hiệu suất</span>
                    <span className="font-medium text-zinc-900 dark:text-white flex items-center gap-2">
                       ★ {course.rating} • {course.students} HV
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-950/20 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
              Cập nhật {course.lastModified}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
