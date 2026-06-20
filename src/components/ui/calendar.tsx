import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const getCalendarDays = (month: Date) => {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const firstWeekday = (firstDay.getDay() + 6) % 7;
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - firstWeekday);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
};

export interface CalendarProps {
  className?: string;
  disabled?: (date: Date) => boolean;
  onSelect?: (date: Date) => void;
  selected?: Date;
}

export function Calendar({ className, disabled, onSelect, selected }: CalendarProps) {
  const [month, setMonth] = React.useState(() => selected || new Date());
  const days = React.useMemo(() => getCalendarDays(month), [month]);
  const today = startOfDay(new Date());

  React.useEffect(() => {
    if (selected) setMonth(selected);
  }, [selected]);

  const moveMonth = (offset: number) => {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  return (
    <div className={cn('w-full rounded-lg bg-white text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50', className)}>
      <div className="mb-4 flex items-center justify-between">
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveMonth(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm font-bold">
          Tháng {month.getMonth() + 1}, {month.getFullYear()}
        </div>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveMonth(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-zinc-500 dark:text-zinc-400">
        {WEEKDAYS.map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((date) => {
          const isOutside = date.getMonth() !== month.getMonth();
          const isSelected = selected ? sameDay(date, selected) : false;
          const isToday = sameDay(date, today);
          const isDisabled = disabled?.(date) || false;

          return (
            <button
              key={date.toISOString()}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelect?.(date)}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-md text-sm transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:hover:bg-zinc-800',
                isOutside && 'text-zinc-300 dark:text-zinc-700',
                isToday && !isSelected && 'border border-zinc-300 dark:border-zinc-700',
                isSelected && 'bg-primary font-bold text-primary-foreground hover:bg-primary',
                isDisabled && 'pointer-events-none opacity-40',
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
