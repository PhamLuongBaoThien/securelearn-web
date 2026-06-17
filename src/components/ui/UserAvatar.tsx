import { useState } from 'react';
import { User as UserIcon } from 'lucide-react';

interface UserAvatarProps {
  user: {
    fullName?: string;
    email?: string;
    avatarUrl?: string;
    profile?: {
      avatarUrl?: string;
    };
  } | null | undefined;
  className?: string; // allow overrides (e.g. w-10 h-10, w-24 h-24 etc)
  fallbackClassName?: string;
}

export function UserAvatar({ 
  user, 
  className = "w-10 h-10 text-base", 
  fallbackClassName = "bg-primary/10 text-primary border border-primary/20" 
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false); // giúp vẫn có avatar khi ảnh bị lỗi
  const avatarUrl = user?.profile?.avatarUrl || user?.avatarUrl;

  if (!user) {
    return (
      <div className={`rounded-full overflow-hidden flex items-center justify-center shrink-0 ${fallbackClassName} ${className}`}>
        <UserIcon className="w-1/2 h-1/2 opacity-50" />
      </div>
    );
  }

  // 1. If avatar exists and is not structurally broken
  if (avatarUrl && !imageError && avatarUrl.trim() !== '') {
    return (
      <img 
        src={avatarUrl} 
        alt={user.fullName || "Avatar"} 
        className={`rounded-full object-cover shrink-0 border border-primary/20 ${className}`} 
        onError={() => setImageError(true)}
        referrerPolicy="no-referrer" // giúp không gửi thông tin về google
      />
    );
  }

  // 2. Initial fallback (Lấy chữ cái đầu của tên hoặc email)
  const sourceText = (user.fullName || user.email || '?').trim();
  const initial = sourceText.charAt(0).toUpperCase();

  return (
    <div className={`rounded-full flex items-center justify-center shrink-0 font-bold shadow-sm ${fallbackClassName} ${className}`}>
      {initial}
    </div>
  );
}
