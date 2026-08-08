import { useEffect, useState, useRef } from 'react';
import type { ElementType } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { inboxApi } from '@/services/inboxApi';
import { notificationApi } from '@/services/notificationApi';
import { emitNotificationReconcile } from '@/services/notificationSocket';
import { INBOX_REALTIME_EVENT, emitInboxTyping, emitInboxReconcile, isInboxConnected, retainInboxSocket, subscribeInboxTicket, type InboxRealtimeDetail } from '@/services/inboxSocket';
import type { TicketStatus, TicketType, TicketActivity, TicketMessage } from '@/types/inbox.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { toast } from 'sonner';

import { CannedReplyManager } from '@/components/inbox/CannedReplyManager';
import { TicketPagination } from '@/components/inbox/TicketPagination';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, HelpCircle, MessageSquare, Send, User, Shield, BookOpen, Play, Star, FileText, Loader2, ChevronRight, Paperclip, FileIcon, X, History, RefreshCw } from 'lucide-react';

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

const typeStyles: Record<string, { icon: ElementType; label: string; color: string; bg: string; border: string }> = {
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

const targetIcons: Record<string, ElementType> = {
    COURSE: BookOpen,
    LESSON: Play,
    REVIEW: Star,
    USER: User,
};

interface ApiError {
    response?: {
        data?: {
            message?: string;
        };
    };
}

export const Inbox = () => {
    const { user } = useAppSelector((state) => state.adminAuth);
    const queryClient = useQueryClient();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const [allMessages, setAllMessages] = useState<TicketMessage[]>([]);
    const scrollHeightRef = useRef<number>(0);
    const shouldScrollToBottomRef = useRef<boolean>(true);


    const [params, setParams] = useSearchParams();
    const [selected, setSelected] = useState(params.get('id') || '');
    const [searchDraft, setSearchDraft] = useState('');
    const [search, setSearch] = useState('');
    const [type, setType] = useState('');
    const [status, setStatus] = useState('');
    const sortVal = params.get('sort') || 'activity_desc';
    const [listPage, setListPage] = useState(1);
    const [reply, setReply] = useState('');
    const [internal, setInternal] = useState(false);
    const [messagePage, setMessagePage] = useState(1);
    const [activityPage, setActivityPage] = useState(1);
    const [files, setFiles] = useState<File[]>([]);
    const [socketConnected, setSocketConnected] = useState(isInboxConnected());
    const [typing, setTyping] = useState(false);
    const [mergedDetailSignature, setMergedDetailSignature] = useState('');

    const handleSelectTicket = (ticketId: string) => {
        if (ticketId === selected) return;
        setSelected(ticketId);
        setMessagePage(1);
        setActivityPage(1);
        setFiles([]);
        setAllMessages([]);
        shouldScrollToBottomRef.current = true;
        const nextParams = new URLSearchParams(params);
        if (ticketId) nextParams.set('id', ticketId);
        else nextParams.delete('id');
        setParams(nextParams, { replace: true });
    };

    useEffect(() => retainInboxSocket(), []);
    useEffect(() => selected ? subscribeInboxTicket(selected) : undefined, [selected]);
    useEffect(() => {
        let typingTimer: ReturnType<typeof setTimeout> | undefined;
        const handler = (event: Event) => {
            const d = (event as CustomEvent<InboxRealtimeDetail>).detail;
            if (d.type === 'status') { setSocketConnected(d.connected); if (!d.connected) setTyping(false); }
            if (['reconcile', 'ticket-new', 'ticket-updated', 'read'].includes(d.type)) { void queryClient.invalidateQueries({ queryKey: ['adminInboxList'] }); if (selected) void queryClient.invalidateQueries({ queryKey: ['adminInboxDetail', selected] }); }
            if (d.type === 'message-new') {
                void queryClient.invalidateQueries({ queryKey: ['adminInboxList'] });
                const newMsg = d.payload as TicketMessage;
                if (newMsg && newMsg.ticketId === selected) {
                    setAllMessages(prev => {
                        if (prev.some(m => m._id === newMsg._id)) return prev;
                        shouldScrollToBottomRef.current = true;
                        return [...prev, newMsg];
                    });
                    void queryClient.invalidateQueries({ queryKey: ['adminInboxDetail', selected] });
                } else if (selected) {
                    void queryClient.invalidateQueries({ queryKey: ['adminInboxDetail', selected] });
                }
            }
            if (d.type === 'typing' && d.ticketId === selected && d.identityType === 'USER') { setTyping(d.typing); clearTimeout(typingTimer); if (d.typing) typingTimer = setTimeout(() => setTyping(false), 5000); }
        };
        window.addEventListener(INBOX_REALTIME_EVENT, handler); return () => { window.removeEventListener(INBOX_REALTIME_EVENT, handler); clearTimeout(typingTimer); };
    }, [queryClient, selected]);
    useEffect(() => { if (socketConnected || document.hidden) return; const timer = setInterval(() => { void queryClient.invalidateQueries({ queryKey: ['adminInboxList'] }); if (selected) void queryClient.invalidateQueries({ queryKey: ['adminInboxDetail', selected] }); }, 15000); return () => clearInterval(timer); }, [socketConnected, selected, queryClient]);
    // Query: Danh sách ticket
    const { data: listData, isLoading: isLoadingList, isFetching: isFetchingList } = useQuery({
        queryKey: ['adminInboxList', search, type, status, sortVal, listPage],
        queryFn: () => inboxApi.list({ search, type, status, sort: sortVal, page: listPage, limit: 10 }, true),
        placeholderData: keepPreviousData,
    });

    const lastAvailableListPage = Math.max(1, listData?.totalPages || 1);
    if (listData && listPage > lastAvailableListPage) {
        setListPage(lastAvailableListPage);
    }

    const items = listData?.items || [];

    // Query: Chi tiết ticket
    const { data: detail, isLoading: isLoadingDetail, isFetching: isFetchingDetail } = useQuery({
        queryKey: ['adminInboxDetail', selected, messagePage, activityPage],
        queryFn: () => inboxApi.detail(selected, true, { messagePage, activityPage }),
        enabled: Boolean(selected),
        staleTime: 0,
        gcTime: 0,
    });

    const loadMoreMessages = () => {
        if (!detail || messagePage >= detail.messages.totalPages || isFetchingDetail) return;
        const container = chatContainerRef.current;
        if (container) {
            scrollHeightRef.current = container.scrollHeight;
        }
        shouldScrollToBottomRef.current = false;
        setMessagePage(prev => prev + 1);
    };

    const detailSignature = detail
        ? `${selected}:${messagePage}:${detail.messages.items.map((message) => message._id).join(',')}`
        : '';
    if (detail && detailSignature !== mergedDetailSignature) {
        setMergedDetailSignature(detailSignature);
        if (messagePage === 1) {
            setAllMessages(detail.messages.items);
        } else {
            setAllMessages(prev => {
                const existingIds = new Set(prev.map(m => m._id));
                const newItems = detail.messages.items.filter(m => !existingIds.has(m._id));
                return [...newItems, ...prev];
            });
        }
    }

    useEffect(() => {
        if (selected && detail) {
            void notificationApi.markReadByUrl(`/admin/notifications/inbox?id=${selected}`).then(() => {
                emitNotificationReconcile();
            });
        }
    }, [selected, detail]);

    useEffect(() => {
        if (!selected) return;
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
    }, [allMessages.length, selected]);

    useEffect(() => { if (!selected) return; void inboxApi.markRead(selected, true).then(() => { queryClient.invalidateQueries({ queryKey: ['adminInboxList'] }); emitInboxReconcile(); }); }, [selected, allMessages.length, queryClient]);
    // Mutation: Gửi tin nhắn phản hồi
    const replyMutation = useMutation({
        mutationFn: async () => {
            let attachmentIds: string[] = [];
            if (files.length) attachmentIds = (await inboxApi.upload(selected, files, true)).map(item => item._id);
            return inboxApi.message(selected, { content: reply.trim() || 'Gửi tệp đính kèm', internal, attachmentIds }, true);
        },
        onSuccess: () => {
            setReply('');
            toast.success('Đã gửi phản hồi.');
            void queryClient.invalidateQueries({ queryKey: ['adminInboxList'] });
            setMessagePage(1);
            shouldScrollToBottomRef.current = true;
            void queryClient.invalidateQueries({ queryKey: ['adminInboxDetail', selected] });
        },
        onError: (e: ApiError) => {
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
        onError: (e: ApiError) => {
            toast.error(e?.response?.data?.message || 'Không thể cập nhật trạng thái.');
        }
    });

    const send = () => {
        if (!reply.trim() && !files.length) return;
        replyMutation.mutate();
    };

    const handleStatusChange = (newStatus: TicketStatus) => {
        statusMutation.mutate(newStatus);
    };
    const messageAttachments = (ids: string[]) => detail?.attachments.filter(item => ids.includes(item._id)) || [];
    const handleFiles = (selectedFiles: FileList | null) => {
        const valid = Array.from(selectedFiles || []).filter(file => {
            if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} vượt quá 10MB.`); return false; }
            if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type)) { toast.error(`${file.name} không đúng định dạng.`); return false; }
            return true;
        }).slice(0, 5);
        setFiles(valid);
    };
    const formatActivityAction = (act: TicketActivity) => {
        const actorName = act.actor.name || 'Hệ thống';

        switch (act.action) {
            case 'CREATED':
                return `${actorName} đã tạo yêu cầu`;
            case 'REPLIED': {
                if (act.actor.type === 'ADMIN') {
                    return `${actorName} (Quản trị viên) đã phản hồi`;
                }
                const createdActivity = detail?.activities.items.find(x => x.action === 'CREATED');
                if (createdActivity) {
                    const diffMs = Math.abs(new Date(act.createdAt).getTime() - new Date(createdActivity.createdAt).getTime());
                    if (diffMs < 20000) {
                        return `${actorName} đã đính kèm tệp tin`;
                    }
                }
                return `${actorName} đã phản hồi`;
            }
            case 'INTERNAL_NOTE':
                return `${actorName} (Quản trị viên) đã thêm ghi chú nội bộ`;
            case 'STATUS_CHANGED': {
                const fromStr = label[act.fromValue || ''] || act.fromValue || 'Không rõ';
                const toStr = label[act.toValue || ''] || act.toValue || 'Không rõ';
                return `${actorName} đã cập nhật trạng thái từ [${fromStr}] sang [${toStr}]`;
            }
            default:
                return `${actorName} · ${act.action}`;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div><h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
                    Hỗ trợ & Báo cáo
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    Quản lý báo cáo vi phạm, yêu cầu hỗ trợ và góp ý từ người dùng trên toàn hệ thống.
                </p></div>
                <Button variant="outline" onClick={() => { void queryClient.invalidateQueries({ queryKey: ['adminInboxList'] }); if (selected) void queryClient.invalidateQueries({ queryKey: ['adminInboxDetail', selected] }); }} disabled={isFetchingList || isFetchingDetail} className="gap-2" title="Làm mới danh sách hỗ trợ và báo cáo"><RefreshCw className={`h-4 w-4 ${isFetchingList || isFetchingDetail ? 'animate-spin' : ''}`} /> Làm mới</Button>
            </div>

            <div className="grid min-h-[680px] gap-6 xl:grid-cols-[380px_1fr]">
                {/* Cột trái: Danh sách các ticket */}
                <section className="rounded-2xl border border-border/80 bg-card flex flex-col overflow-hidden shadow-sm">
                    <div className="space-y-3 border-b p-4 bg-muted/20">
                        <Input
                            value={searchDraft}
                            onChange={(e) => setSearchDraft(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key !== 'Enter') return;
                                setSearch(searchDraft);
                                setListPage(1);
                            }}
                            placeholder="Tìm kiếm theo tiêu đề..."
                            className="rounded-xl border-border/70 bg-card focus-visible:ring-1"
                        />
                        <div className="flex gap-2">
                            <Select value={type} onValueChange={(e) => { setType(e); setListPage(1); }}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Tất cả phân loại</SelectItem>
                                                                {(['REPORT', 'SUPPORT', 'FEEDBACK'] as TicketType[]).map((x) => (
                                                                    <SelectItem key={x} value={x}>
                                                                        {label[x]}
                                                                    </SelectItem>
                                                                ))}
                              </SelectContent>
                            </Select>

                            <Select value={status} onValueChange={(e) => { setStatus(e); setListPage(1); }}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Tất cả trạng thái</SelectItem>
                                                                {(
                                                                    ['OPEN', 'IN_PROGRESS', 'WAITING_USER', 'RESOLVED', 'CLOSED'] as TicketStatus[]
                                                                ).map((x) => (
                                                                    <SelectItem key={x} value={x}>
                                                                        {label[x]}
                                                                    </SelectItem>
                                                                ))}
                              </SelectContent>
                            </Select>
                        </div>
                        <Select
                            value={sortVal}
                            onValueChange={(event) => {
                                const nextParams = new URLSearchParams(params);
                                if (event === 'activity_desc') nextParams.delete('sort');
                                else nextParams.set('sort', event);
                                nextParams.delete('page');
                                setListPage(1);
                                setParams(nextParams, { replace: true });
                            }}
>
                          <SelectTrigger aria-label="Sắp xếp">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="activity_desc">Hoạt động gần nhất</SelectItem>
                                                        <SelectItem value="activity_asc">Hoạt động cũ nhất</SelectItem>
                                                        <SelectItem value="created_desc">Tạo mới nhất</SelectItem>
                                                        <SelectItem value="created_asc">Tạo cũ nhất</SelectItem>
                          </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center justify-between border-b px-4 py-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <History className="h-4 w-4" />
                            {listData ? `${listData.total.toLocaleString('vi-VN')} yêu cầu` : 'Đang tải dữ liệu'}
                        </div>
                        <div className="h-4 w-4">
                            {isFetchingList && !isLoadingList && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto overflow-x-hidden max-h-[580px] divide-y divide-border/40">
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
                                        onClick={() => handleSelectTicket(t._id)}
                                        whileHover={{ x: 2 }}
                                        className={`w-full p-4 text-left hover:bg-muted/30 transition-all flex items-start gap-3.5 relative ${selected === t._id ? 'bg-primary/5 dark:bg-primary/10' : ''
                                            }`}
                                    >
                                        <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${typeStyle.bg} ${typeStyle.color} border ${typeStyle.border}`}>
                                            <TypeIcon className="h-4.5 w-4.5" />
                                        </div>

                                        <div className="flex-1 min-w-0 pr-4">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className={`text-sm text-foreground truncate block ${t.unread ? 'font-bold text-primary' : 'font-semibold'}`}>
                                                    {t.title}
                                                </span>
                                                {t.unread && (
                                                    <span className="h-2 w-2 shrink-0 rounded-full bg-primary ring-4 ring-primary/10" />
                                                )}
                                            </div>

                                            <p className={`text-xs mt-1 truncate ${t.unread ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                                                {(() => {
                                                    const preview = t.lastMessageContent || t.description;
                                                    const isFromSelf = t.lastMessageSenderId === user?._id;
                                                    const prefix = isFromSelf
                                                        ? 'Bạn: '
                                                        : t.lastMessageAuthorType === 'ADMIN'
                                                            ? `${t.lastMessageSenderName || 'Admin'}: `
                                                            : `${t.sender.name}: `;
                                                    return `${prefix}${preview}`;
                                                })()}
                                            </p>

                                            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wide uppercase ${statusStyle.badge}`}>
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
                    <TicketPagination
                        page={listData?.page || listPage}
                        totalPages={listData?.totalPages || 0}
                        total={listData?.total || 0}
                        visibleCount={items.length}
                        loading={isFetchingList}
                        onPageChange={(nextPage) => {
                            setListPage(nextPage);
                            handleSelectTicket('');
                        }}
                    />
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
                                                onValueChange={(e) => handleStatusChange(e as TicketStatus)}
>
                                              <SelectTrigger>
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                {(
                                                                                                    ['OPEN', 'IN_PROGRESS', 'WAITING_USER', 'RESOLVED', 'CLOSED'] as TicketStatus[]
                                                                                                ).map((x) => (
                                                                                                    <SelectItem key={x} value={x}>
                                                                                                        {statusStyles[x].label}
                                                                                                    </SelectItem>
                                                                                                ))}
                                              </SelectContent>
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

                                {allMessages.length < detail.messages.total && (
                                    <div className="flex justify-center pb-2 border-b border-border/45 mb-2 shrink-0">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={loadMoreMessages}
                                            disabled={isFetchingDetail}
                                            className="text-xs text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-1.5 rounded-xl border border-border/50 hover:bg-muted/50 py-1.5 px-3"
                                        >
                                            {isFetchingDetail ? (
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

                                {/* Chat window */}
                                <div ref={chatContainerRef} className="max-h-[380px] min-h-[250px] space-y-4 overflow-y-auto pr-1 py-2 border-b border-border/40">
                                    <AnimatePresence initial={false}>
                                        {allMessages.map((m) => {
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
                                                                {messageAttachments(m.attachmentIds).map(attachment => <button key={attachment._id} type="button" onClick={() => void inboxApi.openAttachment(attachment._id, true)} className="mt-2 flex w-full items-center gap-2 rounded-lg border border-amber-300/50 px-2 py-1.5 text-xs"><FileIcon className="h-4 w-4" /><span className="truncate">{attachment.originalName}</span></button>)}
                                                            </p>
                                                            <span className="text-[9px] text-amber-800/60 dark:text-amber-400/60 mt-1.5 block text-right font-medium">
                                                                {new Date(m.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} · {new Date(m.createdAt).toLocaleDateString('vi-VN')}
                                                            </span>
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
                                                        <UserAvatar
                                                            user={{
                                                                fullName: m.author.name || detail.sender.name,
                                                                avatarUrl: m.author.avatarUrl || detail.sender.avatarUrl,
                                                            }}
                                                            className="h-8 w-8 text-xs"
                                                            fallbackClassName="bg-muted text-muted-foreground border"
                                                        />
                                                    )}

                                                    <div className={`max-w-[72%] space-y-1 ${isFromAdmin ? 'text-right' : ''}`}>
                                                        <div className="text-[10px] font-semibold text-muted-foreground px-1">
                                                            {isFromAdmin ? `${m.author.name} (Quản trị viên)` : m.author.name}
                                                        </div>
                                                        <div
                                                            className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm leading-relaxed whitespace-pre-wrap ${isFromAdmin
                                                                ? 'bg-primary text-primary-foreground rounded-tr-none'
                                                                : 'bg-muted text-foreground rounded-tl-none border'
                                                                }`}
                                                        >
                                                            {m.content}
                                                            {messageAttachments(m.attachmentIds).map(attachment => <button key={attachment._id} type="button" onClick={() => void inboxApi.openAttachment(attachment._id, true)} className="mt-2 flex w-full items-center gap-2 rounded-lg border border-current/20 px-2 py-1.5 text-xs"><FileIcon className="h-4 w-4" /><span className="truncate">{attachment.originalName}</span></button>)}
                                                            <span className={`text-[9px] mt-1.5 block text-right font-medium ${isFromAdmin ? 'text-primary-foreground/75' : 'text-muted-foreground/80'}`}>
                                                                {new Date(m.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} · {new Date(m.createdAt).toLocaleDateString('vi-VN')}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {isFromAdmin && (
                                                        <UserAvatar
                                                            user={{
                                                                fullName: m.author.name || user?.fullName,
                                                                avatarUrl: m.author.avatarUrl || (m.author.id === user?._id ? user?.avatarUrl : undefined),
                                                            }}
                                                            className="h-8 w-8 text-xs"
                                                            fallbackClassName="bg-primary/10 text-primary border border-primary/20"
                                                        />
                                                    )}
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>

                                    <div ref={messagesEndRef} className="h-6" /></div>
                                {(() => {
                                    const statusActivities = detail.activities.items.filter(act => act.action === 'STATUS_CHANGED');
                                    if (statusActivities.length === 0) return null;
                                    return (
                                        <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-3">
                                            <h3 className="flex items-center gap-2 text-sm font-bold">
                                                <History className="h-4 w-4" />
                                                Lịch sử xử lý
                                            </h3>
                                            <div className="space-y-2">
                                                {statusActivities.map(activity => (
                                                    <div key={activity._id} className="flex justify-between gap-3 text-xs text-muted-foreground">
                                                        <span>{formatActivityAction(activity)}</span>
                                                        <span>{new Date(activity.createdAt).toLocaleString('vi-VN')}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}
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
                                    {!internal && <CannedReplyManager ticketType={detail.type} onInsert={setReply} />}
                                    {typing && <p className="text-xs text-muted-foreground">Người dùng đang nhập…</p>}
                                    <textarea
                                        className={`min-h-24 w-full rounded-2xl border bg-transparent p-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/10 ${internal
                                            ? 'border-amber-300 dark:border-amber-900/50 focus:border-amber-500 focus:ring-amber-500/20'
                                            : 'border-border focus:border-primary'
                                            }`}
                                        value={reply}
                                        onChange={(e) => { setReply(e.target.value); if (selected && !internal) emitInboxTyping(selected, true); }}
                                        placeholder={
                                            internal
                                                ? 'Nhập ghi chú chỉ các quản trị viên nhìn thấy với nhau...'
                                                : 'Nhập nội dung phản hồi gửi trực tiếp đến người dùng...'
                                        }
                                    />
                                    {files.length > 0 && <div className="flex flex-wrap gap-2">{files.map((file, index) => <span key={`${file.name}-${index}`} className="flex items-center gap-1 rounded-lg border px-2 py-1 text-xs"><FileIcon className="h-3.5 w-3.5" />{file.name}<button onClick={() => setFiles(current => current.filter((_, i) => i !== index))}><X className="h-3.5 w-3.5" /></button></span>)}</div>}
                                    <div className="flex items-center justify-between">
                                        <label className="cursor-pointer text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><Paperclip className="h-4 w-4" />Đính kèm ({files.length}/5)<input className="hidden" type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(event) => handleFiles(event.target.files)} /></label>
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
                                            disabled={(!reply.trim() && !files.length) || replyMutation.isPending}
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







