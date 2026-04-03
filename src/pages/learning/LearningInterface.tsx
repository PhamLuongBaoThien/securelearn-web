import { useState } from 'react';
import { PlayCircle, CheckCircle, FileText, Download, MessageSquare } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { FadeIn } from '../../components/animations/FadeIn';
import { SlideUp } from '../../components/animations/SlideUp';

const VIMEO_PLACEHOLDER = "https://player.vimeo.com/video/76979871?h=8272103f6e&title=0&byline=0&portrait=0";

const lessons = [
  { id: 1, title: 'Giới thiệu về kiến trúc Microservices', duration: '12:30', completed: true },
  { id: 2, title: 'Thiết lập API Gateway chống DDoS', duration: '18:45', completed: true },
  { id: 3, title: 'Mã hóa Video HLS (DRM Core)', duration: '25:10', completed: false, active: true },
  { id: 4, title: 'Bảo vệ PDF chặn Download, Copy', duration: '10:00', completed: false },
  { id: 5, title: 'Hệ thống Tracking lịch sử học tập chuẩn xác', duration: '40:00', completed: false },
];

export const LearningInterface = () => {
  const [activeTab, setActiveTab] = useState<'notes'|'resources'|'discussion'>('notes');

  return (
    <DashboardLayout>
      <div className="flex flex-col lg:flex-row gap-8 h-full pb-10 mt-4">
        
        {/* Main Video Area */}
        {/* DRM Protection: Chặn chuột phải (onContextMenu preventDefault) để tránh lưu Video / PDF */}
        <div className="flex-1 flex flex-col gap-6" onContextMenu={(e) => { e.preventDefault(); alert("Right-click is disabled to protect content."); }}>
          <FadeIn>
            <div className="w-full aspect-[16/9] bg-black rounded-3xl overflow-hidden shadow-2xl border border-border/80 relative group ring-1 ring-white/10 select-none">
              <iframe 
                src={VIMEO_PLACEHOLDER} 
                className="w-full h-full absolute inset-0" 
                frameBorder="0" 
                allow="autoplay; fullscreen; picture-in-picture" 
                allowFullScreen
              />
            </div>
            
            <div className="mt-8">
              <h1 className="text-3xl font-extrabold tracking-tight mb-2 text-primary">Mã hóa Video HLS và chặn Download (DRM Core)</h1>
              <p className="text-muted-foreground text-lg">Trong bài học này, chúng ta sẽ học cách tối ưu chuẩn phân phối HLS kết hợp cùng Widevine CDM để mã hóa khóa AES trên đường truyền, giúp ngăn cản tuyệt đối việc bắt link m3u8 và tải lậu nội dung bằng phần mềm bên thứ 3.</p>
            </div>
          </FadeIn>

          {/* Tabs Area */}
          <SlideUp delay={0.2} className="mt-6 border border-border rounded-2xl bg-card shadow-sm overflow-hidden flex flex-col min-h-[300px]">
            <div className="flex border-b border-border bg-muted/20">
              <button onClick={() => setActiveTab('notes')} className={`flex-1 py-4 text-sm font-semibold transition-all border-b-2 ${activeTab === 'notes' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50'}`}>
                <div className="flex items-center justify-center gap-2"><FileText className="w-4 h-4"/> Ghi chép</div>
              </button>
              <button onClick={() => setActiveTab('resources')} className={`flex-1 py-4 text-sm font-semibold transition-all border-b-2 ${activeTab === 'resources' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50'}`}>
                <div className="flex items-center justify-center gap-2"><Download className="w-4 h-4"/> Tài liệu đính kèm</div>
              </button>
              <button onClick={() => setActiveTab('discussion')} className={`flex-1 py-4 text-sm font-semibold transition-all border-b-2 ${activeTab === 'discussion' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50'}`}>
                <div className="flex items-center justify-center gap-2"><MessageSquare className="w-4 h-4"/> Hỏi đáp Q&A</div>
              </button>
            </div>
            
            <div className="p-8 bg-card flex-1">
              {activeTab === 'notes' && (
                <textarea className="w-full min-h-[200px] p-5 border border-input rounded-xl bg-background/50 resize-y focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground transition-all shadow-inner" placeholder="Tạo ghi chú nhanh ở ngay tại bài học này..."></textarea>
              )}
              {activeTab === 'resources' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-background/50 hover:bg-secondary cursor-pointer transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                        <Download className="w-5 h-5 text-primary" />
                      </div>
                      <span className="font-medium text-foreground">hls_encryption_cheatsheet.pdf</span>
                    </div>
                    <span className="text-sm font-medium text-muted-foreground px-3 py-1 bg-secondary rounded-full">2.4 MB</span>
                  </div>
                </div>
              )}
            </div>
          </SlideUp>
        </div>

        {/* Sidebar Lesson List */}
        <FadeIn direction="left" distance={30} delay={0.3} className="w-full lg:w-96 shrink-0 mt-8 lg:mt-0">
          <div className="border border-border rounded-2xl bg-card shadow-sm sticky top-24 overflow-hidden">
            <div className="p-6 border-b border-border bg-muted/10">
              <h3 className="font-bold text-lg mb-4">Nội dung khóa học</h3>
              <div className="flex items-center w-full bg-secondary/50 rounded-full h-2.5 overflow-hidden">
                <div className="bg-primary h-full rounded-full w-2/5 transition-all duration-1000 ease-out"></div>
              </div>
              <p className="text-sm font-medium text-muted-foreground mt-3">Đã hoàn thành 2 / 5 bài học (40%)</p>
            </div>
            <div className="flex flex-col max-h-[700px] overflow-y-auto">
              {lessons.map((lesson) => (
                <div key={lesson.id} className={`flex items-start gap-4 p-5 border-b border-border/40 cursor-pointer transition-all ${lesson.active ? 'bg-primary/5 border-l-4 border-l-primary' : 'hover:bg-secondary/50 border-l-4 border-l-transparent'}`}>
                  {lesson.completed ? (
                    <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                  ) : lesson.active ? (
                    <PlayCircle className="w-6 h-6 text-primary shrink-0 mt-0.5 fill-primary/10" />
                  ) : (
                    <div className="w-6 h-6 rounded-full border-[2.5px] border-muted-foreground/40 shrink-0 mt-0.5"></div>
                  )}
                  <div className="flex flex-col">
                    <span className={`text-base font-semibold line-clamp-2 leading-tight ${lesson.active ? 'text-primary' : 'text-foreground'}`}>{lesson.title}</span>
                    <span className="text-sm font-medium text-muted-foreground mt-1.5 flex items-center gap-1.5"><PlayCircle className="w-3.5 h-3.5"/> {lesson.duration}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

      </div>
    </DashboardLayout>
  );
};
