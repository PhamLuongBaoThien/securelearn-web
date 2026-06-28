import { BadgeCheck, Clock3, Laptop, MapPin, MonitorSmartphone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AccountSession {
  id: string;
  device: string;
  browser: string;
  operatingSystem: string;
  location: string;
  ipAddress: string;
  signedInAt: string;
  lastActiveAt: string;
  current: boolean;
}

const mockSessions: AccountSession[] = [
  { id: 'current', device: 'Windows PC', browser: 'Chrome 126', operatingSystem: 'Windows 11', location: 'Hồ Chí Minh, Việt Nam', ipAddress: '113.161.xxx.xxx', signedInAt: 'Hôm nay, 08:42', lastActiveAt: 'Đang hoạt động', current: true },
  { id: 'mobile', device: 'iPhone 15', browser: 'Safari Mobile', operatingSystem: 'iOS 18', location: 'Hồ Chí Minh, Việt Nam', ipAddress: '171.244.xxx.xxx', signedInAt: '24/06/2026, 21:15', lastActiveAt: '3 ngày trước', current: false },
  { id: 'laptop', device: 'MacBook Air', browser: 'Chrome 125', operatingSystem: 'macOS', location: 'Bangkok, Thái Lan', ipAddress: '184.22.xxx.xxx', signedInAt: '12/06/2026, 10:08', lastActiveAt: '2 tuần trước', current: false },
];

export function ProfileSessionsPanel() {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="text-xl font-bold">Phiên đăng nhập</h2><p className="mt-1 text-sm text-muted-foreground">Theo dõi những thiết bị đã truy cập tài khoản của bạn.</p></div>
        <Badge variant="secondary">Dữ liệu minh họa</Badge>
      </div>
      <div className="space-y-3">
        {mockSessions.map((session) => (
          <article key={session.id} className="rounded-xl border border-border p-4">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-primary/10 p-3 text-primary">{session.current ? <MonitorSmartphone size={22}/> : <Laptop size={22}/>}</div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{session.device}</h3>{session.current && <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600"><BadgeCheck size={14}/>Phiên hiện tại</span>}</div>
                <p className="mt-1 text-sm text-muted-foreground">{session.browser} · {session.operatingSystem}</p>
                <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                  <span className="flex items-center gap-2"><MapPin size={14}/>{session.location} · {session.ipAddress}</span>
                  <span className="flex items-center gap-2"><Clock3 size={14}/>{session.lastActiveAt}</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Đăng nhập: {session.signedInAt}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
      <p className="mt-5 text-xs text-muted-foreground">Chức năng đăng xuất thiết bị từ xa sẽ được bổ sung khi backend quản lý phiên đăng nhập hoàn thiện.</p>
    </section>
  );
}