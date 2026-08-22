// Trang/giao diện: Triển khai trang cấu hình thông tin website (route: /admin/system/config).
/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Facebook, Github, Globe, Image as ImageIcon, Loader2, Mail, MapPin, Phone, RefreshCw, Save, Upload, Youtube, Linkedin } from 'lucide-react';
import { toast } from 'sonner';
import type { IWebsiteConfig, WebsiteConfigInput } from '@/types/admin.types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAdminWebsiteConfig, useUpdateWebsiteConfig, WEBSITE_CONFIG_FALLBACK } from '@/hooks/useWebsiteConfig';

const inputCls = 'w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all';
const errorInputCls = 'border-red-300 focus:border-red-500 focus:ring-red-500/30 dark:border-red-800';

type FormState = Omit<IWebsiteConfig, '_id' | 'createdAt' | 'updatedAt' | 'logoPublicId' | 'faviconPublicId'>;
type FormErrors = Partial<Record<keyof FormState | 'logo' | 'favicon', string>>;

const toForm = (config?: IWebsiteConfig): FormState => ({
  siteUrl: config?.siteUrl || WEBSITE_CONFIG_FALLBACK.siteUrl,
  logoUrl: config?.logoUrl || '',
  faviconUrl: config?.faviconUrl || WEBSITE_CONFIG_FALLBACK.faviconUrl,
  contactEmail: config?.contactEmail || WEBSITE_CONFIG_FALLBACK.contactEmail,
  contactPhone: config?.contactPhone || WEBSITE_CONFIG_FALLBACK.contactPhone,
  address: config?.address || '',
  facebookUrl: config?.facebookUrl || '',
  youtubeUrl: config?.youtubeUrl || '',
  githubUrl: config?.githubUrl || '',
  linkedinUrl: config?.linkedinUrl || '',
});

const isHttpsUrl = (value: string) => {
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
};
const isSafeAssetUrl = (value: string) => !value || value.startsWith('/') || isHttpsUrl(value);
const showError = (error: unknown) => toast.error(error instanceof Error ? error.message : 'Không thể lưu cấu hình website.');

const SectionCard: React.FC<{ title: string; description?: string; children: React.ReactNode }> = ({ title, description, children }) => (
  <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
    <div className="mb-5">
      <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{title}</h2>
      {description && <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>}
    </div>
    {children}
  </section>
);

const FormField: React.FC<{ label: string; htmlFor?: string; icon?: React.ReactNode; error?: string; hint?: string; children: React.ReactNode }> = ({ label, htmlFor, icon, error, hint, children }) => (
  <div>
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
      <span className="flex items-center gap-2">{icon}<span>{label}</span></span>
    </label>
    {children}
    {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : hint ? <p className="mt-1 text-xs text-zinc-400">{hint}</p> : null}
  </div>
);

const AssetField: React.FC<{
  id: string;
  label: string;
  value: string;
  preview: string;
  error?: string;
  hint: string;
  accept: string;
  onUrlChange: (value: string) => void;
  onFileChange: (file?: File) => void;
}> = ({ id, label, value, preview, error, hint, accept, onUrlChange, onFileChange }) => (
  <FormField label={label} htmlFor={`${id}-url`} icon={<ImageIcon className="h-4 w-4 text-zinc-400" />} error={error} hint={hint}>
    <div className="grid gap-3 sm:grid-cols-[140px,1fr]">
      <div className="flex h-24 items-center justify-center overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900">
        {preview ? <img src={preview} alt={`${label} preview`} className="max-h-full max-w-full object-contain" /> : <ImageIcon className="h-8 w-8 text-zinc-300" />}
      </div>
      <div className="space-y-2">
        <Input id={`${id}-url`} className={`${inputCls} ${error ? errorInputCls : ''}`} placeholder="https://..." value={value} onChange={(event) => onUrlChange(event.target.value)} />
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-zinc-300 px-3 py-2 text-sm text-zinc-600 transition-colors hover:border-primary hover:text-primary dark:border-zinc-700 dark:text-zinc-300">
          <Upload className="h-4 w-4" /> Tải ảnh lên
          <input type="file" accept={accept} className="sr-only" onChange={(event) => onFileChange(event.target.files?.[0])} />
        </label>
      </div>
    </div>
  </FormField>
);

