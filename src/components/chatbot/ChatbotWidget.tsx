import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent, MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { FileText, History, LifeBuoy, Loader2, MessageCircle, Plus, Send, Trash2, X } from 'lucide-react';
import {
  clearChatbotConversations,
  deleteChatbotConversation,
  getChatbotConversations,
  getChatbotMessages,
  sendChatbotMessage,
  type ChatbotConversation,
  type ChatbotIntent,
  type SuggestedCourse,
} from '@/services/chatbotApi';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/branding/BrandLogo';
import { useAppSelector } from '@/app/hooks';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestedCourses?: SuggestedCourse[];
  intent?: ChatbotIntent;
};

const STORAGE_KEY = 'securelearn_chatbot_session';
const welcomeMessage: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: 'Xin chào! Mình có thể giúp bạn tìm khóa học phù hợp trên SecureLearn.',
};

const formatPrice = (price?: number) => {
  if (!price) return 'Miễn phí';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const formatConversationTime = (value?: string) => {
  if (!value) return '';
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
};

const readSession = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as { conversationId?: string; guestToken?: string };
  } catch {
    return {};
  }
};

const writeSession = (session: { conversationId: string; guestToken?: string }) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
};

const clearSession = () => localStorage.removeItem(STORAGE_KEY);

const normalizeCourseUrl = (url: string) => url.replace(/^\/courses\//, '/course/');

const toChatMessages = (items: Awaited<ReturnType<typeof getChatbotMessages>>): ChatMessage[] => {
  const mapped = items.map((message) => ({
    id: message.id,
    role: message.role === 'USER' ? 'user' as const : 'assistant' as const,
    content: message.content,
    intent: message.role === 'ASSISTANT' ? message.intent : undefined,
    suggestedCourses: message.role === 'ASSISTANT' && message.intent === 'COURSE' ? message.suggestedCourses || [] : [],
  }));
  return mapped.length ? mapped : [welcomeMessage];
};

export function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [session, setSession] = useState<{ conversationId?: string; guestToken?: string }>({});
  const [conversations, setConversations] = useState<ChatbotConversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { authResolved, isAuthenticated } = useAppSelector((state) => state.auth);

  const disabled = useMemo(() => sending || input.trim().length === 0 || input.trim().length > 1000, [input, sending]);

  const resetChat = () => {
    clearSession();
    setSession({});
    setMessages([{ ...welcomeMessage, id: `welcome-${Date.now()}` }]);
    setHistoryOpen(false);
  };

  const refreshConversations = async (currentSession = session) => {
    setHistoryLoading(true);
    try {
      const data = await getChatbotConversations(currentSession);
      setConversations(data);
    } catch {
      setConversations([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadConversation = async (conversationId: string) => {
    setHistoryLoading(true);
    try {
      const nextSession = { conversationId, guestToken: session.guestToken };
      const data = await getChatbotMessages(conversationId, nextSession);
      setSession(nextSession);
      writeSession(nextSession);
      setMessages(toChatMessages(data));
      setHistoryOpen(false);
    } catch {
      setMessages((old) => [...old, { id: crypto.randomUUID(), role: 'assistant', content: 'Mình chưa thể mở lại cuộc trò chuyện này. Bạn thử lại sau nhé.' }]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const removeConversation = async (event: MouseEvent<HTMLButtonElement>, conversationId: string) => {
    event.stopPropagation();
    setHistoryLoading(true);
    try {
      await deleteChatbotConversation(conversationId, session);
      setConversations((old) => old.filter((item) => item.id !== conversationId));
      if (session.conversationId === conversationId) resetChat();
    } catch {
      setMessages((old) => [...old, { id: crypto.randomUUID(), role: 'assistant', content: 'Mình chưa thể xóa cuộc trò chuyện này. Bạn thử lại sau nhé.' }]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const clearCurrentHistory = async () => {
    if (!session.conversationId) {
      resetChat();
      return;
    }

    setHistoryLoading(true);
    try {
      await deleteChatbotConversation(session.conversationId, session);
      setConversations((old) => old.filter((item) => item.id !== session.conversationId));
      resetChat();
    } catch {
      setMessages((old) => [...old, { id: crypto.randomUUID(), role: 'assistant', content: 'Mình chưa thể xóa lịch sử hiện tại. Bạn thử lại sau nhé.' }]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const clearAllHistory = async () => {
    setHistoryLoading(true);
    try {
      await clearChatbotConversations(session);
      setConversations([]);
      resetChat();
    } catch {
      setMessages((old) => [...old, { id: crypto.randomUUID(), role: 'assistant', content: 'Mình chưa thể xóa toàn bộ lịch sử. Bạn thử lại sau nhé.' }]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (!authResolved) return;

    if (isAuthenticated) {
      clearSession();
      setSession({});
      setConversations([]);
      setHistoryOpen(false);
      setMessages([{ ...welcomeMessage, id: `welcome-${Date.now()}` }]);
      return;
    }

    const savedSession = readSession();
    setSession(savedSession);
    if (savedSession.conversationId) {
      getChatbotMessages(savedSession.conversationId, savedSession)
        .then((data) => setMessages(toChatMessages(data)))
        .catch(() => resetChat());
    }
  }, [authResolved, isAuthenticated]);

  useEffect(() => {
    if (open && historyOpen && isAuthenticated) void refreshConversations();
  }, [open, historyOpen, isAuthenticated]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, sending]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const message = input.trim();
    if (!message || disabled) return;
    setInput('');
    setSending(true);
    setHistoryOpen(false);
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: message };
    setMessages((old) => [...old, userMessage]);
    try {
      const data = await sendChatbotMessage({ message, conversationId: session.conversationId, guestToken: session.guestToken });
      const nextSession = { conversationId: data.conversationId, guestToken: data.guestToken || session.guestToken };
      setSession(nextSession);
      writeSession(nextSession);
      setMessages((old) => [...old, { id: crypto.randomUUID(), role: 'assistant', content: data.reply, intent: data.intent, suggestedCourses: data.intent === 'COURSE' ? data.suggestedCourses : [] }]);
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : error instanceof Error
            ? error.message
            : undefined;
      setMessages((old) => [...old, { id: crypto.randomUUID(), role: 'assistant', content: errorMessage || 'Chatbot chưa thể phản hồi. Bạn thử lại sau nhé.' }]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled) submit(e as unknown as FormEvent);
    }
  };

  return (
    <>
      <style>{`
        @keyframes chatbot-slide-in {
          from { opacity: 0; transform: translateX(20px) scale(0.95); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes chatbot-fade-in-up {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="fixed right-0 bottom-24 z-50 flex items-end gap-0">
        {open && (
          <section
            className="mb-1 mr-3 flex flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/95 shadow-2xl backdrop-blur-sm dark:border-zinc-800/80 dark:bg-zinc-950/95"
            style={{
              width: 'min(calc(100vw - 5rem), 370px)',
              height: 'min(520px, calc(100vh - 6rem))',
              animation: 'chatbot-slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <header className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800/60">
              <div className="flex items-center gap-2.5">
                <BrandLogo className="h-8 w-8 rounded-lg object-contain" />
                <div>
                  <p className="text-[13px] font-semibold leading-tight text-zinc-900 dark:text-white">SecureLearn AI</p>
                  <p className="text-[11px] text-zinc-400">Trợ lý khóa học</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {isAuthenticated && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setHistoryOpen((value) => !value)}
                    className="h-8 w-8 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                    aria-label="Lịch sử chat"
                  >
                    <History className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={resetChat}
                  className="h-8 w-8 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                  aria-label="Cuộc trò chuyện mới"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearCurrentHistory}
                  className="h-8 w-8 rounded-lg text-zinc-400 hover:text-red-500"
                  aria-label="Xóa cuộc trò chuyện hiện tại"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setOpen(false)}
                  className="h-8 w-8 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                  aria-label="Đóng chatbot"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </header>

            {historyOpen && isAuthenticated ? (
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[13px] font-semibold text-zinc-900 dark:text-white">Lịch sử chat</p>
                    <p className="text-[11px] text-zinc-400">Mở lại hoặc xóa cuộc trò chuyện cũ</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllHistory}
                    disabled={historyLoading || conversations.length === 0}
                    className="h-8 rounded-lg px-2 text-[11px] text-zinc-400 hover:text-red-500"
                  >
                    Xóa hết
                  </Button>
                </div>

                {historyLoading ? (
                  <div className="flex items-center gap-2 rounded-xl bg-zinc-50 px-3 py-3 text-[13px] text-zinc-400 dark:bg-zinc-900">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang tải lịch sử…
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="rounded-xl bg-zinc-50 px-3 py-4 text-[13px] text-zinc-500 ring-1 ring-zinc-100 dark:bg-zinc-900 dark:text-zinc-400 dark:ring-zinc-800">
                    Chưa có lịch sử chat nào. Bạn có thể bắt đầu bằng một câu hỏi về khóa học.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {conversations.map((conversation) => (
                      <button
                        key={conversation.id}
                        type="button"
                        onClick={() => loadConversation(conversation.id)}
                        className="group flex w-full items-start gap-2 rounded-xl border border-zinc-100 bg-white p-3 text-left transition-all hover:border-violet-200 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-violet-800"
                      >
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300">
                          <MessageCircle className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-medium text-zinc-800 group-hover:text-violet-600 dark:text-zinc-100 dark:group-hover:text-violet-400">{conversation.title}</span>
                          <span className="mt-0.5 block truncate text-[11px] text-zinc-400">{conversation.lastMessage || 'Chưa có tin nhắn'}</span>
                          <span className="mt-1 block text-[10px] text-zinc-300">{formatConversationTime(conversation.updatedAt)}</span>
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={(event) => removeConversation(event, conversation.id)}
                          className="h-7 w-7 shrink-0 rounded-lg text-zinc-300 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                          aria-label="Xóa cuộc trò chuyện"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {messages.map((message, idx) => (
                  <div
                    key={message.id}
                    className={message.role === 'user' ? 'ml-auto max-w-[82%]' : 'mr-auto max-w-[88%]'}
                    style={{ animation: `chatbot-fade-in-up 0.25s ${idx * 0.04}s both` }}
                  >
                    <div
                      className={
                        message.role === 'user'
                          ? 'rounded-2xl rounded-br-md bg-gradient-to-br from-violet-500 to-indigo-600 px-3.5 py-2.5 text-[13px] leading-relaxed text-white shadow-sm'
                          : 'rounded-2xl rounded-bl-md bg-zinc-50 px-3.5 py-2.5 text-[13px] leading-relaxed text-zinc-700 ring-1 ring-zinc-100 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-zinc-800'
                      }
                    >
                      <p className="whitespace-pre-line">{message.content}</p>
                    </div>

                    {message.role === 'assistant' && message.intent === 'COURSE' && message.suggestedCourses && message.suggestedCourses.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        {message.suggestedCourses.map((course) => (
                          <Link
                            key={`${message.id}-${course.slug}`}
                            to={normalizeCourseUrl(course.url)}
                            className="group block rounded-xl border border-zinc-100 bg-white p-2.5 transition-all hover:border-violet-200 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-violet-800"
                          >
                            <span className="text-[13px] font-medium text-zinc-800 group-hover:text-violet-600 dark:text-zinc-100 dark:group-hover:text-violet-400">{course.title}</span>
                            <span className="mt-0.5 block text-[11px] text-zinc-400">{formatPrice(course.price)}</span>
                          </Link>
                        ))}
                      </div>
                    )}

                    {message.role === 'assistant' && message.intent === 'OUT_OF_SCOPE' && (
                      <div className="mt-2 grid gap-1.5">
                        <Link
                          to="/policies"
                          className="group flex items-center gap-2 rounded-xl border border-zinc-100 bg-white p-2.5 transition-all hover:border-violet-200 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-violet-800"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300">
                            <FileText className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[13px] font-medium text-zinc-800 group-hover:text-violet-600 dark:text-zinc-100 dark:group-hover:text-violet-400">Chính sách & Điều khoản</span>
                            <span className="block text-[11px] text-zinc-400">Xem các quy định đang công khai</span>
                          </span>
                        </Link>
                        <Link
                          to="/support"
                          className="group flex items-center gap-2 rounded-xl border border-zinc-100 bg-white p-2.5 transition-all hover:border-violet-200 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-violet-800"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300">
                            <LifeBuoy className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[13px] font-medium text-zinc-800 group-hover:text-violet-600 dark:text-zinc-100 dark:group-hover:text-violet-400">Hỗ trợ/Góp ý</span>
                            <span className="block text-[11px] text-zinc-400">Gửi yêu cầu cho đội ngũ SecureLearn</span>
                          </span>
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
                {sending && (
                  <div className="mr-auto flex items-center gap-2 rounded-2xl rounded-bl-md bg-zinc-50 px-3.5 py-2.5 text-[13px] text-zinc-400 ring-1 ring-zinc-100 dark:bg-zinc-900 dark:ring-zinc-800">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang trả lời…
                  </div>
                )}
              </div>
            )}

            <form onSubmit={submit} className="border-t border-zinc-100 p-3 dark:border-zinc-800/60">
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  maxLength={1000}
                  placeholder="Nhập câu hỏi…"
                  className="min-h-[38px] max-h-24 flex-1 resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-[13px] outline-none transition-colors placeholder:text-zinc-400 focus:border-violet-300 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-violet-700 dark:focus:bg-zinc-950"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={disabled}
                  className="h-[38px] w-[38px] shrink-0 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-sm hover:shadow-md"
                  aria-label="Gửi"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </form>
          </section>
        )}

        <div
          className="relative"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <Button
            variant="ghost"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Đóng chatbot' : 'Mở chatbot'}
            className={[
              'group flex h-10 items-center gap-2 overflow-hidden rounded-l-2xl rounded-r-none border border-r-0 shadow-lg transition-all duration-300 ease-out',
              open
                ? 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'
                : 'border-violet-500/20 bg-gradient-to-br from-violet-500 to-indigo-600 text-white hover:text-white hover:shadow-xl',
              hovered || open ? 'translate-x-0 px-3 opacity-100' : 'translate-x-3 px-2 opacity-50',
            ].join(' ')}
          >
            {open ? (
              <X className="h-4 w-4 shrink-0" />
            ) : (
              <MessageCircle className="h-4 w-4 shrink-0" />
            )}
            <span
              className={[
                'whitespace-nowrap text-[12px] font-medium transition-all duration-300',
                hovered && !open ? 'max-w-[80px] opacity-100' : 'max-w-0 opacity-0',
              ].join(' ')}
            >
              Hỏi AI
            </span>
          </Button>
        </div>
      </div>
    </>
  );
}



