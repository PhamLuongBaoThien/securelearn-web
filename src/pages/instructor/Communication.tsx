// ========================
// Instructor Communication: Giao tiếp với học viên
// Placeholder — sẽ tích hợp Q&A / Messages API sau.
// ========================
import React from 'react';
import { MessageSquare, Search, Clock, User, BookOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Mock data
const MOCK_MESSAGES = [
  {
    id: '1',
    studentName: 'Nguyễn Văn A',
    courseName: 'Khởi đầu lập trình web',
    message: 'Thầy ơi, em không hiểu phần CSS Flexbox, thầy có thể giải thích thêm được không ạ?',
    time: '2 giờ trước',
    isRead: false,
  },
  {
    id: '2',
    studentName: 'Trần Thị B',
    courseName: 'Python cơ bản đến nâng cao',
    message: 'Em đã hoàn thành bài tập chương 3 nhưng kết quả bị sai ở test case số 5. Em gửi code kèm ạ.',
    time: '5 giờ trước',
    isRead: false,
  },
  {
    id: '3',
    studentName: 'Lê Minh C',
    courseName: 'Khởi đầu lập trình web',
    message: 'Cảm ơn thầy đã giải đáp, em đã hiểu rồi ạ!',
    time: '1 ngày trước',
    isRead: true,
  },
  {
    id: '4',
    studentName: 'Phạm Duy D',
    courseName: 'Python cơ bản đến nâng cao',
    message: 'Thầy ơi khi nào thầy ra thêm bài giảng mới về Django ạ? Em rất mong đợi.',
    time: '2 ngày trước',
    isRead: true,
  },
  {
    id: '5',
    studentName: 'Hoàng Thị E',
    courseName: 'Khởi đầu lập trình web',
    message: 'Em bị lỗi CORS khi deploy lên Vercel, thầy có thể hỗ trợ em được không ạ?',
    time: '3 ngày trước',
    isRead: true,
  },
];

export const InstructorCommunication: React.FC = () => {
  const unreadCount = MOCK_MESSAGES.filter((m) => !m.isRead).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Giao tiếp</h1>
        <p className="text-muted-foreground mt-2">Câu hỏi và tin nhắn từ học viên của bạn.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Tổng tin nhắn</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">{MOCK_MESSAGES.length}</p>
            </div>
          </div>
        </div>
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Chưa đọc</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">{unreadCount}</p>
            </div>
          </div>
        </div>
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-green-500/10 text-green-600 dark:text-green-400 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Thời gian phản hồi TB</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">~2h</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
        <Input
          placeholder="Tìm tin nhắn..."
          className="pl-10 h-11 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl"
        />
      </div>

      {/* Message List */}
      <div className="space-y-3">
        {MOCK_MESSAGES.map((msg) => (
          <div
            key={msg.id}
            className={`p-5 bg-white dark:bg-zinc-900 border rounded-2xl transition-all duration-200 cursor-pointer hover:shadow-md ${
              msg.isRead
                ? 'border-zinc-200 dark:border-zinc-800'
                : 'border-primary/30 bg-primary/[0.02] dark:bg-primary/[0.03]'
            }`}
          >
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-600 dark:text-zinc-300 shrink-0">
                {msg.studentName.charAt(0)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-zinc-900 dark:text-white text-sm">{msg.studentName}</span>
                  {!msg.isRead && <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] px-1.5 py-0">Mới</Badge>}
                </div>

                <div className="flex items-center gap-1.5 mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  <BookOpen className="w-3 h-3" />
                  <span>{msg.courseName}</span>
                  <span className="mx-1">•</span>
                  <Clock className="w-3 h-3" />
                  <span>{msg.time}</span>
                </div>

                <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300 line-clamp-2">{msg.message}</p>
              </div>

              <Button variant="ghost" size="sm" className="text-xs shrink-0">
                Trả lời
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
