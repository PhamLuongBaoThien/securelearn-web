import React, { useState } from 'react';
import { Bell, Mail, Smartphone, Plus, Save, X, Eye, Code } from 'lucide-react';
import { toast } from 'sonner';
import type { INotificationTemplate, TemplateEvent, NotificationType } from '@/types/admin.types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const MOCK_TEMPLATES: INotificationTemplate[] = [
  { _id: 'n1', name: 'Thanh toán thành công', event: 'PAYMENT_SUCCESS', type: 'EMAIL', subject: 'Xác nhận thanh toán - {{courseName}}', body: 'Chào {{userName}},\n\nChúng tôi xác nhận bạn đã thanh toán thành công cho khóa học "{{courseName}}" với số tiền {{amount}}.\n\nMã giao dịch: {{transactionId}}\nThời gian: {{createdAt}}\n\nChúc bạn học tập hiệu quả!\nTeam SecureLearn', variables: ['{{userName}}', '{{courseName}}', '{{amount}}', '{{transactionId}}', '{{createdAt}}'], isActive: true, createdAt: '2026-01-10T00:00:00Z', updatedAt: '2026-03-15T08:00:00Z' },
  { _id: 'n2', name: 'Khóa học được duyệt', event: 'COURSE_APPROVED', type: 'EMAIL', subject: 'Khóa học của bạn đã được phê duyệt!', body: 'Chào {{instructorName}},\n\nXin chúc mừng! Khóa học "{{courseName}}" của bạn đã được phê duyệt và xuất bản trên SecureLearn.\n\nHọc viên đã có thể đăng ký ngay bây giờ.\n\nTrân trọng,\nTeam SecureLearn', variables: ['{{instructorName}}', '{{courseName}}'], isActive: true, createdAt: '2026-01-10T00:00:00Z', updatedAt: '2026-02-01T00:00:00Z' },
  { _id: 'n3', name: 'Chào mừng người dùng mới', event: 'WELCOME', type: 'EMAIL', subject: 'Chào mừng bạn đến với SecureLearn! 🎉', body: 'Chào {{userName}},\n\nChào mừng bạn đến với SecureLearn — nền tảng học trực tuyến về bảo mật và CNTT hàng đầu Việt Nam!\n\nTài khoản của bạn đã được tạo thành công. Hãy bắt đầu hành trình học tập ngay hôm nay.\n\n👉 Khám phá khóa học: https://securelearn.vn/courses\n\nChúc bạn học tập vui vẻ!', variables: ['{{userName}}'], isActive: true, createdAt: '2026-01-10T00:00:00Z', updatedAt: '2026-01-10T00:00:00Z' },
  { _id: 'n4', name: 'Thông báo thanh toán thành công (Push)', event: 'PAYMENT_SUCCESS', type: 'PUSH', body: '✅ Đã thanh toán thành công {{amount}} cho "{{courseName}}". Bắt đầu học ngay!', variables: ['{{amount}}', '{{courseName}}'], isActive: true, createdAt: '2026-02-01T00:00:00Z', updatedAt: '2026-02-01T00:00:00Z' },
];

const inputCls = 'w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all';

const eventLabel: Record<TemplateEvent, string> = {
  PAYMENT_SUCCESS: 'Thanh toán thành công',
  PAYMENT_FAILED: 'Thanh toán thất bại',
  COURSE_APPROVED: 'Khóa học được duyệt',
  COURSE_REJECTED: 'Khóa học bị từ chối',
  WELCOME: 'Chào mừng người dùng',
  PASSWORD_RESET: 'Đặt lại mật khẩu',
};

// ===== Preview Dialog =====
interface PreviewDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  template: INotificationTemplate | null;
}

