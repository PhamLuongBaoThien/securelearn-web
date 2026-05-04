import React from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAppSelector } from '@/app/hooks';

interface AdminGuestRouteProps {
  children: React.ReactNode;
}

export const AdminGuestRoute: React.FC<AdminGuestRouteProps> = ({ children }) => {
  const { isAuthenticated, authResolved } = useAppSelector((state) => state.adminAuth);

  if (!authResolved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <h2 className="text-zinc-400 font-medium">Checking Administrator Session...</h2>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
};
