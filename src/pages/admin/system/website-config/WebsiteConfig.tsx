import React, { useState } from 'react';
import { Globe, Save, Mail, Phone, MapPin, Search, Image as ImageIcon, Facebook, Youtube } from 'lucide-react';
import { toast } from 'sonner';
import type { IWebsiteConfig } from '@/types/admin.types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const MOCK_CONFIG: IWebsiteConfig = {
  siteName: 'SecureLearn',
  siteUrl: 'https://securelearn.vn',
  logoUrl: 'https://securelearn.vn/logo.png',
  faviconUrl: 'https://securelearn.vn/favicon.ico',
  contactEmail: 'admin@securelearn.vn',
  contactPhone: '0901234567',
  address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
  seoTitle: 'SecureLearn - Học Bảo Mật & CNTT Trực Tuyến',
  seoDescription: 'Nền tảng học trực tuyến hàng đầu về bảo mật thông tin, lập trình và CNTT với nội dung chất lượng cao và bảo vệ bản quyền.',
  seoKeywords: 'học lập trình, bảo mật thông tin, CNTT, khóa học online',
  facebookUrl: 'https://facebook.com/securelearn',
  youtubeUrl: 'https://youtube.com/@securelearn',
};

const FormField: React.FC<{ label: string; icon?: React.ReactNode; children: React.ReactNode; hint?: string }> = ({ label, icon, children, hint }) => (
  <div>
    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
      <span className="flex items-center gap-2">{icon}<span>{label}</span></span>
    </label>
    {children}
    {hint && <p className="mt-1 text-xs text-zinc-400">{hint}</p>}
  </div>
);

const inputCls = 'w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all';

const SectionCard: React.FC<{ title: string; description?: string; children: React.ReactNode }> = ({ title, description, children }) => (
      <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
    <div className="mb-5">
      <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{title}</h2>
      {description && <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{description}</p>}
    </div>
    {children}
  </div>
);

export const WebsiteConfig: React.FC = () => {
  const [config, setConfig] = useState<IWebsiteConfig>(MOCK_CONFIG);
  const [saving, setSaving] = useState(false);

  const handleChange = (key: keyof IWebsiteConfig, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
    toast.success('Đã lưu cấu hình website thành công!');
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">Cấu hình Website</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Quản lý thông tin chung, thương hiệu và SEO của nền tảng.</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          id="btn-save-website-config"
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-all shadow-lg shadow-primary/20"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Thông tin cơ bản */}
        <SectionCard title="Thông tin thương hiệu" description="Tên, logo và URL chính của nền tảng.">
          <div className="space-y-4">
            <FormField label="Tên website" icon={<Globe className="w-4 h-4 text-zinc-400" />}>
              <Input className={inputCls} value={config.siteName} onChange={(e) => handleChange('siteName', e.target.value)} />
            </FormField>
            <FormField label="URL website" icon={<Globe className="w-4 h-4 text-zinc-400" />}>
              <Input className={inputCls} value={config.siteUrl} onChange={(e) => handleChange('siteUrl', e.target.value)} />
            </FormField>
            <FormField label="URL Logo" icon={<ImageIcon className="w-4 h-4 text-zinc-400" />} hint="PNG/SVG, khuyến nghị 200×60px">
              <Input className={inputCls} value={config.logoUrl} onChange={(e) => handleChange('logoUrl', e.target.value)} />
            </FormField>
            <FormField label="URL Favicon" icon={<ImageIcon className="w-4 h-4 text-zinc-400" />} hint="ICO/PNG, 32×32px">
              <Input className={inputCls} value={config.faviconUrl} onChange={(e) => handleChange('faviconUrl', e.target.value)} />
            </FormField>
          </div>
        </SectionCard>

        {/* Thông tin liên hệ */}
        <SectionCard title="Thông tin liên hệ" description="Email, số điện thoại và địa chỉ hiển thị trên website.">
          <div className="space-y-4">
            <FormField label="Email liên hệ" icon={<Mail className="w-4 h-4 text-zinc-400" />}>
              <Input type="email" className={inputCls} value={config.contactEmail} onChange={(e) => handleChange('contactEmail', e.target.value)} />
            </FormField>
            <FormField label="Số điện thoại" icon={<Phone className="w-4 h-4 text-zinc-400" />}>
              <Input className={inputCls} value={config.contactPhone} onChange={(e) => handleChange('contactPhone', e.target.value)} />
            </FormField>
            <FormField label="Địa chỉ" icon={<MapPin className="w-4 h-4 text-zinc-400" />}>
              <textarea className={`${inputCls} resize-none h-24`} value={config.address} onChange={(e) => handleChange('address', e.target.value)} />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Facebook" icon={<Facebook className="w-4 h-4 text-zinc-400" />}>
                <Input className={inputCls} value={config.facebookUrl || ''} onChange={(e) => handleChange('facebookUrl', e.target.value)} />
              </FormField>
              <FormField label="YouTube" icon={<Youtube className="w-4 h-4 text-zinc-400" />}>
                <Input className={inputCls} value={config.youtubeUrl || ''} onChange={(e) => handleChange('youtubeUrl', e.target.value)} />
              </FormField>
            </div>
          </div>
        </SectionCard>

        {/* SEO */}
        <div className="lg:col-span-2">
          <SectionCard title="Cài đặt SEO" description="Tối ưu hóa công cụ tìm kiếm — tác động trực tiếp đến thứ hạng tìm kiếm.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="SEO Title" icon={<Search className="w-4 h-4 text-zinc-400" />} hint="Khuyến nghị 50-60 ký tự">
                <Input className={inputCls} value={config.seoTitle} onChange={(e) => handleChange('seoTitle', e.target.value)} />
                <div className="flex justify-end mt-1">
                  <span className={`text-xs ${config.seoTitle.length > 60 ? 'text-red-400' : 'text-zinc-400'}`}>{config.seoTitle.length}/60</span>
                </div>
              </FormField>
              <FormField label="Keywords" icon={<Search className="w-4 h-4 text-zinc-400" />} hint="Phân cách bằng dấu phẩy">
                <Input className={inputCls} value={config.seoKeywords} onChange={(e) => handleChange('seoKeywords', e.target.value)} />
              </FormField>
              <div className="md:col-span-2">
                <FormField label="Meta Description" icon={<Search className="w-4 h-4 text-zinc-400" />} hint="Khuyến nghị 150-160 ký tự">
                  <textarea
                    className={`${inputCls} resize-none h-24`}
                    value={config.seoDescription}
                    onChange={(e) => handleChange('seoDescription', e.target.value)}
                  />
                  <div className="flex justify-end mt-1">
                    <span className={`text-xs ${config.seoDescription.length > 160 ? 'text-red-400' : 'text-zinc-400'}`}>
                      {config.seoDescription.length}/160
                    </span>
                  </div>
                </FormField>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};