const PreviewDialog: React.FC<PreviewDialogProps> = ({ open, onOpenChange, template }) => {
  if (!template) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Preview: {template.name}</DialogTitle>
          <DialogDescription>Xem trước nội dung template trước khi lưu.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {template.subject && (
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
              <p className="text-xs font-semibold text-zinc-400 mb-1 uppercase tracking-wider">Subject</p>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{template.subject}</p>
            </div>
          )}
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
            <p className="text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">Body</p>
            <pre className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap font-sans leading-relaxed">{template.body}</pre>
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">Variables</p>
            <div className="flex flex-wrap gap-2">
              {template.variables.map((v) => (
                <code key={v} className="px-2.5 py-1 bg-primary/10 text-primary text-xs rounded-lg font-mono">{v}</code>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ===== Main Page =====
export const NotificationConfig: React.FC = () => {
  const [templates, setTemplates] = useState<INotificationTemplate[]>(MOCK_TEMPLATES);
  const [activeTab, setActiveTab] = useState<NotificationType>('EMAIL');
  const [editItem, setEditItem] = useState<INotificationTemplate | null>(null);
  const [previewItem, setPreviewItem] = useState<INotificationTemplate | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = templates.filter((t) => t.type === activeTab);

  const handleSave = async () => {
    if (!editItem) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setTemplates((p) => p.map((t) => t._id === editItem._id ? editItem : t));
    setSaving(false);
    setEditItem(null);
    toast.success('Đã lưu mẫu thông báo.');
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700 ease-in-out space-y-6">
      {/* Preview Dialog */}
      <PreviewDialog
        open={previewItem !== null}
        onOpenChange={(o) => { if (!o) setPreviewItem(null); }}
        template={previewItem}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">Cấu hình Thông báo</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Soạn thảo và quản lý mẫu email hóa đơn và thông báo đẩy cho các sự kiện hệ thống.</p>
        </div>
        <button
          id="btn-add-template"
          onClick={() => toast.info('Tính năng thêm template đang phát triển.')}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" /> Thêm Template
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-2xl w-fit">
        {(['EMAIL', 'PUSH'] as NotificationType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            id={`tab-notification-${tab.toLowerCase()}`}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab
              ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
          >
            {tab === 'EMAIL' ? <Mail className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
            {tab === 'EMAIL' ? 'Email' : 'Push'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template List */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Templates ({filtered.length})
          </h2>
          {filtered.map((t) => (
            <div
              key={t._id}
              onClick={() => setEditItem(t)}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                editItem?._id === t._id
                  ? 'border-primary/60 bg-primary/5'
                  : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900/40'
              } shadow-sm`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">{t.name}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{eventLabel[t.event]}</p>
                </div>
                <span className={`shrink-0 w-2 h-2 rounded-full mt-1 ${t.isActive ? 'bg-emerald-400' : 'bg-zinc-300'}`} />
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setPreviewItem(t); }}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-blue-500 transition-colors mt-2"
              >
                <Eye className="w-3 h-3" />Preview
              </button>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-zinc-400">
              <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Chưa có template nào.</p>
            </div>
          )}
        </div>

        {/* Editor */}
        <div className="lg:col-span-2">
          {editItem ? (
            <div className="bg-white dark:bg-zinc-900/40 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Chỉnh sửa Template</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewItem(editItem)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-zinc-500 hover:text-blue-500 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:border-blue-300 transition-all"
                  >
                    <Eye className="w-4 h-4" />Preview
                  </button>
                  <button
                    onClick={() => setEditItem(null)}
                    className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Tên Template</label>
                  <input
                    className={inputCls}
                    value={editItem.name}
                    onChange={(e) => setEditItem((p) => p ? { ...p, name: e.target.value } : p)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Sự kiện</label>
                  <select
                    className={inputCls}
                    value={editItem.event}
                    onChange={(e) => setEditItem((p) => p ? { ...p, event: e.target.value as TemplateEvent } : p)}
                  >
                    {Object.entries(eventLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>

              {editItem.type === 'EMAIL' && (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Subject Email</label>
                  <input
                    className={inputCls}
                    value={editItem.subject || ''}
                    onChange={(e) => setEditItem((p) => p ? { ...p, subject: e.target.value } : p)}
                    placeholder="Tiêu đề email..."
                  />
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nội dung</label>
                  <div className="flex items-center gap-1 text-xs text-zinc-400">
                    <Code className="w-3 h-3" />Hỗ trợ variables &#123;&#123;name&#125;&#125;
                  </div>
                </div>
                <textarea
                  className={`${inputCls} resize-none h-40 font-mono`}
                  value={editItem.body}
                  onChange={(e) => setEditItem((p) => p ? { ...p, body: e.target.value } : p)}
                  placeholder="Nội dung thông báo..."
                />
              </div>

              <div>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Variables khả dụng — click để chèn</p>
                <div className="flex flex-wrap gap-2">
                  {editItem.variables.map((v) => (
                    <code
                      key={v}
                      className="px-2.5 py-1 bg-primary/10 text-primary text-xs rounded-lg font-mono cursor-pointer hover:bg-primary/20 transition-colors"
                      onClick={() => {
                        const el = document.querySelector<HTMLTextAreaElement>('textarea');
                        if (el) {
                          const pos = el.selectionStart;
                          const newBody = editItem.body.slice(0, pos) + v + editItem.body.slice(pos);
                          setEditItem((p) => p ? { ...p, body: newBody } : p);
                        }
                      }}
                    >
                      {v}
                    </code>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  onClick={() => setEditItem(null)}
                  className="flex-1 px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors shadow-md shadow-primary/20"
                >
                  <Save className="w-4 h-4" />{saving ? 'Đang lưu...' : 'Lưu Template'}
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-80 flex flex-col items-center justify-center text-zinc-400 bg-white dark:bg-zinc-900/40 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-3xl">
              <Bell className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm">Chọn một template để chỉnh sửa</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
