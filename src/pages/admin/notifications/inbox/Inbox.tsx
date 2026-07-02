import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { inboxApi } from '@/services/inboxApi';
import type { TicketStatus, TicketType } from '@/types/inbox.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  HelpCircle,
  MessageSquare,
  Send,
  User,
  Shield,
  BookOpen,
  Play,
  Star,
  FileText,
  Loader2,
  ChevronRight
} from 'lucide-react';

const label: Record<string, string> = {
  REPORT: 'Báo cáo',
  SUPPORT: 'Hỗ trợ',
  FEEDBACK: 'Góp ý',
  OPEN: 'Mới',
  IN_PROGRESS: 'Đang xử lý',
  WAITING_USER: 'Chờ người dùng',
  RESOLVED: 'Đã giải quyết',
  CLOSED: 'Đã đóng',
  COURSE: 'Khóa học',
  LESSON: 'Bài học',
  REVIEW: 'Đánh giá',
  USER: 'Người dùng',
};

const typeStyles: Record<string, { icon: any; label: string; color: string; bg: string; border: string }> = {
  REPORT: { icon: AlertTriangle, label: 'Báo cáo', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/20', border: 'border-rose-200 dark:border-rose-900/50' },
  SUPPORT: { icon: HelpCircle, label: 'Hỗ trợ', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/20', border: 'border-blue-200 dark:border-blue-900/50' },
  FEEDBACK: { icon: MessageSquare, label: 'Góp ý', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-200 dark:border-emerald-900/50' },
};

const statusStyles: Record<string, { label: string; badge: string }> = {
  OPEN: { label: 'Mới', badge: 'bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400 border border-orange-200 dark:border-orange-900' },
  IN_PROGRESS: { label: 'Đang xử lý', badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200 dark:border-blue-900' },
  WAITING_USER: { label: 'Chờ người dùng', badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-200 dark:border-rose-900' },
  RESOLVED: { label: 'Đã giải quyết', badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900' },
  CLOSED: { label: 'Đã đóng', badge: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700' },
};

const targetIcons: Record<string, any> = {
  COURSE: BookOpen,
  LESSON: Play,
  REVIEW: Star,
  USER: User,
};

export const Inbox = () => {
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [selected, setSelected] = useState(params.get('id') || '');
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [reply, setReply] = useState('');
  const [internal, setInternal] = useState(false);

  // Đồng bộ ID được chọn lên URL search params
  useEffect(() => {
    if (selected) {
      setParams({ id: selected });
    } else {
      params.delete('id');
      setParams(params);
    }
  }, [selected]);

  // Query: Danh sách ticket
  const { data: listData, isLoading: isLoadingList } = useQuery({
    queryKey: ['adminInboxList', search, type, status],
    queryFn: () => inboxApi.list({ search, type, status }, true),
    placeholderData: keepPreviousData,
  });

  const items = listData?.items || [];

  // Query: Chi tiết ticket
  const { data: detail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['adminInboxDetail', selected],
    queryFn: () => inboxApi.detail(selected, true),
    enabled: Boolean(selected),
  });

  // Mutation: Gửi tin nhắn phản hồi
  const replyMutation = useMutation({
    mutationFn: async () => {
      return inboxApi.message(selected, { content: reply, internal }, true);
    },
    onSuccess: () => {
      setReply('');
      toast.success('Đã gửi phản hồi.');
      void queryClient.invalidateQueries({ queryKey: ['adminInboxList'] });
      void queryClient.invalidateQueries({ queryKey: ['adminInboxDetail', selected] });
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message || 'Không thể gửi phản hồi.');
    }
  });

  // Mutation: Thay đổi trạng thái
  const statusMutation = useMutation({
    mutationFn: async (newStatus: TicketStatus) => {
      return inboxApi.status(selected, newStatus);
    },
    onSuccess: () => {
      toast.success('Đã cập nhật trạng thái.');
      void queryClient.invalidateQueries({ queryKey: ['adminInboxList'] });
      void queryClient.invalidateQueries({ queryKey: ['adminInboxDetail', selected] });
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message || 'Không thể cập nhật trạng thái.');
    }
  });

  const send = () => {
    if (!reply.trim()) return;
    replyMutation.mutate();
  };

  const handleStatusChange = (newStatus: TicketStatus) => {
    statusMutation.mutate(newStatus);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
          Hỗ trợ & Báo cáo
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Quản lý báo cáo vi phạm, yêu cầu hỗ trợ và góp ý từ người dùng trên toàn hệ thống.
        </p>
      </div>

      <div className="grid min-h-[680px] gap-6 xl:grid-cols-[380px_1fr]">
        {/* Cột trái: Danh sách các ticket */}
        <section className="rounded-2xl border border-border/80 bg-card flex flex-col overflow-hidden shadow-sm">
          <div className="space-y-3 border-b p-4 bg-muted/20">
            <Input
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setSearch(searchDraft)}
              placeholder="Tìm kiếm theo tiêu đề..."
              className="rounded-xl border-border/70 bg-card focus-visible:ring-1"
            />
            <div className="flex gap-2">
              <Select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="">Tất cả phân loại</option>
                {(['REPORT', 'SUPPORT', 'FEEDBACK'] as TicketType[]).map((x) => (
                  <option key={x} value={x}>
                    {label[x]}
                  </option>
                ))}
              </Select>

              <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">Tất cả trạng thái</option>
                {(
                  ['OPEN', 'IN_PROGRESS', 'WAITING_USER', 'RESOLVED', 'CLOSED'] as TicketStatus[]
                ).map((x) => (
                  <option key={x} value={x}>
                    {label[x]}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[580px] divide-y divide-border/40">
            {isLoadingList ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-xs">Đang tải danh sách...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">
                Không tìm thấy yêu cầu nào phù hợp.
              </div>
            ) : (
              items.map((t) => {
                const typeStyle = typeStyles[t.type] || typeStyles.SUPPORT;
                const statusStyle = statusStyles[t.status] || statusStyles.OPEN;
                const TypeIcon = typeStyle.icon;
                return (
                  <motion.button
                    key={t._id}
                    onClick={() => setSelected(t._id)}
                    whileHover={{ x: 2 }}
                    className={`w-full p-4 text-left hover:bg-muted/30 transition-all flex items-start gap-3.5 relative ${
                      selected === t._id ? 'bg-primary/5 dark:bg-primary/10' : ''
                    }`}
                  >
                    <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${typeStyle.bg} ${typeStyle.color} border ${typeStyle.border}`}>
                      <TypeIcon className="h-4.5 w-4.5" />
                    </div>
                    
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-sm text-foreground truncate block ${t.adminUnread ? 'font-bold text-primary' : 'font-medium'}`}>
                          {t.title}
                        </span>
                        {t.adminUnread && (
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary ring-4 ring-primary/10" />
                        )}
                      </div>
                      
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase ${statusStyle.badge}`}>
                          {statusStyle.label}
                        </span>
                        <span>·</span>
                        <span className="truncate max-w-[120px] font-medium">{t.sender.name}</span>
                      </div>
                    </div>
                    
                    {selected === t._id && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-primary">
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    )}
                  </motion.button>
                );
              })
            )}
          </div>
        </section>

        {/* Cột phải: Chi tiết và Phản hồi yêu cầu */}
        <section className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm min-h-[400px] flex flex-col justify-between overflow-hidden">
          {isLoadingDetail ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3 py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm">Đang tải chi tiết yêu cầu...</p>
            </div>
          ) : detail ? (
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-5">
                {/* Header detail */}
                <div className="flex flex-wrap justify-between items-start gap-4 pb-4 border-b border-border/60">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${typeStyles[detail.type].bg} ${typeStyles[detail.type].color} border ${typeStyles[detail.type].border}`}>
                        {typeStyles[detail.type].label}
                      </span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground font-medium">Người gửi: {detail.sender.name}</span>
                    </div>
                    <h2 className="text-xl font-bold text-foreground leading-snug mt-1 break-words">{detail.title}</h2>
                    <p className="text-xs text-muted-foreground">{detail.sender.email}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-medium text-muted-foreground">Trạng thái:</span>
                    <div className="w-40">
                      <Select
                        value={detail.status}
                        onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                      >
                        {(
                          ['OPEN', 'IN_PROGRESS', 'WAITING_USER', 'RESOLVED', 'CLOSED'] as TicketStatus[]
                        ).map((x) => (
                          <option key={x} value={x}>
                            {statusStyles[x].label}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Target object */}
                {detail.target && (
                  <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/30 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      {(() => {
                        const Icon = targetIcons[detail.target.type] || FileText;
                        return <Icon className="h-5 w-5" />;
                      })()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Đối tượng bị báo cáo: {label[detail.target.type] || detail.target.type}
                      </div>
                      <div className="text-sm font-semibold text-foreground truncate mt-0.5">
                        {detail.target.title}
                      </div>
                    </div>
                  </div>
                )}

                {/* Chat window */}
                <div className="max-h-[380px] min-h-[250px] space-y-4 overflow-y-auto pr-1 py-2 border-b border-border/40">
                  <AnimatePresence initial={false}>
                    {detail.messages.map((m) => {
                      const isInternal = m.internal;
                      const isFromAdmin = m.author.type === 'ADMIN';
                      
                      if (isInternal) {
                        return (
                          <motion.div
                            key={m._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex justify-center my-3"
                          >
                            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs dark:border-amber-900/30 dark:bg-amber-950/20 max-w-[85%] shadow-sm">
                              <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-450">
                                <Shield className="h-3.5 w-3.5" />
                                Ghi chú nội bộ · {m.author.name}
                              </div>
                              <p className="mt-1 text-amber-900/90 dark:text-amber-300/90 whitespace-pre-wrap leading-relaxed">
                                {m.content}
                              </p>
                            </div>
                          </motion.div>
                        );
                      }

                      return (
                        <motion.div
                          key={m._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex items-start gap-3 ${isFromAdmin ? 'justify-end' : 'justify-start'}`}
                        >
                          {!isFromAdmin && (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground border">
                              <User className="h-4.5 w-4.5" />
                            </div>
                          )}
                          
                          <div className={`max-w-[72%] space-y-1 ${isFromAdmin ? 'text-right' : ''}`}>
                            <div className="text-[10px] font-semibold text-muted-foreground px-1">
                              {isFromAdmin ? `${m.author.name} (Quản trị viên)` : m.author.name}
                            </div>
                            <div
                              className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm leading-relaxed whitespace-pre-wrap ${
                                isFromAdmin
                                  ? 'bg-primary text-primary-foreground rounded-tr-none'
                                  : 'bg-muted text-foreground rounded-tl-none border'
                              }`}
                            >
                              {m.content}
                            </div>
                          </div>

                          {isFromAdmin && (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20">
                              <Shield className="h-4.5 w-4.5" />
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>

              {/* Input section */}
              {detail.status !== 'CLOSED' && (
                <div className={`space-y-3 pt-4 transition-all duration-300 ${internal ? 'rounded-2xl bg-amber-50/20 dark:bg-amber-950/5 p-3 border border-dashed border-amber-300/40' : ''}`}>
                  {internal && (
                    <div className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Shield className="h-3.5 w-3.5 animate-pulse" />
                      Chế độ Ghi chú nội bộ (Người dùng không nhìn thấy)
                    </div>
                  )}
                  <textarea
                    className={`min-h-24 w-full rounded-2xl border bg-transparent p-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/10 ${
                      internal 
                        ? 'border-amber-300 dark:border-amber-900/50 focus:border-amber-500 focus:ring-amber-500/20' 
                        : 'border-border focus:border-primary'
                    }`}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder={
                      internal
                        ? 'Nhập ghi chú chỉ các quản trị viên nhìn thấy với nhau...'
                        : 'Nhập nội dung phản hồi gửi trực tiếp đến người dùng...'
                    }
                  />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={internal}
                        onChange={(e) => setInternal(e.target.checked)}
                        className="rounded border-border text-amber-500 focus:ring-amber-500 h-4.5 w-4.5"
                      />{' '}
                      Ghi chú nội bộ
                    </label>
                    <Button 
                      disabled={!reply.trim() || replyMutation.isPending} 
                      onClick={send}
                      variant={internal ? "secondary" : "default"}
                      className="rounded-xl px-5 flex items-center gap-2"
                    >
                      {replyMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      {replyMutation.isPending ? 'Đang gửi...' : 'Gửi phản hồi'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Chọn một yêu cầu từ danh sách bên trái để xem chi tiết và phản hồi.
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
