import { useEffect, useState, useRef } from 'react';
import type { ElementType } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { inboxApi } from '@/services/inboxApi';
import { notificationApi } from '@/services/notificationApi';
import { emitNotificationReconcile } from '@/services/notificationSocket';
import { INBOX_REALTIME_EVENT, emitInboxTyping, isInboxConnected, retainInboxSocket, subscribeInboxTicket, type InboxRealtimeDetail } from '@/services/inboxSocket';
import type { Ticket, TicketDetail, TicketType, TicketMessage } from '@/types/inbox.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { TicketPagination } from '@/components/inbox/TicketPagination';
import { toast } from 'sonner';

import {
  ArrowLeft,
  Send,
  Paperclip,
  HelpCircle,
  MessageSquare,
  AlertTriangle,
  X,
  Clock,
  Loader2,
  History,
  Inbox,
  UploadCloud,
  FileIcon,
  CornerDownRight
} from 'lucide-react';

const statusStyles: Record<string, { label: string; badgeCls: string }> = {
  OPEN: { label: 'Mới', badgeCls: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-900/60' },
  IN_PROGRESS: { label: 'Đang xử lý', badgeCls: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200 dark:border-blue-900/60' },
  WAITING_USER: { label: 'Chờ bạn phản hồi', badgeCls: 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-200 dark:border-rose-900/60 animate-pulse' },
  RESOLVED: { label: 'Đã giải quyết', badgeCls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60' },
  CLOSED: { label: 'Đã đóng', badgeCls: 'bg-zinc-50 text-zinc-700 dark:bg-zinc-950/30 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800' },
};

const typeStyles: Record<string, { label: string; badgeCls: string; icon: ElementType; colorCls: string; iconBgCls: string }> = {
  SUPPORT: {
    label: 'Hỗ trợ',
    badgeCls: 'bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400 border-sky-200 dark:border-sky-850',
    icon: HelpCircle,
    colorCls: 'text-sky-600 dark:text-sky-400',
    iconBgCls: 'bg-sky-50 dark:bg-sky-950/40',
  },
  REPORT: {
    label: 'Báo cáo',
    badgeCls: 'bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400 border-orange-200 dark:border-orange-855',
    icon: AlertTriangle,
    colorCls: 'text-orange-600 dark:text-orange-400',
    iconBgCls: 'bg-orange-50 dark:bg-orange-950/40',
  },
  FEEDBACK: {
    label: 'Góp ý',
    badgeCls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-850',
    icon: MessageSquare,
    colorCls: 'text-emerald-600 dark:text-emerald-400',
    iconBgCls: 'bg-emerald-50 dark:bg-emerald-950/40',
  },
};

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export function SupportCenter() {
  const { id } = useParams();
  const nav = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [items, setItems] = useState<Ticket[]>([]);
  const [listPage, setListPage] = useState(1);
  const [listTotal, setListTotal] = useState(0);
  const [listTotalPages, setListTotalPages] = useState(0);
  const [detail, setDetail] = useState<TicketDetail | null>(null);
  const [allMessages, setAllMessages] = useState<TicketMessage[]>([]);
  const [type, setType] = useState<TicketType>('SUPPORT');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reply, setReply] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [replying, setReplying] = useState(false);
  const [messagePage, setMessagePage] = useState(1);
  const [socketConnected, setSocketConnected] = useState(isInboxConnected());
  const [typing, setTyping] = useState(false);
  const [loadingOldMessages, setLoadingOldMessages] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollHeightRef = useRef<number>(0);
  const shouldScrollToBottomRef = useRef<boolean>(true);

  useEffect(() => retainInboxSocket(), []);
  useEffect(() => id ? subscribeInboxTicket(id) : undefined, [id]);

  const load = async (resetPage = false) => {
    try {
      if (id) {
        const currentPage = resetPage ? 1 : messagePage;
        const res = await inboxApi.detail(id, false, { messagePage: currentPage });
        setDetail(res);
        if (resetPage || currentPage === 1) {
          setAllMessages(res.messages.items);
          setMessagePage(1);
          shouldScrollToBottomRef.current = true;
        }
      } else {
        const res = await inboxApi.list({ page: listPage, limit: 20 });
        setItems(res.items);
        setListTotal(res.total);
        setListTotalPages(res.totalPages);
        if (res.totalPages > 0 && listPage > res.totalPages) setListPage(res.totalPages);
      }
    } catch (e) {
      const error = e as ApiError;
      toast.error(error.response?.data?.message || 'Không thể tải thông tin yêu cầu.');
    }
  };

  const loadMoreMessages = async () => {
    if (!detail || messagePage >= detail.messages.totalPages || loadingOldMessages) return;
    const container = chatContainerRef.current;
    if (container) {
      scrollHeightRef.current = container.scrollHeight;
    }
    setLoadingOldMessages(true);
    shouldScrollToBottomRef.current = false;
    try {
      const nextPage = messagePage + 1;
      const res = await inboxApi.detail(id!, false, { messagePage: nextPage });
      setDetail(res);
      setAllMessages(prev => {
        const existingIds = new Set(prev.map(m => m._id));
        const newItems = res.messages.items.filter(m => !existingIds.has(m._id));
        return [...newItems, ...prev];
      });
      setMessagePage(nextPage);
    } catch (e) {
      toast.error('Không thể tải tin nhắn cũ hơn.');
    } finally {
      setLoadingOldMessages(false);
    }
  };

  useEffect(() => {
    if (id) {
      void load(true);
    } else {
      void load();
    }
  }, [id, listPage]);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const handler = (event: Event) => {
      const d = (event as CustomEvent<InboxRealtimeDetail>).detail;
      if (d.type === 'status') {
        setSocketConnected(d.connected);
        if (!d.connected) setTyping(false);
      }
      if (['reconcile', 'ticket-new', 'ticket-updated', 'read'].includes(d.type)) {
        void load();
      }
      if (d.type === 'message-new') {
        const newMsg = d.payload as TicketMessage;
        if (newMsg && newMsg.ticketId === id) {
          setAllMessages(prev => {
            if (prev.some(m => m._id === newMsg._id)) return prev;
            shouldScrollToBottomRef.current = true;
            return [...prev, newMsg];
          });
          void inboxApi.detail(id, false, { messagePage }).then(res => setDetail(res));
        } else {
          void load();
        }
      }
      if (d.type === 'typing' && d.ticketId === id && d.identityType === 'ADMIN') {
        setTyping(d.typing);
        clearTimeout(timer);
        if (d.typing) timer = setTimeout(() => setTyping(false), 5000);
      }
    };
    window.addEventListener(INBOX_REALTIME_EVENT, handler);
    return () => {
      window.removeEventListener(INBOX_REALTIME_EVENT, handler);
      clearTimeout(timer);
    };
  }, [id, listPage, messagePage]);

  useEffect(() => {
    if (id && detail) {
      void inboxApi.markRead(id);
      void notificationApi.markReadByUrl(`/support/tickets/${id}`).then(() => {
        emitNotificationReconcile();
      });
    }
  }, [id, allMessages.length, detail]);
  useEffect(() => { if (socketConnected || document.hidden) return; const timer = setInterval(() => void load(), 15000); return () => clearInterval(timer); }, [socketConnected, id]);

  useEffect(() => {
    if (!detail) return;
    const container = chatContainerRef.current;
    if (!container) return;

    if (shouldScrollToBottomRef.current) {
      const timer = setTimeout(() => {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
      return () => clearTimeout(timer);
    } else {
      const newScrollHeight = container.scrollHeight;
      const diff = newScrollHeight - scrollHeightRef.current;
      if (diff > 0) {
        container.scrollTop = diff;
      }
      shouldScrollToBottomRef.current = true;
    }
  }, [allMessages.length, id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`Tệp ${file.name} vượt quá dung lượng tối đa 10MB.`);
        return false;
      }
      return true;
    }).slice(0, 5 - files.length);

    setFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const create = async () => {
    if (!title.trim() || !description.trim()) {
      return toast.error('Vui lòng nhập đầy đủ tiêu đề và nội dung mô tả.');
    }
    setLoading(true);
    try {
      const ticket = await inboxApi.create({ type, title, description });
      if (files.length) {
        const attachments = await inboxApi.upload(ticket._id, files);
        await inboxApi.message(ticket._id, {
          content: 'Đã tải lên tệp đính kèm.',
          attachmentIds: attachments.map(x => x._id),
          silentNotification: true,
        });
      }
      toast.success('Đã gửi yêu cầu hỗ trợ thành công.');
      setTitle('');
      setDescription('');
      setFiles([]);
      nav(`/support/tickets/${ticket._id}`);
    } catch (e) {
      const error = e as ApiError;
      toast.error(error.response?.data?.message || 'Không thể gửi yêu cầu hỗ trợ.');
    } finally {
      setLoading(false);
    }
  };

  const send = async () => {
    if (!id || (!reply.trim() && !files.length)) return;
    setReplying(true);
    try {
      let attachmentIds: string[] = [];
      if (files.length) {
        const uploaded = await inboxApi.upload(id, files);
        attachmentIds = uploaded.map(x => x._id);
      }

      const content = reply.trim() || 'Gửi tệp đính kèm';
      const newMsg = await inboxApi.message(id, { content, attachmentIds });

      setReply('');
      setFiles([]);

      setAllMessages(prev => {
        if (prev.some(m => m._id === newMsg._id)) return prev;
        shouldScrollToBottomRef.current = true;
        return [...prev, newMsg];
      });
      void inboxApi.detail(id, false, { messagePage }).then(res => setDetail(res));
    } catch (e) {
      const error = e as ApiError;
      toast.error(error.response?.data?.message || 'Không thể gửi phản hồi.');
    } finally {
      setReplying(false);
    }
  };

  const getMessageAttachments = (message: TicketMessage) => {
    if (!message.attachmentIds || !message.attachmentIds.length || !detail?.attachments) return [];
    return detail.attachments.filter(att => message.attachmentIds.includes(att._id));
  };

  if (id && detail) {
    const style = typeStyles[detail.type] || typeStyles.SUPPORT;
    const status = statusStyles[detail.status] || statusStyles.OPEN;

    return (
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Nút quay lại và badges */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <Button
            variant="outline"
            onClick={() => nav('/support')}
            className="rounded-xl h-9 border-border/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer flex items-center gap-1.5 self-start"
          >
            <ArrowLeft className="h-4 w-4" />
            Danh sách yêu cầu
          </Button>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border ${style.badgeCls}`}>
              {style.label}
            </span>
            <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border ${status.badgeCls}`}>
              {status.label}
            </span>
          </div>
        </div>

        {/* Bố cục 2 Cột hiện đại */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* CỘT TRÁI: Thông tin chi tiết yêu cầu */}
          <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-24 self-start">
            <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm space-y-4 relative overflow-hidden">
              {/* Trang trí background chìm */}
              <div className="absolute -right-6 -bottom-6 opacity-[0.03] pointer-events-none dark:opacity-[0.05]">
                <HelpCircle className="w-24 h-24 text-foreground" />
              </div>

              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Chi tiết yêu cầu</h3>
                <h1 className="text-lg font-extrabold text-foreground mt-2 leading-snug tracking-tight">{detail.title}</h1>
              </div>

              <hr className="border-border/50" />

              <div className="space-y-3.5 text-sm">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Mở ngày</span>
                  <span className="font-semibold text-foreground">{new Date(detail.createdAt).toLocaleDateString('vi-VN')} {new Date(detail.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Cập nhật cuối</span>
                  <span className="font-semibold text-foreground">{new Date(detail.updatedAt).toLocaleDateString('vi-VN')} {new Date(detail.updatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              <hr className="border-border/50" />

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Mô tả ban đầu</h4>
                <div className="text-sm text-muted-foreground leading-relaxed bg-muted/40 p-4 rounded-2xl border border-border/40 whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {detail.description}
                </div>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: Khung chat và soạn thảo phản hồi */}
          <div className="lg:col-span-2 space-y-5">

            {/* Lịch sử trò chuyện */}
            <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-border/60 bg-muted/5 flex items-center justify-between">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 pl-0.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Lịch sử cuộc trao đổi
                </h3>
              </div>

              <div ref={chatContainerRef} className="p-5 space-y-6 max-h-[520px] overflow-y-auto scrollbar-thin scrollbar-thumb-border">
                {allMessages.length < detail.messages.total && (
                  <div className="flex justify-center pb-2.5 border-b border-border/40 mb-3 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={loadMoreMessages}
                      disabled={loadingOldMessages}
                      className="text-xs text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-1.5 rounded-xl border border-border/50 hover:bg-muted/50 py-1.5 px-3"
                    >
                      {loadingOldMessages ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin text-primary" />
                          Đang tải tin nhắn cũ...
                        </>
                      ) : (
                        'Xem tin nhắn cũ hơn'
                      )}
                    </Button>
                  </div>
                )}

                {allMessages.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground border border-dashed border-border/60 rounded-2xl bg-muted/10">
                    Chưa có phản hồi nào cho yêu cầu này.
                  </div>
                ) : (
                  allMessages.map(m => {
                    const isAdminMsg = m.author.type === 'ADMIN';
                    const msgAttachments = getMessageAttachments(m);

                    return (
                      <div
                        key={m._id}
                        className={`flex gap-3 items-start w-full ${isAdminMsg ? 'justify-start' : 'justify-end'}`}
                      >
                        {/* Avatar Admin */}
                        {isAdminMsg && (
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                            S
                          </div>
                        )}

                        <div className={`flex flex-col max-w-[75%] ${isAdminMsg ? 'items-start' : 'items-end'}`}>
                          <div
                            className={`rounded-2xl p-4 shadow-sm border ${isAdminMsg
                              ? 'bg-muted text-foreground border-border/60 rounded-tl-none'
                              : 'bg-gradient-to-br from-primary to-primary/95 text-primary-foreground border-transparent rounded-tr-none shadow-md shadow-primary/5'
                              }`}
                          >
                            <div className={`text-[10px] font-extrabold uppercase tracking-wider mb-1 ${isAdminMsg ? 'text-primary' : 'text-primary-foreground/80'
                              }`}>
                              {isAdminMsg ? 'Hỗ trợ SecureLearn' : 'Bạn'}
                            </div>

                            <p className="text-sm whitespace-pre-wrap leading-relaxed break-words">{m.content}</p>

                            {msgAttachments.length > 0 && (
                              <div className="mt-3.5 space-y-2 border-t border-border/20 pt-2.5">
                                {msgAttachments.map(att => {
                                  return (
                                    <button
                                      type="button"
                                      key={att._id}
                                      onClick={() => void inboxApi.openAttachment(att._id)}
                                      className={`flex w-full items-center gap-2.5 p-2 rounded-xl text-xs transition-all border ${isAdminMsg
                                        ? 'bg-background hover:bg-muted border-border/50 text-foreground'
                                        : 'bg-white/10 hover:bg-white/20 border-white/10 text-primary-foreground'
                                        }`}
                                    >
                                      <FileIcon className="h-4 w-4 shrink-0" />
                                      <span className="truncate max-w-[180px] font-medium">{att.originalName}</span>
                                      <span className="text-[10px] opacity-80 shrink-0">({(att.sizeBytes / 1024 / 1024).toFixed(2)} MB)</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          <span className="text-[9px] text-muted-foreground mt-1.5 px-1 flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            {new Date(m.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} · {new Date(m.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>

                        {/* Avatar Học viên */}
                        {!isAdminMsg && (
                          <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 text-foreground border border-border flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                            U
                          </div>
                        )}
                      </div>
                    );
                  })
                )}

                <div ref={messagesEndRef} className="h-6" />
              </div>
            </div>

            {/* Ô nhập tin nhắn */}
            {detail.status !== 'CLOSED' && (
              <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-3.5 shadow-sm relative overflow-hidden">
                {files.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1 pb-2 border-b border-border/40">
                    {files.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-muted/50 text-xs font-medium">
                        <FileIcon className="h-3.5 w-3.5 text-primary" />
                        <span className="truncate max-w-[150px]">{file.name}</span>
                        <span className="text-[9px] text-muted-foreground">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="ml-1 text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {typing && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground pl-1">
                    <span className="flex h-1.5 w-1.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                    </span>
                    <p className="animate-pulse">Quản trị viên đang nhập phản hồi…</p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <textarea
                    className="min-h-16 flex-1 w-full rounded-xl border border-border/80 bg-transparent p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none placeholder:text-muted-foreground/50 leading-relaxed"
                    value={reply}
                    onChange={e => { setReply(e.target.value); if (id) emitInboxTyping(id, true); }}
                    placeholder="Nhập nội dung câu trả lời của bạn..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        void send();
                      }
                    }}
                  />
                </div>

                <div className="flex items-center justify-between border-t border-border/40 pt-3">
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      multiple
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={replying || files.length >= 5}
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-xl h-9 text-xs border-border/80 text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-1.5"
                    >
                      <Paperclip className="h-4 w-4" />
                      Đính kèm tài liệu ({files.length}/5)
                    </Button>
                  </div>

                  <Button
                    onClick={() => void send()}
                    disabled={replying || (!reply.trim() && !files.length)}
                    className="rounded-xl h-9 px-5 text-xs font-bold cursor-pointer shadow-md shadow-primary/10 hover:shadow-lg transition-all"
                  >
                    {replying ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Đang gửi...
                      </>
                    ) : (
                      <>
                        <Send className="mr-1.5 h-3.5 w-3.5" />
                        Gửi phản hồi
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="mb-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
          <HelpCircle className="h-8 w-8 text-primary animate-pulse" />
          Trung tâm hỗ trợ
        </h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          Gửi các báo cáo lỗi, góp ý phát triển hoặc yêu cầu hỗ trợ và nhận phản hồi trực tiếp từ đội ngũ SecureLearn.
        </p>
        <hr className="border-border/60 mt-6" />
      </div>

      <div className="grid gap-8 lg:grid-cols-5 items-start">
        <div className="lg:col-span-2 rounded-2xl border border-border/60 bg-card p-6 shadow-sm space-y-5">
          <div>
            <h2 className="font-bold text-lg text-foreground">Tạo yêu cầu mới</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Chúng tôi thường phản hồi trong vòng 24 giờ.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground block pl-0.5">Loại yêu cầu</label>
              <Select
                value={type}
                onChange={e => setType(e.target.value as TicketType)}
                className="bg-white dark:bg-zinc-950 border border-border/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 h-10 cursor-pointer"
              >
                <option value="SUPPORT">Hỗ trợ kỹ thuật / tài khoản</option>
                <option value="FEEDBACK">Góp ý giao diện / chức năng</option>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground block pl-0.5">Tiêu đề ngắn gọn</label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="VD: Không xem được video bài giảng số 3..."
                className="rounded-xl border border-border/80 bg-transparent px-3 py-2 text-sm h-10 placeholder:text-muted-foreground/60"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground block pl-0.5">Mô tả chi tiết</label>
              <textarea
                className="min-h-32 w-full rounded-xl border border-border bg-transparent p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-none placeholder:text-muted-foreground/60"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Mô tả chi tiết vấn đề bạn đang gặp phải, các bước thực hiện dẫn đến lỗi..."
              />
            </div>

            {files.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {files.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-muted/50 text-xs font-medium">
                    <FileIcon className="h-3.5 w-3.5 text-primary" />
                    <span className="truncate max-w-[130px]">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="ml-1 text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <input
                type="file"
                ref={fileInputRef}
                multiple
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                disabled={loading || files.length >= 5}
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 border border-dashed border-border/80 hover:border-primary rounded-xl flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-primary bg-muted/10 transition-colors cursor-pointer"
              >
                <UploadCloud className="h-6 w-6 opacity-70" />
                <span className="text-xs font-semibold">Tải lên tệp đính kèm ({files.length}/5)</span>
                <span className="text-[10px] opacity-60">Nhận ảnh JPG, PNG, WEBP hoặc tài liệu PDF (tối đa 10MB/tệp)</span>
              </button>
            </div>

            <Button
              disabled={loading}
              onClick={() => void create()}
              className="w-full rounded-xl h-10 font-bold tracking-wide cursor-pointer shadow-md shadow-primary/10"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang gửi yêu cầu...
                </>
              ) : (
                'Gửi yêu cầu hỗ trợ'
              )}
            </Button>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between pl-1">
            <h2 className="font-bold text-lg text-foreground flex items-center gap-1.5">
              <History className="h-5 w-5 text-muted-foreground" />
              Yêu cầu đã gửi của bạn
            </h2>
            <span className="text-xs text-muted-foreground font-medium">Tổng số: {listTotal}</span>
          </div>

          <div className="space-y-4">
            {items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/80 py-20 text-center text-muted-foreground flex flex-col items-center justify-center gap-4 bg-card/30">
                <div className="p-4 rounded-full bg-muted">
                  <Inbox className="h-10 w-10 opacity-30 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground mb-1">Chưa có yêu cầu nào</h3>
                  <p className="text-sm px-6">Lịch sử các yêu cầu hỗ trợ hoặc báo cáo lỗi của bạn sẽ xuất hiện tại đây.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {items.map(t => {
                  const style = typeStyles[t.type] || typeStyles.SUPPORT;
                  const status = statusStyles[t.status] || statusStyles.OPEN;
                  const IconComp = style.icon;

                  return (
                    <div
                      key={t._id}
                      onClick={() => nav(`/support/tickets/${t._id}`)}
                      className="group relative cursor-pointer rounded-2xl border border-border/60 p-5 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 bg-card select-none flex gap-4 hover:scale-[1.01]"
                    >
                      <div className="flex-shrink-0">
                        <div className={`p-3 rounded-xl ${style.iconBgCls} ${style.colorCls} border border-border/30`}>
                          <IconComp className="h-5 w-5" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${style.badgeCls}`}>
                            {style.label}
                          </span>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${status.badgeCls}`}>
                            {status.label}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {new Date(t.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>

                        <h3 className="mt-2.5 font-bold text-foreground text-sm sm:text-base tracking-tight leading-snug group-hover:text-primary transition-colors flex items-center gap-2">
                          {t.title}
                          {t.unread && (
                            <span className="h-2 w-2 rounded-full bg-primary ring-4 ring-primary/10 shrink-0" />
                          )}
                        </h3>
                        <p className="mt-1 text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                          {t.lastMessageContent || t.description}
                        </p>
                      </div>

                      <div className="flex items-center text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200">
                        <CornerDownRight className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <TicketPagination
            page={listPage}
            totalPages={listTotalPages}
            total={listTotal}
            visibleCount={items.length}
            onPageChange={setListPage}
          />
        </div>
      </div>
    </div>
  );
}



