import React, { useState } from 'react';
import { Droplets, Monitor, Lock, Save, Info } from 'lucide-react';
import { toast } from 'sonner';
import type { ISecurityConfig } from '@/types/admin.types';

const DEFAULT_CONFIG: ISecurityConfig = {
  dynamicWatermark: { enabled: true, opacity: 0.15, position: 'bottom-right', showUserId: true, showTimestamp: false },
  viewerShield: { enabled: true, blockScreenCapture: false, blockDevTools: true, blockRightClick: true },
  hlsConfig: { segmentDuration: 6, playlistType: 'VOD' },
};

const ToggleSwitch: React.FC<{ checked: boolean; onChange: (v: boolean) => void; id: string }> = ({ checked, onChange, id }) => (
  <button
    id={id}
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 ${checked ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-600'}`}
  >
    <span className={`pointer-events-none inline-block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-0.5'} mt-0.5`} />
  </button>
);

const SectionCard: React.FC<{ title: string; icon: React.ReactNode; description?: string; children: React.ReactNode }> = ({ title, icon, description, children }) => (
  <div className="bg-white dark:bg-zinc-900/40 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center gap-3 mb-5">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">{icon}</div>
      <div>
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{title}</h2>
        {description && <p className="text-sm text-zinc-500 mt-0.5">{description}</p>}
      </div>
    </div>
    {children}
  </div>
);

const SettingRow: React.FC<{ label: string; description?: string; children: React.ReactNode }> = ({ label, description, children }) => (
  <div className="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
    <div className="flex-1 mr-4">
      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{label}</p>
      {description && <p className="text-xs text-zinc-400 mt-0.5">{description}</p>}
    </div>
    {children}
  </div>
);

export const SecurityConfig: React.FC = () => {
  const [config, setConfig] = useState<ISecurityConfig>(DEFAULT_CONFIG);
  const [saving, setSaving] = useState(false);

  const setWatermark = (key: keyof ISecurityConfig['dynamicWatermark'], value: any) =>
    setConfig((p) => ({ ...p, dynamicWatermark: { ...p.dynamicWatermark, [key]: value } }));
  const setViewer = (key: keyof ISecurityConfig['viewerShield'], value: any) =>
    setConfig((p) => ({ ...p, viewerShield: { ...p.viewerShield, [key]: value } }));
  const setHls = (key: keyof ISecurityConfig['hlsConfig'], value: any) =>
    setConfig((p) => ({ ...p, hlsConfig: { ...p.hlsConfig, [key]: value } }));

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
    toast.success('Cấu hình bảo vệ đã được lưu và áp dụng!');
  };

  const inputCls = 'px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all text-zinc-900 dark:text-zinc-100';

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700 ease-in-out space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">Cấu hình Bảo vệ Nội dung</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Thiết lập Dynamic Watermarking, Viewer Shield và cấu hình HLS để bảo vệ bản quyền.</p>
        </div>
        <button onClick={handleSave} disabled={saving} id="btn-save-security" className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-all shadow-lg shadow-primary/20">
          <Save className="w-4 h-4" />{saving ? 'Đang lưu...' : 'Áp dụng cấu hình'}
        </button>
      </div>

      {/* Info */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl">
        <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700 dark:text-blue-300">Cấu hình sẽ được áp dụng ngay lập tức cho tất cả nội dung mới. Nội dung đã phân phối sẽ cần thời gian propagate (mặc định 5 phút CDN cache).</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dynamic Watermark */}
        <SectionCard title="Dynamic Watermarking" icon={<Droplets className="w-5 h-5" />} description="Chèn thông tin người xem vào video để truy vết rò rỉ.">
          <div>
            <SettingRow label="Bật Watermark" description="Hiển thị ID người dùng trên video khi phát">
              <ToggleSwitch id="toggle-watermark" checked={config.dynamicWatermark.enabled} onChange={(v) => setWatermark('enabled', v)} />
            </SettingRow>
            <SettingRow label="Hiển thị User ID">
              <ToggleSwitch id="toggle-show-userid" checked={config.dynamicWatermark.showUserId} onChange={(v) => setWatermark('showUserId', v)} />
            </SettingRow>
            <SettingRow label="Hiển thị Timestamp">
              <ToggleSwitch id="toggle-show-timestamp" checked={config.dynamicWatermark.showTimestamp} onChange={(v) => setWatermark('showTimestamp', v)} />
            </SettingRow>
            <SettingRow label="Vị trí" description="Vị trí watermark trên màn hình">
              <select className={inputCls} value={config.dynamicWatermark.position} onChange={(e) => setWatermark('position', e.target.value)}>
                <option value="top-left">Trên trái</option>
                <option value="top-right">Trên phải</option>
                <option value="bottom-left">Dưới trái</option>
                <option value="bottom-right">Dưới phải</option>
                <option value="center">Giữa</option>
              </select>
            </SettingRow>
            <SettingRow label="Độ mờ" description={`${Math.round(config.dynamicWatermark.opacity * 100)}%`}>
              <div className="flex items-center gap-3">
                <input type="range" min="0.05" max="0.5" step="0.01" value={config.dynamicWatermark.opacity} onChange={(e) => setWatermark('opacity', parseFloat(e.target.value))} className="w-28 accent-primary" />
                <span className="text-sm text-zinc-500 w-10 text-right">{Math.round(config.dynamicWatermark.opacity * 100)}%</span>
              </div>
            </SettingRow>
          </div>
        </SectionCard>

        {/* Viewer Shield */}
        <SectionCard title="Viewer Shield" icon={<Monitor className="w-5 h-5" />} description="Ngăn chặn sao chép và ghi màn hình nội dung bài học.">
          <div>
            <SettingRow label="Bật Viewer Shield">
              <ToggleSwitch id="toggle-viewer-shield" checked={config.viewerShield.enabled} onChange={(v) => setViewer('enabled', v)} />
            </SettingRow>
            <SettingRow label="Chặn chụp màn hình" description="Hiển thị màn hình đen khi phát hiện screenshot (hỗ trợ DRM)">
              <ToggleSwitch id="toggle-block-screenshot" checked={config.viewerShield.blockScreenCapture} onChange={(v) => setViewer('blockScreenCapture', v)} />
            </SettingRow>
            <SettingRow label="Chặn DevTools" description="Tự động ngăn khi mở Developer Tools">
              <ToggleSwitch id="toggle-block-devtools" checked={config.viewerShield.blockDevTools} onChange={(v) => setViewer('blockDevTools', v)} />
            </SettingRow>
            <SettingRow label="Chặn chuột phải" description="Vô hiệu hóa context menu trên player">
              <ToggleSwitch id="toggle-block-rightclick" checked={config.viewerShield.blockRightClick} onChange={(v) => setViewer('blockRightClick', v)} />
            </SettingRow>
          </div>
        </SectionCard>

        {/* HLS Config */}
        <div className="lg:col-span-2">
          <SectionCard title="Cấu hình HLS" icon={<Lock className="w-5 h-5" />} description="Thiết lập tham số cho HLS streaming được mã hóa AES-128.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SettingRow label="Thời gian mỗi segment" description={`Mỗi chunk HLS dài ${config.hlsConfig.segmentDuration} giây`}>
                <div className="flex items-center gap-3">
                  <input type="range" min="2" max="10" step="1" value={config.hlsConfig.segmentDuration} onChange={(e) => setHls('segmentDuration', parseInt(e.target.value))} className="w-28 accent-primary" />
                  <span className="text-sm font-mono text-zinc-700 dark:text-zinc-300 w-12">{config.hlsConfig.segmentDuration}s</span>
                </div>
              </SettingRow>
              <SettingRow label="Loại playlist" description="VOD = video on-demand, EVENT = live stream">
                <select className={inputCls} value={config.hlsConfig.playlistType} onChange={(e) => setHls('playlistType', e.target.value)}>
                  <option value="VOD">VOD (Video on Demand)</option>
                  <option value="EVENT">EVENT (Live Stream)</option>
                </select>
              </SettingRow>
            </div>

            {/* Preview */}
            <div className="mt-6 p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
              <p className="text-xs text-zinc-500 mb-3 font-mono">// Preview cấu hình HLS M3U8</p>
              <pre className="text-xs font-mono text-emerald-400 leading-relaxed whitespace-pre-wrap">{`#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:${config.hlsConfig.segmentDuration}
#EXT-X-PLAYLIST-TYPE:${config.hlsConfig.playlistType}
#EXT-X-KEY:METHOD=AES-128,URI="https://kms.securelearn.vn/key/{keyId}",IV=0x...
#EXTINF:${config.hlsConfig.segmentDuration}.000,
segment_000.ts
#EXTINF:${config.hlsConfig.segmentDuration}.000,
segment_001.ts
...`}</pre>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};
