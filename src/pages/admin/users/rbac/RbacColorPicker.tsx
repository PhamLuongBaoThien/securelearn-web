// ========================
// RbacColorPicker: Component chọn màu vai trò, tách riêng để tái sử dụng trong module RBAC.
// ========================
import React from 'react';
import { ROLE_COLORS } from '@/types/admin.types';
import { COLOR_DOTS } from './rbac.constants';
import { Button } from '@/components/ui/button';

interface RbacColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export const RbacColorPicker: React.FC<RbacColorPickerProps> = ({ value, onChange }) => (
  <div className="flex flex-wrap gap-2 mt-1">
    {ROLE_COLORS.map((color) => (
      <Button
        key={color}
        type="button"
        onClick={() => onChange(color)}
        className={`w-7 h-7 rounded-full ${COLOR_DOTS[color]} transition-transform hover:scale-110 ${
          value === color ? 'ring-2 ring-offset-2 ring-zinc-400 dark:ring-offset-zinc-900 scale-110' : ''
        }`}
        title={color}
      />
    ))}
  </div>
);
