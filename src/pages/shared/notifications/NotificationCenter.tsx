import { useEffect, useState, useMemo } from 'react';
import { Bell, CheckCircle2, Clock, Settings, Inbox, Loader2, ChevronRight, Mail, Smartphone } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { notificationApi } from '@/services/notificationApi';
import { NOTIFICATION_REALTIME_EVENT, type NotificationRealtimeDetail } from '@/services/notificationSocket';
import type { NotificationCapabilities, NotificationCategory, NotificationItem, NotificationPreferences } from '@/types/notification.types';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { NotificationFilters, type NotificationReadFilter } from './NotificationFilters';
import {
  NOTIFICATION_CATEGORY_LABELS as labels,
  NOTIFICATION_CATEGORY_STYLES as categoryStyles,
  NOTIFICATION_EVENT_LABELS as eventLabels,
  USER_NOTIFICATION_CATEGORIES as categories,
} from './notification.constants';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

function getVisiblePages(currentPage: number, totalPages: number): Array<number | 'ellipsis-start' | 'ellipsis-end'> {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
  const sortedPages = Array.from(pages)
    .filter((pageNumber) => pageNumber >= 1 && pageNumber <= totalPages)
    .sort((a, b) => a - b);

  const items: Array<number | 'ellipsis-start' | 'ellipsis-end'> = [];
  sortedPages.forEach((pageNumber, index) => {
    const previous = sortedPages[index - 1];
    if (previous && pageNumber - previous > 1) {
      items.push(previous === 1 ? 'ellipsis-start' : 'ellipsis-end');
    }
    items.push(pageNumber);
  });

  return items;
}

