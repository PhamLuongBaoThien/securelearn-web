// ========================
// Instructor Communication: Hỏi đáp & Tin nhắn
// Hỏi đáp học viên (filter theo khóa học) + Tin nhắn
// ========================
import React, { useState } from 'react';
import { MessageSquare, Mail, Search, ChevronDown, ThumbsUp, Clock, Check, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type CommTab = 'qa' | 'messages';

// ─── Mock Data ───
const MOCK_COURSES = [
  { id: 'all', title: 'Tất cả khóa học' },
  { id: '1', title: 'React Nâng cao' },
  { id: '2', title: 'Node.js Microservices' },
  { id: '3', title: 'TypeScript Toàn tập' },
];

const MOCK_QUESTIONS = [
  {
    id: 1, courseId: '1', course: 'React Nâng cao',
    student: 'Nguyễn Văn A', avatar: 'N', time: '2 giờ trước',
    question: 'Sự khác biệt giữa useCallback và useMemo là gì? Khi nào nên dùng cái nào?',
    answered: false, likes: 4,
  },
  {
    id: 2, courseId: '2', course: 'Node.js Microservices',
    student: 'Trần Thị B', avatar: 'T', time: '5 giờ trước',
    question: 'Làm thế nào để xử lý lỗi circuit breaker trong microservices?',
    answered: true, answer: 'Circuit breaker pattern được dùng để ngăn chặn cascading failures. Bạn có thể dùng thư viện opossum hoặc tự implement với state machine gồm 3 trạng thái: CLOSED, OPEN, HALF_OPEN.',
    likes: 7,
  },
  {
    id: 3, courseId: '3', course: 'TypeScript Toàn tập',
    student: 'Lê Văn C', avatar: 'L', time: '1 ngày trước',
    question: 'Conditional Types và Template Literal Types trong TypeScript có thể kết hợp như thế nào?',
    answered: false, likes: 2,
  },
  {
    id: 4, courseId: '1', course: 'React Nâng cao',
    student: 'Phạm Thị D', avatar: 'P', time: '2 ngày trước',
    question: 'Context API vs Redux: Khi nào nên dùng cái nào trong dự án thực tế?',
    answered: true, answer: 'Context API phù hợp cho global state đơn giản (theme, user auth). Redux phù hợp cho state phức tạp, cần middleware, time-travel debugging, hoặc team lớn.',
    likes: 11,
  },
];

const MOCK_MESSAGES = [
  { id: 1, student: 'Nguyễn Văn A', avatar: 'N', lastMsg: 'Thầy ơi, em muốn hỏi thêm về bài tập số 3 ạ.', time: '10 phút trước', unread: 2, course: 'React Nâng cao' },
  { id: 2, student: 'Trần Thị B', avatar: 'T', lastMsg: 'Cảm ơn thầy đã giải đáp rất nhiều!', time: '1 giờ trước', unread: 0, course: 'Node.js Microservices' },
  { id: 3, student: 'Lê Văn C', avatar: 'L', lastMsg: 'Em đã hiểu rồi ạ, cảm ơn thầy.', time: '3 giờ trước', unread: 0, course: 'TypeScript Toàn tập' },
];

// ─── Q&A Tab ───
const QATab: React.FC = () => {
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [search, setSearch] = useState('');
  const [replyId, setReplyId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [questions, setQuestions] = useState(MOCK_QUESTIONS);

  const filtered = questions.filter(q => {
    const matchCourse = selectedCourse === 'all' || q.courseId === selectedCourse;
    const matchSearch = q.question.toLowerCase().includes(search.toLowerCase()) || q.student.toLowerCase().includes(search.toLowerCase());
    return matchCourse && matchSearch;
  });

  const handleReply = (id: number) => {
    if (!replyText.trim()) return;
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, answered: true, answer: replyText.trim() } : q));
    setReplyId(null);
    setReplyText('');
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm câu hỏi..." className="pl-9 h-10 rounded-xl" />
        </div>
        <div className="relative">
          <select
            value={selectedCourse}
            onChange={e => setSelectedCourse(e.target.value)}
            className="h-10 pl-3 pr-8 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 appearance-none cursor-pointer"
          >
            {MOCK_COURSES.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-4 text-sm">
        <span className="px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-lg font-medium">
          {filtered.filter(q => !q.answered).length} chưa trả lời
        </span>
        <span className="px-3 py-1.5 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 rounded-lg font-medium">
          {filtered.filter(q => q.answered).length} đã trả lời
        </span>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-zinc-400">Không có câu hỏi nào.</div>
        ) : filtered.map(q => (
          <div key={q.id} className={`bg-white dark:bg-zinc-900 border rounded-2xl p-5 space-y-4 ${q.answered ? 'border-zinc-200 dark:border-zinc-800' : 'border-amber-200 dark:border-amber-500/30'}`}>
            {/* Question */}
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center font-bold text-primary text-sm shrink-0">{q.avatar}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-zinc-900 dark:text-white">{q.student}</span>
                  <span className="text-xs text-zinc-400">· {q.course} · {q.time}</span>
                  {q.answered
                    ? <span className="ml-auto text-xs px-2 py-0.5 bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-full flex items-center gap-1"><Check className="w-3 h-3" />Đã trả lời</span>
                    : <span className="ml-auto text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-full flex items-center gap-1"><Clock className="w-3 h-3" />Chờ trả lời</span>
                  }
                </div>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{q.question}</p>
                <div className="flex items-center gap-1 mt-2 text-xs text-zinc-400">
                  <ThumbsUp className="w-3 h-3" />{q.likes} người thấy hữu ích
                </div>
              </div>
            </div>

            {/* Answer */}
            {q.answered && q.answer && (
              <div className="ml-12 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground">GV</div>
                  <span className="text-xs font-semibold text-primary">Giảng viên (Bạn)</span>
                </div>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{q.answer}</p>
              </div>
            )}

            {/* Reply area */}
            {!q.answered && replyId !== q.id && (
              <div className="ml-12">
                <Button variant="outline" size="sm" onClick={() => setReplyId(q.id)} className="rounded-xl gap-2 text-xs">
                  <MessageSquare className="w-3.5 h-3.5" /> Trả lời
                </Button>
              </div>
            )}
            {replyId === q.id && (
              <div className="ml-12 space-y-2">
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  rows={3}
                  placeholder="Nhập câu trả lời của bạn..."
                  className="w-full p-3 rounded-xl bg-background border border-zinc-200 dark:border-zinc-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleReply(q.id)} className="rounded-xl gap-2 text-xs"><Send className="w-3.5 h-3.5" /> Gửi trả lời</Button>
                  <Button variant="ghost" size="sm" onClick={() => { setReplyId(null); setReplyText(''); }} className="rounded-xl text-xs">Hủy</Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Messages Tab ───
const MessagesTab: React.FC = () => {
  const [selected, setSelected] = useState<number | null>(null);
  const [input, setInput] = useState('');

  const conv = MOCK_MESSAGES.find(m => m.id === selected);

  return (
    <div className="flex gap-4 h-[520px]">
      {/* Conversation list */}
      <div className="w-72 shrink-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
        <div className="p-3 border-b border-zinc-100 dark:border-zinc-800">
          <p className="text-sm font-bold text-zinc-900 dark:text-white">Tin nhắn</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {MOCK_MESSAGES.map(m => (
            <button
              key={m.id}
              onClick={() => setSelected(m.id)}
              className={`w-full flex items-start gap-3 p-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors border-b border-zinc-100 dark:border-zinc-800/60 last:border-0 ${selected === m.id ? 'bg-primary/5' : ''}`}
            >
              <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center font-bold text-primary text-sm shrink-0">{m.avatar}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{m.student}</span>
                  {m.unread > 0 && <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground shrink-0">{m.unread}</span>}
                </div>
                <p className="text-xs text-zinc-400 truncate">{m.lastMsg}</p>
                <p className="text-[10px] text-zinc-300 dark:text-zinc-600 mt-0.5">{m.time}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col overflow-hidden">
        {!conv ? (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 gap-3">
            <Mail className="w-12 h-12 opacity-30" />
            <p className="text-sm">Chọn một cuộc trò chuyện</p>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center font-bold text-primary text-sm">{conv.avatar}</div>
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-white">{conv.student}</p>
                <p className="text-xs text-zinc-400">{conv.course}</p>
              </div>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary shrink-0">{conv.avatar}</div>
                <div className="max-w-[70%] bg-zinc-100 dark:bg-zinc-800 rounded-2xl rounded-tl-none px-4 py-2.5">
                  <p className="text-sm text-zinc-800 dark:text-zinc-200">{conv.lastMsg}</p>
                </div>
              </div>
            </div>
            <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 flex gap-2">
              <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Nhập tin nhắn..." className="h-10 rounded-xl flex-1" onKeyDown={e => e.key === 'Enter' && setInput('')} />
              <Button size="sm" className="h-10 w-10 p-0 rounded-xl" onClick={() => setInput('')}><Send className="w-4 h-4" /></Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Main Export ───
export const InstructorCommunication: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CommTab>('qa');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Giao tiếp</h1>
        <p className="text-muted-foreground mt-1">Quản lý hỏi đáp và tin nhắn với học viên.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 w-fit">
        {([
          { id: 'qa' as CommTab, label: 'Hỏi đáp', icon: <MessageSquare className="w-4 h-4" /> },
          { id: 'messages' as CommTab, label: 'Tin nhắn', icon: <Mail className="w-4 h-4" /> },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200 dark:border-zinc-700'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'qa'       && <QATab />}
      {activeTab === 'messages' && <MessagesTab />}
    </div>
  );
};