export const WebsiteConfig: React.FC = () => {
  const query = useAdminWebsiteConfig();
  const update = useUpdateWebsiteConfig();
  const [form, setForm] = useState<FormState>(() => toForm());
  const [errors, setErrors] = useState<FormErrors>({});
  const [logoFile, setLogoFile] = useState<File | undefined>();
  const [faviconFile, setFaviconFile] = useState<File | undefined>();
  const [logoPreview, setLogoPreview] = useState('');
  const [faviconPreview, setFaviconPreview] = useState('');
  const objectUrls = useRef<string[]>([]);

  useEffect(() => {
    if (!query.data) return;
    const next = toForm(query.data);
    setForm(next);
    setLogoPreview(next.logoUrl);
    setFaviconPreview(next.faviconUrl);
    setLogoFile(undefined);
    setFaviconFile(undefined);
  }, [query.data]);

  useEffect(() => () => objectUrls.current.forEach((url) => URL.revokeObjectURL(url)), []);

  const hasChanges = useMemo(() => {
    const current = toForm(query.data);
    return logoFile || faviconFile || JSON.stringify(current) !== JSON.stringify(form);
  }, [faviconFile, form, logoFile, query.data]);

  const handleChange = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const selectAsset = (type: 'logo' | 'favicon', file?: File) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    objectUrls.current.push(url);
    if (type === 'logo') {
      setLogoFile(file);
      setLogoPreview(url);
      setErrors((prev) => ({ ...prev, logo: undefined, logoUrl: undefined }));
    } else {
      setFaviconFile(file);
      setFaviconPreview(url);
      setErrors((prev) => ({ ...prev, favicon: undefined, faviconUrl: undefined }));
    }
  };

  const validate = () => {
    const next: FormErrors = {};
    if (!form.siteUrl.trim() || !isHttpsUrl(form.siteUrl.trim())) next.siteUrl = 'URL website phải là HTTPS hợp lệ.';
    if (!form.contactEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail.trim())) next.contactEmail = 'Email liên hệ không hợp lệ.';
    if (form.contactPhone.trim().length > 30) next.contactPhone = 'Số điện thoại tối đa 30 ký tự.';
    if (form.address.trim().length > 300) next.address = 'Địa chỉ tối đa 300 ký tự.';
    if (!logoFile && !isSafeAssetUrl(form.logoUrl.trim())) next.logoUrl = 'URL logo phải là HTTPS hoặc đường dẫn nội bộ.';
    if (!faviconFile && !isSafeAssetUrl(form.faviconUrl.trim())) next.faviconUrl = 'URL favicon phải là HTTPS hoặc đường dẫn nội bộ.';
    if (form.facebookUrl && !isHttpsUrl(form.facebookUrl.trim())) next.facebookUrl = 'Facebook URL phải là HTTPS.';
    if (form.youtubeUrl && !isHttpsUrl(form.youtubeUrl.trim())) next.youtubeUrl = 'YouTube URL phải là HTTPS.';
    if (form.githubUrl && !isHttpsUrl(form.githubUrl.trim())) next.githubUrl = 'GitHub URL phải là HTTPS.';
    if (form.linkedinUrl && !isHttpsUrl(form.linkedinUrl.trim())) next.linkedinUrl = 'LinkedIn URL phải là HTTPS.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    const payload: WebsiteConfigInput = { ...form, logo: logoFile, favicon: faviconFile };
    try {
      await update.mutateAsync(payload);
      toast.success('Đã lưu cấu hình website thành công!');
    } catch (error) { showError(error); }
  };

  if (query.isLoading) return <div className="flex min-h-72 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /><span className="ml-3 text-sm text-zinc-500">Đang tải cấu hình website...</span></div>;
  if (query.isError) return <div className="rounded-3xl border border-red-200 bg-red-50 p-10 text-center text-red-700 dark:border-red-900 dark:bg-red-950/30"><AlertCircle className="mx-auto mb-3 h-8 w-8" /><h2 className="font-semibold">Không thể tải cấu hình website</h2><Button variant="outline" className="mt-4" onClick={() => query.refetch()}><RefreshCw className="mr-2 h-4 w-4" />Thử lại</Button></div>;

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="mb-1 text-3xl font-bold text-zinc-900 dark:text-white">Cấu hình Website</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Quản lý thương hiệu công khai và thông tin liên hệ của nền tảng.</p>
        </div>
        <Button onClick={handleSave} disabled={update.isPending || !hasChanges} id="btn-save-website-config" className="flex items-center gap-2 rounded-xl px-5 py-2.5 shadow-lg shadow-primary/20">
          {update.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {update.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title="Thông tin thương hiệu" description="Tên website cố định là SecureLearn; admin chỉ cấu hình URL và ảnh thương hiệu công khai.">
          <div className="space-y-4">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Tên website</p>
              <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">SecureLearn</p>
            </div>
            <FormField label="URL website" htmlFor="site-url" icon={<Globe className="h-4 w-4 text-zinc-400" />} error={errors.siteUrl}>
              <Input id="site-url" className={`${inputCls} ${errors.siteUrl ? errorInputCls : ''}`} value={form.siteUrl} onChange={(event) => handleChange('siteUrl', event.target.value)} />
            </FormField>
            <AssetField id="logo" label="Logo" value={form.logoUrl} preview={logoPreview} error={errors.logoUrl || errors.logo} hint="Upload JPG/PNG/WebP/SVG/ICO tối đa 2MB hoặc dán URL HTTPS." accept="image/*,.ico,.svg" onUrlChange={(value) => { handleChange('logoUrl', value); setLogoPreview(value); setLogoFile(undefined); }} onFileChange={(file) => selectAsset('logo', file)} />
            <AssetField id="favicon" label="Favicon" value={form.faviconUrl} preview={faviconPreview} error={errors.faviconUrl || errors.favicon} hint="Khuyến nghị ảnh vuông 32×32 hoặc 64×64." accept="image/*,.ico,.svg" onUrlChange={(value) => { handleChange('faviconUrl', value); setFaviconPreview(value); setFaviconFile(undefined); }} onFileChange={(file) => selectAsset('favicon', file)} />
          </div>
        </SectionCard>

        <SectionCard title="Thông tin liên hệ" description="Hiển thị ở footer và các khu vực public của website.">
          <div className="space-y-4">
            <FormField label="Email liên hệ" htmlFor="contact-email" icon={<Mail className="h-4 w-4 text-zinc-400" />} error={errors.contactEmail}>
              <Input id="contact-email" type="email" className={`${inputCls} ${errors.contactEmail ? errorInputCls : ''}`} value={form.contactEmail} onChange={(event) => handleChange('contactEmail', event.target.value)} />
            </FormField>
            <FormField label="Số điện thoại" htmlFor="contact-phone" icon={<Phone className="h-4 w-4 text-zinc-400" />} error={errors.contactPhone}>
              <Input id="contact-phone" className={`${inputCls} ${errors.contactPhone ? errorInputCls : ''}`} value={form.contactPhone} onChange={(event) => handleChange('contactPhone', event.target.value)} />
            </FormField>
            <FormField label="Địa chỉ" htmlFor="address" icon={<MapPin className="h-4 w-4 text-zinc-400" />} error={errors.address}>
              <textarea id="address" className={`${inputCls} h-24 resize-none ${errors.address ? errorInputCls : ''}`} value={form.address} onChange={(event) => handleChange('address', event.target.value)} />
            </FormField>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField label="Facebook" htmlFor="facebook" icon={<Facebook className="h-4 w-4 text-zinc-400" />} error={errors.facebookUrl}>
                <Input id="facebook" className={`${inputCls} ${errors.facebookUrl ? errorInputCls : ''}`} placeholder="https://facebook.com/..." value={form.facebookUrl || ''} onChange={(event) => handleChange('facebookUrl', event.target.value)} />
              </FormField>
              <FormField label="YouTube" htmlFor="youtube" icon={<Youtube className="h-4 w-4 text-zinc-400" />} error={errors.youtubeUrl}>
                <Input id="youtube" className={`${inputCls} ${errors.youtubeUrl ? errorInputCls : ''}`} placeholder="https://youtube.com/..." value={form.youtubeUrl || ''} onChange={(event) => handleChange('youtubeUrl', event.target.value)} />
              </FormField>
              <FormField label="GitHub" htmlFor="github" icon={<Github className="h-4 w-4 text-zinc-400" />} error={errors.githubUrl}>
                <Input id="github" className={`${inputCls} ${errors.githubUrl ? errorInputCls : ''}`} placeholder="https://github.com/..." value={form.githubUrl || ''} onChange={(event) => handleChange('githubUrl', event.target.value)} />
              </FormField>
              <FormField label="LinkedIn" htmlFor="linkedin" icon={<Linkedin className="h-4 w-4 text-zinc-400" />} error={errors.linkedinUrl}>
                <Input id="linkedin" className={`${inputCls} ${errors.linkedinUrl ? errorInputCls : ''}`} placeholder="https://linkedin.com/..." value={form.linkedinUrl || ''} onChange={(event) => handleChange('linkedinUrl', event.target.value)} />
              </FormField>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
};
