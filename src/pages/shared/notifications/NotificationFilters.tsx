import { CalendarDays, Check, Search, SlidersHorizontal } from 'lucide-react';
import type { NotificationCategory } from '@/types/notification.types';
import { Button } from '@/components/ui/button';
import { ADMIN_NOTIFICATION_CATEGORIES, getNotificationCategoryLabel, NOTIFICATION_CATEGORY_STYLES, USER_NOTIFICATION_CATEGORIES } from './notification.constants';

export type NotificationReadFilter = 'all' | 'unread' | 'read';

type Props = {
  isAdmin: boolean;
  filter: NotificationReadFilter;
  category: NotificationCategory | '';
  searchDraft: string;
  search: string;
  from: string;
  to: string;
  unreadCount: number;
  onFilterChange: (value: NotificationReadFilter) => void;
  onCategoryChange: (value: NotificationCategory | '') => void;
  onSearchDraftChange: (value: string) => void;
  onSearch: (value: string) => void;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onReset: () => void;
};

export function NotificationFilters(props: Props) {
  const categories = props.isAdmin ? ADMIN_NOTIFICATION_CATEGORIES : USER_NOTIFICATION_CATEGORIES;
  const hasFilters = props.filter !== 'all' || props.category !== '' || props.search || props.from || props.to;

  return (
    <div className="lg:col-span-1 space-y-6">
      <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" />Bộ lọc tìm kiếm</h3>
          {hasFilters && <button onClick={props.onReset} className="text-xs text-primary hover:underline font-medium cursor-pointer">Đặt lại</button>}
        </div>

        <form className="space-y-2" onSubmit={(event) => { event.preventDefault(); props.onSearch(props.searchDraft.trim()); }}>
          <span className="text-xs font-medium text-muted-foreground/80">Tìm kiếm nội dung</span>
          <div className="flex gap-2"><div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"/><input value={props.searchDraft} onChange={(event) => props.onSearchDraftChange(event.target.value)} className="h-9 w-full rounded-xl border bg-background pl-9 pr-3 text-xs" placeholder="Tiêu đề hoặc nội dung..."/></div><Button type="submit" size="sm">Tìm</Button></div>
        </form>

        <div className="space-y-2">
          <span className="text-xs font-medium text-muted-foreground/80">Trạng thái</span>
          <div className="grid grid-cols-3 gap-1 bg-muted p-1 rounded-xl">
            {([{ id: 'all', label: 'Tất cả' }, { id: 'unread', label: 'Chưa đọc' }, { id: 'read', label: 'Đã đọc' }] as const).map((option) => <button key={option.id} onClick={() => props.onFilterChange(option.id)} className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${props.filter === option.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>{option.label}{option.id === 'unread' && props.unreadCount > 0 && <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-primary"/>}</button>)}
          </div>
        </div>

        <div className="space-y-2"><span className="flex items-center gap-1 text-xs font-medium text-muted-foreground/80"><CalendarDays className="h-3.5 w-3.5"/>Thời gian tạo</span><label className="block text-[11px] text-muted-foreground">Từ ngày<input type="date" value={props.from} max={props.to || undefined} onChange={(event) => props.onFromChange(event.target.value)} className="mt-1 h-9 w-full rounded-xl border bg-background px-2 text-xs"/></label><label className="block text-[11px] text-muted-foreground">Đến ngày<input type="date" value={props.to} min={props.from || undefined} onChange={(event) => props.onToChange(event.target.value)} className="mt-1 h-9 w-full rounded-xl border bg-background px-2 text-xs"/></label></div>

        <div className="space-y-2.5">
          <span className="text-xs font-medium text-muted-foreground/80">Danh mục</span>
          <div className="flex flex-col gap-1.5">
            {categories.map((category) => {
              const style = NOTIFICATION_CATEGORY_STYLES[category];
              const Icon = style.icon;
              const selected = props.category === category;
              return <button key={category} onClick={() => props.onCategoryChange(selected ? '' : category)} className={`flex items-center justify-between w-full p-2.5 rounded-xl text-left text-xs font-medium transition-all duration-200 border cursor-pointer ${selected ? `${style.badgeClass} border-transparent shadow-sm scale-[1.02]` : 'border-transparent text-foreground hover:bg-muted/80'}`}><div className="flex items-center gap-2"><div className={`p-1.5 rounded-lg ${style.iconBgClass} ${style.colorClass}`}><Icon className="h-3.5 w-3.5"/></div>{getNotificationCategoryLabel(category, props.isAdmin)}</div>{selected && <Check className="h-3.5 w-3.5 stroke-[3px]"/>}</button>;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
