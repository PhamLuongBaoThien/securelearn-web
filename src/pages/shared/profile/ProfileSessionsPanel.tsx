import {
  BadgeCheck,
  Clock3,
  Laptop,
  Loader2,
  LogOut,
  MonitorSmartphone,
  RefreshCw,
  ShieldAlert,
  Smartphone,
  Tablet,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useActiveSessions, useRevokeOtherSessions, useRevokeSession } from '@/hooks/useAuthSessions';
import type { AccountSession } from '@/types/auth.types';

const absoluteDate = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

const relativeDate = (value: string, current: boolean) => {
  if (current) return 'Đang hoạt động';
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat('vi-VN', { numeric: 'auto' });
  if (Math.abs(seconds) < 60) return formatter.format(seconds, 'second');
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) return formatter.format(minutes, 'minute');
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return formatter.format(hours, 'hour');
  return formatter.format(Math.round(hours / 24), 'day');
};

const DeviceIcon = ({ session }: { session: AccountSession }) => {
  if (session.current) return <MonitorSmartphone size={22} />;
  if (session.deviceType === 'mobile') return <Smartphone size={22} />;
  if (session.deviceType === 'tablet') return <Tablet size={22} />;
  return <Laptop size={22} />;
};

const SessionsSkeleton = () => (
  <div className="space-y-3" aria-label="Đang tải các phiên đăng nhập">
    {[0, 1].map((item) => (
      <div key={item} className="animate-pulse rounded-xl border border-border p-4">
        <div className="flex gap-4">
          <div className="h-12 w-12 rounded-xl bg-muted" />
          <div className="flex-1 space-y-3 py-1">
            <div className="h-4 w-48 rounded bg-muted" />
            <div className="h-3 w-64 max-w-full rounded bg-muted" />
            <div className="h-3 w-4/5 rounded bg-muted" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export function ProfileSessionsPanel() {
  const sessionsQuery = useActiveSessions();
  const revokeSession = useRevokeSession();
  const revokeOthers = useRevokeOtherSessions();
  const sessions = sessionsQuery.data ?? [];
  const otherSessionCount = sessions.filter((session) => !session.current).length;

  const handleRevoke = async (sessionId: string) => {
    try {
      await revokeSession.mutateAsync(sessionId);
      toast.success('Đã đăng xuất thiết bị.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể đăng xuất thiết bị.');
    }
  };

  const handleRevokeOthers = async () => {
    try {
      const count = await revokeOthers.mutateAsync();
      toast.success(count > 0 ? `Đã đăng xuất ${count} phiên khác.` : 'Không có phiên nào khác đang hoạt động.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể đăng xuất các thiết bị khác.');
    }
  };

  return (
    <section aria-busy={sessionsQuery.isLoading} aria-live="polite" className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Phiên đăng nhập</h2>
          <p className="mt-1 text-sm text-muted-foreground">Theo dõi và bảo vệ những thiết bị đang truy cập tài khoản của bạn.</p>
        </div>
        <ConfirmDialog
          title="Đăng xuất khỏi tất cả thiết bị khác?"
          description="Các thiết bị khác sẽ mất quyền truy cập ngay và phải đăng nhập lại. Phiên trên thiết bị này vẫn được giữ nguyên."
          confirmText="Đăng xuất tất cả"
          isDestructive
          onConfirm={() => void handleRevokeOthers()}
          triggerButton={
            <Button variant="outline" disabled={otherSessionCount === 0 || revokeOthers.isPending}>
              {revokeOthers.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
              Đăng xuất thiết bị khác
            </Button>
          }
        />
      </div>

      {sessionsQuery.isLoading && <SessionsSkeleton />}

      {sessionsQuery.isError && (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm text-destructive">{sessionsQuery.error.message || 'Không thể tải các phiên đăng nhập.'}</p>
          <Button variant="outline" className="mt-4" onClick={() => void sessionsQuery.refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Thử lại
          </Button>
        </div>
      )}

      {!sessionsQuery.isLoading && !sessionsQuery.isError && sessions.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Không có phiên đăng nhập đang hoạt động.
        </div>
      )}

      {!sessionsQuery.isLoading && !sessionsQuery.isError && sessions.length > 0 && (
        <div className="space-y-3">
          {sessions.map((session) => {
            const isRevoking = revokeSession.isPending && revokeSession.variables === session.id;
            return (
              <article key={session.id} className="rounded-xl border border-border p-4 transition-colors hover:bg-muted/30">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="w-fit rounded-xl bg-primary/10 p-3 text-primary"><DeviceIcon session={session} /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{session.deviceName || 'Thiết bị không xác định'}</h3>
                      {session.current && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          <BadgeCheck size={14} /> Thiết bị này
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {session.browser || 'Không xác định'} · {session.operatingSystem || 'Không xác định'}
                    </p>
                    <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
                      <span>Địa chỉ IP: {session.ipAddress || 'Không xác định'}</span>
                      <span className="flex items-center gap-2"><Clock3 size={14} />{relativeDate(session.lastActiveAt, session.current)}</span>
                      <span>Đăng nhập: {absoluteDate(session.signedInAt)}</span>
                      <span>Hết hạn: {absoluteDate(session.expiresAt)}</span>
                    </div>
                  </div>
                  {!session.current && (
                    <ConfirmDialog
                      title="Đăng xuất thiết bị này?"
                      description={`Phiên “${session.deviceName}” sẽ mất quyền truy cập ngay và phải đăng nhập lại.`}
                      confirmText="Đăng xuất"
                      isDestructive
                      onConfirm={() => void handleRevoke(session.id)}
                      triggerButton={
                        <Button variant="outline" size="sm" disabled={isRevoking} className="self-start text-destructive hover:text-destructive">
                          {isRevoking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
                          Đăng xuất
                        </Button>
                      }
                    />
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="mt-6 flex gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div>
          <p className="font-semibold text-foreground">Không nhận ra thiết bị nào?</p>
          <p className="mt-1 text-muted-foreground">
            Hãy đăng xuất thiết bị đó và <Link to="/account/settings/security" className="font-medium text-primary hover:underline">đổi mật khẩu</Link> để bảo vệ tài khoản.
          </p>
        </div>
      </div>
    </section>
  );
}