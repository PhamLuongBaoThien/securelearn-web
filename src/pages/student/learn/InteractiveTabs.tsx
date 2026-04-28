import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Download,
  MessageSquare,
  PenLine,
  FileText,
  FileCode,
  Archive,
  ThumbsUp,
  Clock,
  Send,
} from 'lucide-react';

type TabId = 'overview' | 'resources' | 'qa' | 'notes';

const TABS = [
  { id: 'overview' as TabId, label: 'Tổng quan', icon: BookOpen },
  { id: 'resources' as TabId, label: 'Tài nguyên', icon: Download },
  { id: 'qa' as TabId, label: 'Hỏi đáp', icon: MessageSquare },
  { id: 'notes' as TabId, label: 'Ghi chú', icon: PenLine },
];

const resources = [
  { name: 'hls_encryption_cheatsheet.pdf', size: '2.4 MB', icon: FileText, color: 'text-red-500' },
  { name: 'drm_core_source_code.zip', size: '18.7 MB', icon: Archive, color: 'text-amber-500' },
  { name: 'widevine_integration_guide.md', size: '156 KB', icon: FileCode, color: 'text-blue-500' },
];

const qaThreads = [
  {
    id: 'q1',
    user: 'Nguyễn Văn A',
    avatar: 'NA',
    question: 'Tại phút 2:30, làm sao để hệ thống biết lúc nào cần rotate AES key mà không gây gián đoạn stream?',
    timestamp: '2:30',
    time: '2 giờ trước',
    likes: 12,
    answers: [{
      user: 'Nguyễn Văn Thắng',
      avatar: 'NT',
      content: 'Key rotation được trigger theo session-based. Mỗi lần user refresh player, hệ thống cấp 1 key mới TTL = 2h.',
      isInstructor: true,
      time: '1 giờ trước',
    }],
  },
  {
    id: 'q2',
    user: 'Trần Thị B',
    avatar: 'TB',
    question: 'Dynamic watermark có ảnh hưởng đến GPU performance trên mobile không ạ?',
    timestamp: '15:45',
    time: '5 giờ trước',
    likes: 8,
    answers: [],
  },
];

// ── Sub panels ─────────────────────────────────
function OverviewPanel() {
  return (
    <div className="p-5 space-y-4">
      <div>
        <h4 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1.5">Về bài học này</h4>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
          Đi sâu vào cơ chế mã hóa video theo chuẩn <strong className="text-zinc-700 dark:text-zinc-200">HLS/AES-128</strong> kết hợp Widevine CDM — giải pháp DRM được dùng bởi Netflix, YouTube Premium.
        </p>
      </div>
      <div>
        <h4 className="text-sm font-semibold text-zinc-900 dark:text-white mb-2">Bạn sẽ học được</h4>
        <ul className="space-y-1.5">
          {[
            'Chia nhỏ video thành các đoạn .ts được mã hóa riêng biệt',
            'Triển khai Key Server phân phối khóa giải mã realtime',
            'Tích hợp Dynamic Watermark chống quay lén',
            'Cấu hình One-time URL với TTL theo phiên học',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-zinc-500 dark:text-zinc-400">
              <span className="w-4 h-4 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">{i + 1}</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ResourcesPanel() {
  return (
    <div className="p-5 space-y-2">
      {resources.map((file) => {
        const Icon = file.icon;
        return (
          <button
            key={file.name}
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors group text-left"
          >
            <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 shrink-0">
              <Icon className={`w-4 h-4 ${file.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate group-hover:text-primary transition-colors">{file.name}</p>
              <p className="text-xs text-zinc-400">{file.size}</p>
            </div>
            <Download className="w-3.5 h-3.5 text-zinc-400 group-hover:text-primary transition-colors shrink-0" />
          </button>
        );
      })}
    </div>
  );
}

function QAPanel() {
  const [question, setQuestion] = useState('');
  return (
    <div className="p-5 space-y-4">
      {/* Ask */}
      <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Đặt câu hỏi... Tự động gắn mốc thời gian video hiện tại."
          rows={2}
          className="w-full bg-transparent text-sm text-zinc-700 dark:text-zinc-200 placeholder:text-zinc-400 resize-none focus:outline-none"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-zinc-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Mốc: <span className="font-mono text-primary font-semibold ml-1">25:10</span>
          </span>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity">
            <Send className="w-3 h-3" />
            Gửi
          </button>
        </div>
      </div>

      {/* Threads */}
      {qaThreads.map((thread) => (
        <div key={thread.id} className="space-y-2">
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-bold flex items-center justify-center shrink-0">
              {thread.avatar}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-100">{thread.user}</span>
                <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-xs font-mono">▶ {thread.timestamp}</span>
                <span className="text-xs text-zinc-400">{thread.time}</span>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">{thread.question}</p>
              <button className="flex items-center gap-1 text-xs text-zinc-400 hover:text-primary transition-colors mt-1">
                <ThumbsUp className="w-3 h-3" />{thread.likes}
              </button>
            </div>
          </div>
          {thread.answers.map((ans, i) => (
            <div key={i} className="flex gap-2.5 ml-9">
              <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                ans.isInstructor ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' : 'bg-teal-100 dark:bg-teal-900/30 text-teal-700'
              }`}>
                {ans.avatar}
              </div>
              <div className="flex-1 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">{ans.user}</span>
                  {ans.isInstructor && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium">Giảng viên</span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{ans.content}</p>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function NotesPanel() {
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const handleChange = (val: string) => {
    setNotes(val);
    setSaved(false);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setSaved(true), 1500);
  };

  return (
    <div className="p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span>Ghi chú tại <span className="font-mono text-primary font-semibold">25:10</span></span>
        {saved && <span className="text-emerald-500 font-medium">✓ Đã lưu</span>}
      </div>
      <textarea
        value={notes}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Ghi chú cá nhân — tự động lưu và gắn mốc thời gian..."
        className="flex-1 min-h-[180px] w-full bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 text-sm text-zinc-700 dark:text-zinc-200 placeholder:text-zinc-400 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
      />
    </div>
  );
}

// ── Main ──────────────────────────────────────
export function InteractiveTabs() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 shrink-0">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors ${
                isActive ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
              {isActive && (
                <motion.div
                  layoutId="learn-tab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'overview' && <OverviewPanel />}
            {activeTab === 'resources' && <ResourcesPanel />}
            {activeTab === 'qa' && <QAPanel />}
            {activeTab === 'notes' && <NotesPanel />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