export function NotificationCenter() {
  const navigate = useNavigate();
  const isAdmin = useLocation().pathname.startsWith('/admin');
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<NotificationReadFilter>('all');
  const [category, setCategory] = useState<NotificationCategory | ''>('');
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const { count: unreadCount, setCount: setUnreadCount } = useUnreadNotifications(true);

  const [activeTab, setActiveTab] = useState<'inbox' | 'preferences'>('inbox');
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [savedPreferences, setSavedPreferences] = useState<NotificationPreferences | null>(null);
  const [capabilities, setCapabilities] = useState<NotificationCapabilities | null>(null);
  const [loadingPrefs, setLoadingPrefs] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const preferencesDirty = Boolean(preferences && savedPreferences && JSON.stringify(preferences.categories) !== JSON.stringify(savedPreferences.categories));

  const visiblePages = useMemo(() => getVisiblePages(page, totalPages), [page, totalPages]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await notificationApi.list({
        page,
        limit: 10,
        ...(filter === 'unread' ? { read: false } : {}),
        ...(filter === 'read' ? { read: true } : {}),
        ...(category ? { category } : {}),
        ...(search ? { search } : {}),
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
      });
      setItems(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải danh sách thông báo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [filter, category, search, from, to, page]);
  useEffect(() => { setPage(1); }, [filter, category, search, from, to]);
  useEffect(() => {
    const handleRealtime = (event: Event) => {
      const detail = (event as CustomEvent<NotificationRealtimeDetail>).detail;
      if (activeTab === 'inbox' && ['new', 'read', 'read-all', 'reconcile'].includes(detail.type)) void load();
    };
    window.addEventListener(NOTIFICATION_REALTIME_EVENT, handleRealtime);
    return () => window.removeEventListener(NOTIFICATION_REALTIME_EVENT, handleRealtime);
  }, [activeTab, filter, category, search, from, to, page]);
  const loadPreferences = async () => {
    setLoadingPrefs(true);
    try {
      const [data, channelCapabilities] = await Promise.all([notificationApi.getPreferences(), notificationApi.getCapabilities()]);
      setPreferences(data);
      setSavedPreferences(JSON.parse(JSON.stringify(data)));
      setCapabilities(channelCapabilities);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải cài đặt thông báo');
    } finally {
      setLoadingPrefs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'preferences' && !preferences) {
      void loadPreferences();
    }
  }, [activeTab]);

  const markRead = async (item: NotificationItem) => {
    if (!item.readAt) {
      try {
        await notificationApi.markRead(item._id);
        const readAt = new Date().toISOString();
        const updatedItem = { ...item, readAt };
        if (filter === 'unread') {
          setItems(current => current.filter(notification => notification._id !== item._id));
          setTotal(current => Math.max(0, current - 1));
        } else {
          setItems(current => current.map(notification => notification._id === item._id ? updatedItem : notification));
        }
        window.dispatchEvent(new CustomEvent<NotificationRealtimeDetail>(NOTIFICATION_REALTIME_EVENT, {
          detail: { type: 'read', item: updatedItem },
        }));
        window.dispatchEvent(new CustomEvent<NotificationRealtimeDetail>(NOTIFICATION_REALTIME_EVENT, {
          detail: { type: 'unread-delta', delta: -1 },
        }));
      } catch (err) {
        console.error(err);
      }
    }
    if (item.actionUrl) {
      navigate(item.actionUrl);
    }
  };

  const markAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      const readAt = new Date().toISOString();
      if (filter === 'unread') { setItems([]); setTotal(0); setTotalPages(0); }
      else setItems(current => current.map(notification => ({ ...notification, readAt: notification.readAt || readAt })));
      setUnreadCount(0);
      window.dispatchEvent(new CustomEvent<NotificationRealtimeDetail>(NOTIFICATION_REALTIME_EVENT, {
        detail: { type: 'read-all', readAt },
      }));
      window.dispatchEvent(new CustomEvent<NotificationRealtimeDetail>(NOTIFICATION_REALTIME_EVENT, {
        detail: { type: 'unread-count', count: 0 },
      }));
      toast.success('Đã đánh dấu đọc tất cả thông báo');
    } catch (err) {
      console.error(err);
      toast.error('Thao tác thất bại');
    }
  };

  const saveSettings = async () => {
    if (!preferences) return;
    setSavingPrefs(true);
    try {
      const updated = await notificationApi.updatePreferences(preferences.categories);
      setPreferences(updated);
      setSavedPreferences(JSON.parse(JSON.stringify(updated)));
      toast.success('Cập nhật cài đặt thông báo thành công');
    } catch (err) {
      console.error(err);
      toast.error('Không thể cập nhật cài đặt');
    } finally {
      setSavingPrefs(false);
    }
  };

  const renderInbox = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        <NotificationFilters
          isAdmin={isAdmin}
          filter={filter}
          category={category}
          searchDraft={searchDraft}
          search={search}
          from={from}
          to={to}
          unreadCount={unreadCount}
          onFilterChange={(value) => { setFilter(value); setPage(1); }}
          onCategoryChange={(value) => { setCategory(value); setPage(1); }}
          onSearchDraftChange={setSearchDraft}
          onSearch={(value) => { setSearch(value); setPage(1); }}
          onFromChange={(value) => { setFrom(value); setPage(1); }}
          onToChange={(value) => { setTo(value); setPage(1); }}
          onReset={() => { setFilter('all'); setCategory(''); setSearchDraft(''); setSearch(''); setFrom(''); setTo(''); setPage(1); }}
        />
        {/* Danh sách thông báo */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="popLayout">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm">Đang tải các thông báo...</p>
              </div>
            ) : items.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl border border-dashed border-border/85 py-20 text-center text-muted-foreground flex flex-col items-center justify-center gap-4 bg-card/40"
              >
                <div className="p-4 rounded-full bg-muted">
                  <Bell className="h-10 w-10 opacity-40 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground mb-1">Không có thông báo</h3>
                  <p className="text-sm px-6">Không tìm thấy thông báo nào phù hợp với bộ lọc hiện tại.</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                layout
                className="space-y-4"
              >
                {items.map(item => {
                  const style = categoryStyles[item.category];
                  const IconComp = style.icon;
                  const isUnread = !item.readAt;

                  return (
                    <motion.article
                      key={item._id}
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => void markRead(item)}
                      className={`relative cursor-pointer rounded-2xl border p-5 shadow-sm hover:shadow-md hover:border-primary/25 transition-all duration-300 bg-card select-none flex gap-4 ${style.borderClass} border-l-4 ${isUnread ? 'bg-gradient-to-r from-card to-primary/5 dark:to-primary/5 border-primary/20' : 'border-border/60 opacity-85'
                        }`}
                    >
                      {/* Left Category Icon */}
                      <div className="flex-shrink-0">
                        <div className={`p-3 rounded-xl ${style.iconBgClass} ${style.colorClass} border border-border/30`}>
                          <IconComp className="h-5 w-5" />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${style.badgeClass}`}>
                            {labels[item.category]}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {new Date(item.createdAt).toLocaleString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                        <h3 className={`mt-2 font-bold text-foreground text-sm sm:text-base tracking-tight leading-snug ${isUnread ? 'text-primary' : ''}`}>
                          {item.title}
                        </h3>
                        <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed break-words">
                          {item.body}
                        </p>

                        {item.actionLabel && (
                          <div className="mt-3.5 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors group">
                            {item.actionLabel}
                            <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                          </div>
                        )}
                      </div>

                      {/* Unread indicator */}
                      {isUnread && (
                        <div className="absolute right-5 top-5">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                          </span>
                        </div>
                      )}
                    </motion.article>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
          {totalPages > 1 && (
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
              <span className="text-xs text-muted-foreground self-center sm:self-auto">
                Hiển thị {items.length} / {total} thông báo · Trang {page}/{totalPages}
              </span>
              <Pagination className="mx-0 w-auto justify-center sm:justify-end">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      text="Trước"
                      aria-disabled={page <= 1 || loading}
                      className={page <= 1 || loading ? 'pointer-events-none opacity-50 text-xs rounded-xl' : 'text-xs rounded-xl cursor-pointer'}
                      onClick={(event) => {
                        event.preventDefault();
                        if (page > 1 && !loading) setPage(page - 1);
                      }}
                    />
                  </PaginationItem>
                  {visiblePages.map((item, idx) => (
                    <PaginationItem key={idx}>
                      {typeof item === 'number' ? (
                        <PaginationLink
                          href="#"
                          isActive={item === page}
                          className="text-xs rounded-xl cursor-pointer"
                          onClick={(event) => {
                            event.preventDefault();
                            if (!loading) setPage(item);
                          }}
                        >
                          {item}
                        </PaginationLink>
                      ) : (
                        <PaginationEllipsis className="h-9 w-9 text-muted-foreground" />
                      )}
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      text="Sau"
                      aria-disabled={page >= totalPages || loading}
                      className={page >= totalPages || loading ? 'pointer-events-none opacity-50 text-xs rounded-xl' : 'text-xs rounded-xl cursor-pointer'}
                      onClick={(event) => {
                        event.preventDefault();
                        if (page < totalPages && !loading) setPage(page + 1);
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPreferences = () => {
    if (loadingPrefs) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm">Đang tải cài đặt thông báo...</p>
        </div>
      );
    }

    if (!preferences) {
      return (
        <div className="text-center py-10 text-muted-foreground">
          <p>Không thể tải cấu hình cài đặt. Vui lòng thử lại sau.</p>
          <Button variant="outline" className="mt-4" onClick={() => void loadPreferences()}>
            Thử lại
          </Button>
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-lg text-foreground">Cấu hình nhận thông báo</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Chọn cách bạn muốn nhận cập nhật từ SecureLearn. Một số thông báo giao dịch quan trọng (như Thanh toán và Đăng ký khóa học) luôn được bật mặc định trên website để đảm bảo thông tin thông suốt.
            </p>
          </div>
          <div className={`rounded-xl border px-3 py-2 text-xs ${preferencesDirty ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300' : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300'}`}>{preferencesDirty ? 'Bạn có thay đổi chưa lưu.' : 'Cài đặt hiện tại đã được lưu.'}</div>

          <div className="divide-y divide-border/60 space-y-4 pt-2">
            {categories.map(c => {
              const style = categoryStyles[c];
              const IconComp = style.icon;
              const isPaymentOrCourse = c === 'PAYMENT' || c === 'COURSE';
              const capability = capabilities?.[c];
              const emailUnavailable = capability ? !capability.emailAvailable : false;

              return (
                <div key={c} className="pt-4 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl mt-0.5 ${style.iconBgClass} ${style.colorClass} border border-border/25`}>
                      <IconComp className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm sm:text-base text-foreground">{labels[c]}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {c === 'SYSTEM' && 'Các thông báo bảo trì, bảo mật, và tài khoản.'}
                        {c === 'PAYMENT' && 'Lịch sử giao dịch, hóa đơn và đăng ký thuê bao.'}
                        {c === 'COURSE' && 'Cập nhật tài liệu học tập, bài giảng mới từ giảng viên.'}
                        {c === 'LEARNING' && 'Nhắc nhở học tập, hoàn thành bài tập, và tiến độ.'}
                        {c === 'CAMPAIGN' && 'Các chương trình khuyến mãi, tin tức, khảo sát.'}
                      </p>
                      {capability && capability.missingEmailEvents.length > 0 && <p className="mt-1.5 text-[11px] text-amber-600 dark:text-amber-400">Email chưa áp dụng cho: {capability.missingEmailEvents.map(event => eventLabels[event] || event).join(', ')}. Quản trị viên cần bật template Email tương ứng.</p>}
                    </div>
                  </div>

                  {/* Switch Controls */}
                  <div className="flex items-center gap-6 self-end sm:self-center bg-muted/40 p-2.5 rounded-xl border border-border/40">
                    {/* Email Switch */}
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-semibold text-muted-foreground mr-1">Email</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          disabled={emailUnavailable}
                          checked={emailUnavailable ? false : preferences.categories[c].email}
                          onChange={e => {
                            setPreferences({
                              ...preferences,
                              categories: {
                                ...preferences.categories,
                                [c]: {
                                  ...preferences.categories[c],
                                  email: e.target.checked
                                }
                              }
                            });
                          }}
                        />
                        <div className={`w-10 h-5 bg-zinc-200 dark:bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-zinc-600 peer-checked:bg-primary ${emailUnavailable ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                      </label>
                    </div>

                    {/* In-app Switch */}
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-semibold text-muted-foreground mr-1">Thông báo web</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          disabled={isPaymentOrCourse}
                          checked={preferences.categories[c].inApp}
                          onChange={e => {
                            setPreferences({
                              ...preferences,
                              categories: {
                                ...preferences.categories,
                                [c]: {
                                  ...preferences.categories[c],
                                  inApp: e.target.checked
                                }
                              }
                            });
                          }}
                        />
                        <div className={`w-10 h-5 bg-zinc-200 dark:bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-zinc-600 peer-checked:bg-primary ${isPaymentOrCourse ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                      </label>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Nút lưu cài đặt */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            className="rounded-xl h-10 px-5 border-border/80 cursor-pointer"
            disabled={savingPrefs || !preferencesDirty}
            onClick={() => savedPreferences && setPreferences(JSON.parse(JSON.stringify(savedPreferences)))}
          >
            Hủy thay đổi
          </Button>
          <Button
            className="rounded-xl h-10 px-6 font-semibold cursor-pointer"
            disabled={savingPrefs || !preferencesDirty}
            onClick={() => void saveSettings()}
          >
            {savingPrefs ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              'Lưu cài đặt'
            )}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      {/* Header phẳng, hiện đại */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <Bell className="h-8 w-8 text-primary animate-pulse" />
            {isAdmin ? 'Lịch sử thông báo' : 'Trung tâm thông báo'}
          </h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            {isAdmin
              ? 'Xem lịch sử các thông báo và chiến dịch đã được gửi đi của ứng dụng SecureLearn.'
              : 'Nhận các cập nhật quan trọng về học tập, giao dịch thanh toán và khóa học của bạn.'}
          </p>
        </div>

        {/* Nút hành động nhanh */}
        <div className="flex items-center gap-2.5 self-start md:self-center">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => void markAllRead()}
              className="h-9 rounded-xl border-border/80 hover:bg-muted text-foreground transition-all duration-300 cursor-pointer"
            >
              <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" />
              Đã đọc tất cả
            </Button>
          )}
        </div>
      </div>

      <hr className="border-border/60 mb-8" />

      {/* Tabs */}
      {!isAdmin ? (
        <div className="space-y-6">
          <div className="flex border-b border-border/60">
            <button
              onClick={() => setActiveTab('inbox')}
              className={`pb-4 px-6 text-sm font-semibold border-b-2 transition-all duration-300 flex items-center gap-2 cursor-pointer ${activeTab === 'inbox'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
            >
              <Inbox className="h-4 w-4" />
              Danh sách thông báo
              {unreadCount > 0 && (
                <span className="ml-1.5 px-2 py-0.5 text-xs font-bold rounded-full bg-primary text-primary-foreground">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={`pb-4 px-6 text-sm font-semibold border-b-2 transition-all duration-300 flex items-center gap-2 cursor-pointer ${activeTab === 'preferences'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
            >
              <Settings className="h-4 w-4" />
              Cài đặt nhận tin
            </button>
          </div>

          <div className="pt-2">
            {activeTab === 'inbox' ? renderInbox() : renderPreferences()}
          </div>
        </div>
      ) : (
        renderInbox()
      )}
    </div>
  );
}