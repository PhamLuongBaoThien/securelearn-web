// ========================
// PermissionGroupCard: Component con cho từng nhóm quyền trong module RBAC đã tách nhỏ.
// ========================
import React from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ALL_PERMISSIONS } from './rbac.constants';

interface PermissionGroupCardProps {
  resourceKey: string;
  label: string;
  icon: React.ReactNode;
  currentPerms: string[];
  isSystem: boolean;
  onSelectAll: (resource: string) => void;
  onToggle: (permissionId: string) => void;
}

export const PermissionGroupCard: React.FC<PermissionGroupCardProps> = ({
  resourceKey,
  label,
  icon,
  currentPerms,
  isSystem,
  onSelectAll,
  onToggle,
}) => {
  const permissions = ALL_PERMISSIONS.filter((permission) => permission.resource === resourceKey);
  const grantedCount = permissions.filter((permission) => currentPerms.includes(permission.id)).length;
  const allGranted = grantedCount === permissions.length;

  return (
    <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          {icon}
          {label}
        </span>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              allGranted
                ? 'bg-emerald-100 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
            }`}
          >
            {grantedCount}/{permissions.length}
          </span>
          {!isSystem && (
            <Button
              onClick={() => onSelectAll(resourceKey)}
              variant="ghost"
              className="text-xs text-primary hover:underline h-auto p-0"
            >
              {allGranted ? 'Bỏ tất cả' : 'Chọn tất cả'}
            </Button>
          )}
        </div>
      </div>
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {permissions.map((permission) => {
          const granted = currentPerms.includes(permission.id);

          return (
            <div
              key={permission.id}
              onClick={() => onToggle(permission.id)}
              className={`flex items-center gap-4 px-4 py-3 transition-colors ${
                isSystem
                  ? 'cursor-not-allowed opacity-60'
                  : 'cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                  granted ? 'bg-primary border-primary' : 'border-zinc-300 dark:border-zinc-600'
                }`}
              >
                {granted && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
              </div>
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${
                    granted ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  {permission.label}
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">{permission.desc}</p>
              </div>
              <code className="text-xs text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-lg font-mono shrink-0">
                {permission.id}
              </code>
            </div>
          );
        })}
      </div>
    </div>
  );
};
