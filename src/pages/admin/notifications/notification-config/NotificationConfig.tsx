import React, { useEffect, useState } from 'react';
import { notificationApi } from '@/services/notificationApi';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';

const inputCls = 'w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all';

const eventLabel: Record<TemplateEvent, string> = {
  PAYMENT_SUCCESS: 'Thanh toán thành công',
  PAYMENT_FAILED: 'Thanh toán thất bại',
  COURSE_APPROVED: 'Khóa học được duyệt',
  COURSE_REJECTED: 'Khóa học cần chỉnh sửa',
  COURSE_SUBMITTED_FOR_REVIEW: 'Khóa học gửi duyệt',
  ENROLLMENT_CREATED: 'Học viên mới',
  WELCOME: 'Chào mừng người dùng',
  REPORT_CREATED: 'Báo cáo mới',
  SUPPORT_REQUEST_CREATED: 'Yêu cầu hỗ trợ mới',
  FEEDBACK_CREATED: 'Góp ý mới',
  INBOX_USER_REPLIED: 'Người dùng phản hồi ticket', INBOX_ADMIN_REPLIED: 'Admin phản hồi ticket',
  INBOX_STATUS_CHANGED: 'Trạng thái ticket thay đổi',
};

const eventVariables: Record<TemplateEvent, string[]> = {
  WELCOME: ['{{userName}}'],
  PAYMENT_SUCCESS: ['{{userName}}', '{{amount}}', '{{transactionId}}', '{{courseName}}', '{{createdAt}}'],
  PAYMENT_FAILED: ['{{userName}}', '{{amount}}', '{{transactionId}}', '{{reason}}', '{{createdAt}}'],
  COURSE_APPROVED: ['{{instructorName}}', '{{courseName}}', '{{courseUrl}}'],
  COURSE_REJECTED: ['{{instructorName}}', '{{courseName}}', '{{reason}}'],
  COURSE_SUBMITTED_FOR_REVIEW: ['{{courseName}}', '{{instructorName}}'],
  ENROLLMENT_CREATED: ['{{courseName}}', '{{learnerName}}'],
  REPORT_CREATED: ['{{senderName}}', '{{title}}', '{{summary}}', '{{createdAt}}'],
  SUPPORT_REQUEST_CREATED: ['{{senderName}}', '{{title}}', '{{summary}}', '{{createdAt}}'],
  FEEDBACK_CREATED: ['{{senderName}}', '{{title}}', '{{summary}}', '{{createdAt}}'],
  INBOX_USER_REPLIED: ['{{senderName}}','{{title}}','{{summary}}','{{status}}'], INBOX_ADMIN_REPLIED: ['{{senderName}}','{{title}}','{{summary}}','{{status}}'],
  INBOX_STATUS_CHANGED: ['{{senderName}}','{{title}}','{{summary}}','{{status}}'],
};

const variableDescription: Record<string, string> = {
  userName: 'Tên người dùng',
  amount: 'Số tiền thanh toán',
  transactionId: 'Mã giao dịch',
  courseName: 'Tên khóa học',
  createdAt: 'Thời gian giao dịch',
  reason: 'Lý do hoặc nội dung cần chỉnh sửa',
  instructorName: 'Tên giảng viên',
  courseUrl: 'Đường dẫn khóa học',
  learnerName: 'Tên học viên mới',
  senderName: 'Tên người gửi',
  title: 'Tiêu đề báo cáo/yêu cầu',
  summary: 'Nội dung tóm tắt',
};

