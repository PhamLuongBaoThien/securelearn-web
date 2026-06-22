// [THƯ VIỆN BẢO VỆ NỘI DUNG - BƯỚC 2 & 5]
// File này cung cấp các tiện ích bảo vệ bản quyền nội dung trên Frontend của SecureLearn:
// 1. Quản lý cấu hình Watermark động (xoay vòng vị trí, format chuỗi email/userId của học viên).
// 2. Chặn các phím tắt nhạy cảm trên trình duyệt (F12 Inspect, Ctrl+C sao chép, Ctrl+S lưu file, Ctrl+P in tài liệu).
// 3. Tự động loại bỏ chặn phím khi học viên đang nhập liệu trong các thẻ input/textarea/contenteditable.

import type { KeyboardEvent as ReactKeyboardEvent } from 'react';


export type WatermarkIdentity = {
  email?: string;
  userId?: string;
  sessionId?: string;
};

export const WATERMARK_ROTATION_MS = 12_000;

export const watermarkPositions = [
  'bottom-12 right-4',
  'top-12 left-4',
  'top-1/2 right-8 -translate-y-1/2',
  'bottom-20 left-8',
] as const;

export const shortId = (value?: string) =>
  (value || '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 6)
    .padEnd(6, '0');

export const formatWatermarkText = (identity?: WatermarkIdentity, now = new Date()) => {
  if (!identity?.email && !identity?.userId && !identity?.sessionId) return '';
  const time = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const email = identity.email || 'securelearn';
  return `${email} · U: ${shortId(identity.userId)} · S: ${shortId(identity.sessionId)} · ${time}`;
};

export const isBlockedProtectionKey = (event: KeyboardEvent | ReactKeyboardEvent) => {
  const key = event.key.toLowerCase();
  const withModifier = event.ctrlKey || event.metaKey;
  return (
    key === 'f12' ||
    (withModifier && ['c', 'p', 's'].includes(key)) ||
    (event.ctrlKey && event.shiftKey && ['i', 'j', 'c'].includes(key))
  );
};

export const shouldIgnoreProtectionShortcut = () => {
  const element = document.activeElement;
  if (!element) return false;
  const tagName = element.tagName.toLowerCase();
  return tagName === 'input' || tagName === 'textarea' || element.getAttribute('contenteditable') === 'true';
};
