// CourseEditor: Multi-tab editor for instructor courses
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Upload, Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Video, FileText, Loader2, AlertTriangle, CheckCircle2, Clock, BookOpen, Settings, Film } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { ThumbnailUploader } from "@/components/ui/ThumbnailUploader";
import { useGetCourseForManage, useUpdateCourse, usePublishCourse } from "@/hooks/useInstructorCourses";
import { usePublicCourseCategories } from "@/hooks/usePublicCourseCategories";
import { toast } from "sonner";
import type { ICourse, ISection, ILesson, ICourseCategoryNode } from "@/services/courseApi";
import { LessonVideoUploader } from "./LessonVideoUploader";

type Tab = "basic" | "detail" | "curriculum";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "basic", label: "Thông tin cơ bản", icon: <Settings className="w-4 h-4" /> },
  { id: "detail", label: "Nội dung chi tiết", icon: <BookOpen className="w-4 h-4" /> },
  { id: "curriculum", label: "Giáo trình", icon: <Film className="w-4 h-4" /> },
];

// --- BulletListEditor ---
interface BulletListEditorProps {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  addLabel?: string;
}
const BulletListEditor: React.FC<BulletListEditorProps> = ({ items, onChange, placeholder = "Nhập nội dung...", addLabel = "Thêm mục" }) => {
  const update = (i: number, v: string) => { const n = [...items]; n[i] = v; onChange(n); };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, ""]);
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-5 h-5 shrink-0 flex items-center justify-center text-xs font-bold text-primary bg-primary/10 rounded-full">{i + 1}</span>
          <Input value={item} onChange={e => update(i, e.target.value)} placeholder={placeholder} className="h-9 rounded-lg flex-1" />
          <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)} className="h-8 w-8 p-1.5 text-zinc-400 hover:text-red-500 transition-colors shrink-0">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="ghost" size="sm" onClick={add} className="gap-2 text-xs text-muted-foreground mt-1">
        <Plus className="w-3.5 h-3.5" /> {addLabel}
      </Button>
    </div>
  );
};

type CategoryOption = {
  value: string;
  label: string;
};

const flattenCategoryOptions = (categories: ICourseCategoryNode[], parentTrail = ""): CategoryOption[] => {
  return categories.flatMap((category) => {
    const label = parentTrail ? `${parentTrail} > ${category.name}` : category.name;
    return [
      { value: category._id, label },
      ...flattenCategoryOptions(category.children || [], label),
    ];
  });
};