const extractVariables = (text: string) =>
  Array.from(text.matchAll(/{{\s*([A-Za-z][\w]*)\s*}}/g), (match) => `{{${match[1]}}}`);

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
          <DialogTitle>Xem trước: {template.name}</DialogTitle>
          <DialogDescription>Xem trước nội dung mẫu thông báo trước khi lưu.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {template.subject && (
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
              <p className="text-xs font-semibold text-zinc-400 mb-1 uppercase tracking-wider">Tiêu đề</p>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{template.subject}</p>
            </div>
          )}
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
            <p className="text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">Nội dung</p>
            <pre className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap font-sans leading-relaxed">{template.body}</pre>
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">Các biến khả dụng</p>
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
  const [templates, setTemplates] = useState<INotificationTemplate[]>([]);
  const [activeTab, setActiveTab] = useState<NotificationType>('EMAIL');
  const [editItem, setEditItem] = useState<INotificationTemplate | null>(null);
  const [previewItem, setPreviewItem] = useState<INotificationTemplate | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = templates.filter((t) => t.type === activeTab);
  const invalidVariables = editItem
    ? [...new Set([...extractVariables(editItem.subject || ''), ...extractVariables(editItem.body)]
      .filter((variable) => !eventVariables[editItem.event].includes(variable)))]
    : [];

  useEffect(() => {
    void notificationApi.listTemplates().then((data) => setTemplates(data as INotificationTemplate[])).catch((error) => toast.error(error instanceof Error ? error.message : 'Không thể tải template.'));
  }, []);

  const handleSave = async () => {
    if (!editItem) return;
    if (invalidVariables.length > 0) {
      toast.error(`Biến không hợp lệ: ${invalidVariables.join(', ')}`);
      return;
    }
    setSaving(true);
    try {
      await notificationApi.updateTemplate(editItem._id, editItem as never);
      setTemplates((p) => p.map((t) => t._id === editItem._id ? editItem : t));
      setEditItem(null);
      toast.success('Đã lưu mẫu thông báo.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể lưu mẫu thông báo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full space-y-6">
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
          <p className="text-zinc-500 dark:text-zinc-400">Soạn thảo và quản lý mẫu email và thông báo trong ứng dụng cho các sự kiện hệ thống.</p>
        </div>
        <Button
          id="btn-add-template"
          onClick={async () => { try { const created = await notificationApi.createTemplate({ name: 'Template mới', event: 'WELCOME', type: activeTab, subject: activeTab === 'EMAIL' ? 'Tiêu đề mới' : undefined, body: 'Nội dung mới', isActive: false }); const data = (created as { data?: INotificationTemplate }).data; if (data) setTemplates((p) => [...p, data]); } catch (error) { toast.error(error instanceof Error ? error.message : 'Không thể tạo template.'); } }}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" /> Thêm Template
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-2xl w-fit">
        {(['EMAIL', 'IN_APP'] as NotificationType[]).map((tab) => (
          <Button
            key={tab}
            onClick={() => setActiveTab(tab)}
            id={`tab-notification-${tab.toLowerCase()}`}
            variant="ghost"
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab
              ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
          >
            {tab === 'EMAIL' ? <Mail className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
            {tab === 'EMAIL' ? 'Email' : 'Thông báo web'}
          </Button>
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
              <Button
                onClick={(e) => { e.stopPropagation(); setPreviewItem(t); }}
                variant="ghost"
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-blue-500 transition-colors mt-2"
              >
                <Eye className="w-3 h-3" />Xem trước
              </Button>
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
                  <Button
                    onClick={() => setPreviewItem(editItem)}
                    variant="outline"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-zinc-500 hover:text-blue-500 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:border-blue-300 transition-all"
                  >
                    <Eye className="w-4 h-4" />Xem trước
                  </Button>
                  <Button
                    onClick={() => setEditItem(null)}
                    variant="ghost"
                    size="icon"
                    className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Tên Template</label>
                  <Input
                    className={inputCls}
                    value={editItem.name}
                    onChange={(e) => setEditItem((p) => p ? { ...p, name: e.target.value } : p)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Sự kiện</label>
                  <Select
                    className={inputCls}
                    value={editItem.event}
                    onChange={(e) => setEditItem((p) => p ? { ...p, event: e.target.value as TemplateEvent } : p)}
                  >
                    {Object.entries(eventLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </Select>
                </div>
              </div>

              {editItem.type === 'EMAIL' && (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Subject Email</label>
                  <Input
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
                    <Code className="w-3 h-3" />Hỗ trợ các biến &#123;&#123;name&#125;&#125;
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
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Các biến khả dụng — nhấn để chèn</p>
                <div className="flex flex-wrap gap-2">
                  {eventVariables[editItem.event].map((v) => {
                    const name = v.slice(2, -2);
                    return (
                      <button
                        type="button"
                        key={v}
                        title={variableDescription[name]}
                        className="px-3 py-2 bg-primary/10 text-left rounded-xl cursor-pointer hover:bg-primary/20 transition-colors"
                        onClick={() => {
                          const el = document.querySelector<HTMLTextAreaElement>('textarea');
                          if (el) {
                            const start = el.selectionStart;
                            const end = el.selectionEnd;
                            const newBody = editItem.body.slice(0, start) + v + editItem.body.slice(end);
                            setEditItem((p) => p ? { ...p, body: newBody } : p);
                            requestAnimationFrame(() => {
                              el.focus();
                              el.setSelectionRange(start + v.length, start + v.length);
                            });
                          }
                        }}
                      >
                        <code className="block text-primary text-xs font-mono">{v}</code>
                        <span className="block mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">{variableDescription[name]}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  Danh sách thay đổi theo sự kiện đã chọn. Click một biến để chèn vào vị trí con trỏ trong nội dung.
                </p>
                {invalidVariables.length > 0 && (
                  <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
                    Biến không hợp lệ với sự kiện này: {invalidVariables.join(', ')}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <Button
                  onClick={() => setEditItem(null)}
                  variant="outline"
                  className="flex-1 px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || invalidVariables.length > 0}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors shadow-md shadow-primary/20"
                >
                  <Save className="w-4 h-4" />{saving ? 'Đang lưu...' : 'Lưu Template'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-80 flex flex-col items-center justify-center text-zinc-400 bg-white dark:bg-zinc-900/40 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-3xl">
              <Bell className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm">Chọn một mẫu thông báo để chỉnh sửa</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
