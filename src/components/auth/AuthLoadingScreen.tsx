import brandLogo from '@/assets/logoweb.png';

interface AuthLoadingScreenProps {
  message?: string;
  variant?: 'default' | 'admin';
}

export function AuthLoadingScreen({
  message = 'Đang xác thực...',
  variant = 'default',
}: AuthLoadingScreenProps) {
  const isAdmin = variant === 'admin';

  return (
    <div
      className={`flex min-h-screen items-center justify-center px-4 ${
        isAdmin ? 'bg-[#0A0A0A]' : 'bg-background'
      }`}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="flex flex-col items-center gap-5 text-center">
        <div className="relative grid h-20 w-20 place-items-center">
          <div
            className={`absolute inset-0 rounded-full border-[3px] border-transparent border-t-primary border-r-primary/35 animate-spin motion-reduce:animate-none ${
              isAdmin ? 'border-b-white/10 border-l-white/10' : 'border-b-border border-l-border'
            }`}
            aria-hidden="true"
          />
          <div
            className={`grid h-14 w-14 place-items-center rounded-full border shadow-lg ${
              isAdmin
                ? 'border-white/10 bg-zinc-900 shadow-black/40'
                : 'border-border bg-card shadow-primary/10'
            }`}
          >
            <img
              src={brandLogo}
              alt=""
              className="h-10 w-10 object-contain"
              aria-hidden="true"
            />
          </div>
        </div>

        <p className={`text-sm font-medium ${isAdmin ? 'text-zinc-400' : 'text-muted-foreground'}`}>
          {message}
        </p>
      </div>
    </div>
  );
}