// --- Main Component ---
export const CourseEditor: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { data: course, isLoading, error } = useGetCourseForManage(courseId!);
  const { data: categories = [], isLoading: isCategoriesLoading } = usePublicCourseCategories();
  const updateMutation = useUpdateCourse();
  const publishMutation = usePublishCourse();

  const [activeTab, setActiveTab] = useState<Tab>("basic");
  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [whatYouWillLearn, setWhatYouWillLearn] = useState<string[]>([""]);
  const [requirements, setRequirements] = useState<string[]>([""]);
  const [categoryId, setCategoryId] = useState("");
  const [level, setLevel] = useState("BEGINNER");
  const [price, setPrice] = useState(0);
  const [sections, setSections] = useState<ISection[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (course) {
      setTitle(course.title);
      setShortDescription(course.shortDescription || "");
      setDescription(course.description || "");
      setThumbnail(course.thumbnail || "");
      setWhatYouWillLearn(course.whatYouWillLearn?.length ? course.whatYouWillLearn : [""]);
      setRequirements(course.requirements?.length ? course.requirements : [""]);
      setCategoryId(course.categoryId || "");
      setLevel(course.level);
      setPrice(course.price);
      setSections(course.sections || []);
      setExpandedSections(new Set(course.sections?.map((_, i) => i) || []));
    }
  }, [course]);

  const categoryOptions = flattenCategoryOptions(categories);

  const pendingVideos = sections.flatMap(s => s.lessons).filter(l => l.type === "VIDEO" && (l.processingStatus === "PENDING" || l.processingStatus === "PROCESSING"));
  const hasBlockingVideos = pendingVideos.length > 0;

  const toggleSection = (i: number) => {
    setExpandedSections(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });
  };

  const handleSave = () => {
    updateMutation.mutate(
      { courseId: courseId!, payload: { title, shortDescription, description, thumbnail, whatYouWillLearn: whatYouWillLearn.filter(Boolean), requirements: requirements.filter(Boolean), categoryId, level: level as ICourse["level"], price, sections } },
      { onSuccess: () => toast.success("Đã lưu khóa học!"), onError: (err: any) => toast.error(err.message || "Lưu thất bại.") }
    );
  };

  const handlePublish = () => {
    if (hasBlockingVideos) { toast.error(`Còn ${pendingVideos.length} video đang xử lý.`); return; }
    publishMutation.mutate(courseId!, {
      onSuccess: () => { toast.success("Khóa học đã được xuất bản!"); navigate("/instructor/courses"); },
      onError: (err: any) => toast.error(err.message),
    });
  };

  const addSection = () => { const s: ISection = { title: `Chương ${sections.length + 1}: Chưa đặt tên`, order: sections.length + 1, lessons: [] }; setSections([...sections, s]); setExpandedSections(prev => new Set(prev).add(sections.length)); };
  const removeSection = (i: number) => setSections(sections.filter((_, idx) => idx !== i));
  const updateSectionTitle = (i: number, v: string) => { const u = [...sections]; u[i] = { ...u[i], title: v }; setSections(u); };
  const addLesson = (si: number) => { const u = [...sections]; const ls = u[si].lessons; const l: ILesson = { title: `Bài ${ls.length + 1}: Chưa đặt tên`, type: "VIDEO", content: "", duration: 0, order: ls.length + 1, processingStatus: "NONE" }; u[si] = { ...u[si], lessons: [...ls, l] }; setSections(u); };
  const removeLesson = (si: number, li: number) => { const u = [...sections]; u[si] = { ...u[si], lessons: u[si].lessons.filter((_, i) => i !== li) }; setSections(u); };
  const updateLesson = (si: number, li: number, field: string, value: any) => { const u = [...sections]; const ls = [...u[si].lessons]; ls[li] = { ...ls[li], [field]: value }; u[si] = { ...u[si], lessons: ls }; setSections(u); };
  const handleLessonTypeChange = (si: number, li: number, t: string) => { const u = [...sections]; const ls = [...u[si].lessons]; ls[li] = { ...ls[li], type: t as ILesson["type"], ...(t !== "VIDEO" && { videoId: undefined, processingStatus: undefined, processingProgress: undefined, playbackUrl: undefined, videoFileName: undefined, videoDurationSec: undefined }), ...(t === "VIDEO" && { processingStatus: "NONE" as const }) }; u[si] = { ...u[si], lessons: ls }; setSections(u); };

  if (isLoading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (error || !course) return <div className="text-center py-32"><p className="text-destructive font-medium">{(error as Error)?.message || "Không tìm thấy khóa học."}</p><Button variant="outline" className="mt-4" onClick={() => navigate("/instructor/courses")}>Quay lại</Button></div>;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/instructor/courses")} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Chỉnh sửa khóa học</h1>
              {getStatusBadge(course.status)}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">ID: {courseId}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {hasBlockingVideos && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl text-xs font-medium text-amber-700 dark:text-amber-400">
              <Clock className="w-3.5 h-3.5 animate-pulse" />{pendingVideos.length} video đang xử lý
            </div>
          )}
          <Button variant="outline" onClick={handleSave} disabled={updateMutation.isPending} className="gap-2 rounded-xl">
            {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Lưu
          </Button>
          {course.status === "DRAFT" && (
            <Button onClick={handlePublish} disabled={publishMutation.isPending} className={`gap-2 rounded-xl ${hasBlockingVideos ? "opacity-60" : ""}`}>
              {publishMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Xuất bản
              {hasBlockingVideos && <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />}
            </Button>
          )}
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
        {TABS.map(tab => (
          <Button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            variant="ghost"
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200 dark:border-zinc-700"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </Button>
        ))}
      </div>

      {/* Tab: Thông tin cơ bản */}
      {activeTab === "basic" && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-6">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Thông tin cơ bản</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Thumbnail */}
            <div className="md:col-span-2 md:row-span-3">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block">Hình ảnh quảng cáo khóa học</label>
              <ThumbnailUploader value={thumbnail} onChange={setThumbnail} />
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1.5">Khuyến nghị tỉ lệ 16:9, tối thiểu 1280×720px</p>
            </div>

            {/* Right column fields */}
            <div className="md:col-span-2 md:col-start-1 md:row-start-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block">Tên khóa học</label>
                <Input value={title} onChange={e => setTitle(e.target.value)} className="h-11 rounded-xl" placeholder="Nhập tên khóa học..." />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center justify-between">
                  <span>Mô tả ngắn gọn</span>
                  <span className={`text-xs ${shortDescription.length > 200 ? "text-red-500" : "text-zinc-400"}`}>{shortDescription.length}/200</span>
                </label>
                <textarea
                  value={shortDescription}
                  onChange={e => setShortDescription(e.target.value)}
                  maxLength={220}
                  rows={3}
                  className="w-full p-3 rounded-xl bg-background border border-zinc-200 dark:border-zinc-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Một câu giới thiệu ngắn, sẽ hiển thị ngay dưới tên khóa học..."
                />
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block">Danh mục</label>
                <Select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-background border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  disabled={isCategoriesLoading}
                >
                  <option value="">
                    {isCategoriesLoading ? "Đang tải danh mục..." : "Chọn danh mục"}
                  </option>
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
                <p className="mt-1.5 text-xs text-zinc-400">Hiển thị đầy đủ cây danh mục tối đa 4 cấp.</p>
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block">Trình độ</label>
                <Select value={level} onChange={e => setLevel(e.target.value)} className="w-full h-11 px-3 rounded-xl bg-background border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="BEGINNER">Cơ bản</option>
                  <option value="INTERMEDIATE">Trung cấp</option>
                  <option value="ADVANCED">Nâng cao</option>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block">Giá (VND)</label>
                <Input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} className="h-11 rounded-xl" min={0} step={1000} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Nội dung chi tiết */}
      {activeTab === "detail" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Học viên sẽ học được gì</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Liệt kê những kỹ năng, kiến thức học viên đạt được sau khóa học</p>
            </div>
            <BulletListEditor items={whatYouWillLearn} onChange={setWhatYouWillLearn} placeholder="Ví dụ: Xây dựng REST API với Node.js..." addLabel="Thêm mục tiêu" />
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Yêu cầu & Điều kiện tiên quyết</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Những kiến thức hoặc công cụ cần có trước khi bắt đầu khóa học</p>
            </div>
            <BulletListEditor items={requirements} onChange={setRequirements} placeholder="Ví dụ: Biết cơ bản về HTML/CSS..." addLabel="Thêm yêu cầu" />
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Mô tả chi tiết</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Giới thiệu đầy đủ về khóa học — hỗ trợ định dạng văn bản phong phú</p>
            </div>
            <RichTextEditor value={description} onChange={setDescription} placeholder="Viết mô tả chi tiết về khóa học..." minHeight="280px" />
          </div>
        </div>
      )}

      {/* Tab: Giáo trình */}
      {activeTab === "curriculum" && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Giáo trình</h2>
              {hasBlockingVideos && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />{pendingVideos.length} video đang mã hóa
                </p>
              )}
            </div>
            <Button variant="outline" onClick={addSection} className="gap-2 rounded-xl text-sm">
              <Plus className="w-4 h-4" /> Thêm chương
            </Button>
          </div>

          {sections.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground"><p>Chưa có chương nào. Hãy thêm chương đầu tiên!</p></div>
          ) : (
            <div className="space-y-4">
              {sections.map((section, sIdx) => (
                <div key={sIdx} className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 bg-zinc-50 dark:bg-zinc-950 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors" onClick={() => toggleSection(sIdx)}>
                    <GripVertical className="w-4 h-4 text-zinc-400 shrink-0" />
                    <Input value={section.title} onChange={e => updateSectionTitle(sIdx, e.target.value)} onClick={e => e.stopPropagation()} className="h-8 text-sm font-medium border-none bg-transparent p-0 focus-visible:ring-0" />
                    <Badge variant="secondary" className="shrink-0 text-xs">{section.lessons.length} bài</Badge>
                    <Button type="button" variant="ghost" size="icon" onClick={e => { e.stopPropagation(); removeSection(sIdx); }} className="h-7 w-7 p-1 text-zinc-400 hover:text-red-500 transition-colors shrink-0"><Trash2 className="w-4 h-4" /></Button>
                    {expandedSections.has(sIdx) ? <ChevronUp className="w-4 h-4 shrink-0 text-zinc-400" /> : <ChevronDown className="w-4 h-4 shrink-0 text-zinc-400" />}
                  </div>
                  {expandedSections.has(sIdx) && (
                    <div className="p-4 space-y-3 border-t border-zinc-200 dark:border-zinc-800">
                      {section.lessons.map((lesson, lIdx) => (
                        <LessonRow key={lIdx} lesson={lesson} sectionIndex={sIdx} lessonIndex={lIdx}
                          onUpdateField={(f, v) => updateLesson(sIdx, lIdx, f, v)}
                          onChangeType={t => handleLessonTypeChange(sIdx, lIdx, t)}
                          onRemove={() => removeLesson(sIdx, lIdx)} />
                      ))}
                      <Button variant="ghost" size="sm" onClick={() => addLesson(sIdx)} className="gap-2 text-xs text-muted-foreground">
                        <Plus className="w-3.5 h-3.5" /> Thêm bài giảng
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// LessonRow sub-component
interface LessonRowProps { lesson: ILesson; sectionIndex: number; lessonIndex: number; onUpdateField: (f: string, v: any) => void; onChangeType: (t: string) => void; onRemove: () => void; }
const LessonRow: React.FC<LessonRowProps> = ({ lesson, onUpdateField, onChangeType, onRemove }) => {
  const isVideo = lesson.type === "VIDEO";
  const status = lesson.processingStatus;
  return (
    <div className={`rounded-xl border transition-colors overflow-hidden ${isVideo && status === "DONE" ? "border-green-200 dark:border-green-500/20" : isVideo && (status === "PENDING" || status === "PROCESSING") ? "border-indigo-200 dark:border-indigo-500/20" : "border-zinc-200 dark:border-zinc-800/60"}`}>
      <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-950">
        <GripVertical className="w-4 h-4 text-zinc-400 shrink-0" />
        {isVideo ? <div className={`w-5 h-5 shrink-0 ${status === "DONE" ? "text-green-500" : status === "PROCESSING" || status === "PENDING" ? "text-indigo-500" : status === "FAILED" ? "text-red-500" : "text-blue-400"}`}><Video className="w-4 h-4" /></div> : lesson.type === "DOCUMENT" ? <FileText className="w-4 h-4 text-emerald-500 shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0" />}
        <Input value={lesson.title} onChange={e => onUpdateField("title", e.target.value)} className="h-8 text-sm border-none bg-transparent p-0 focus-visible:ring-0 flex-1" placeholder="Tên bài giảng..." />
        {isVideo && status && status !== "NONE" && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 hidden sm:inline-block ${status === "DONE" ? "bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400" : status === "FAILED" ? "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400" : "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400"}`}>
            {status === "DONE" ? "✓ Sẵn sàng" : status === "FAILED" ? "✗ Lỗi" : status === "PROCESSING" ? "⟳ Mã hóa..." : "↑ Đang tải..."}
          </span>
        )}
        <Select value={lesson.type} onChange={e => onChangeType(e.target.value)} className="h-8 w-[120px] px-2 text-xs rounded-lg bg-background border border-zinc-200 dark:border-zinc-800 shrink-0">
          <option value="VIDEO">Video</option>
          <option value="DOCUMENT">Tài liệu</option>
          <option value="QUIZ">Quiz</option>
        </Select>
        <Button type="button" variant="ghost" size="icon" onClick={onRemove} className="h-7 w-7 p-1 text-zinc-400 hover:text-red-500 transition-colors shrink-0"><Trash2 className="w-3.5 h-3.5" /></Button>
      </div>
      {isVideo && <div className="px-4 pb-4 pt-1 bg-white dark:bg-zinc-900/50"><LessonVideoUploader lesson={lesson} onUpdate={(f, v) => onUpdateField(f as string, v)} /></div>}
    </div>
  );
};

const getStatusBadge = (status: string) => {
  if (status === "PUBLISHED") return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20 text-xs">Đã xuất bản</Badge>;
  if (status === "DRAFT") return <Badge variant="secondary" className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 text-xs">Bản nháp</Badge>;
  return null;
};
