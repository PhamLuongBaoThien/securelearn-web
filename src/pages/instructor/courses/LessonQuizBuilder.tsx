// File này là UI tạo/sửa quiz cho lesson type QUIZ.
// Lưu ý:
// - nếu lesson đã có quiz thì load lên để sửa
// - UI hiện đang thiên về single choice, dù backend model có hỗ trợ thêm type khác
import { useEffect, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGetLessonQuiz, useSaveLessonQuiz } from '@/hooks/useInstructorCourses';
import { type IQuizQuestion } from '@/services/courseApi';

interface LessonQuizBuilderProps {
  courseId: string;
  lessonId?: string;
}

const createEmptyQuestion = (): IQuizQuestion => ({
  type: 'SINGLE_CHOICE',
  prompt: '',
  options: [{ text: '' }, { text: '' }],
  correctOptionIndexes: [0],
  explanation: '',
  points: 1,
});

export function LessonQuizBuilder({ courseId, lessonId }: LessonQuizBuilderProps) {
  const { data: quiz } = useGetLessonQuiz(courseId, lessonId);
  const saveQuizMutation = useSaveLessonQuiz();
  const [title, setTitle] = useState('Quiz');
  const [passingScore, setPassingScore] = useState(70);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [timeLimitSec, setTimeLimitSec] = useState<number | ''>('');
  const [questions, setQuestions] = useState<IQuizQuestion[]>([createEmptyQuestion()]);
  const [quizId, setQuizId] = useState<string | null>(null);

  useEffect(() => {
    if (!quiz) return;

    setQuizId(quiz._id);
    setTitle(quiz.title);
    setPassingScore(quiz.passingScore);
    setShuffleQuestions(quiz.shuffleQuestions ?? false);
    setShuffleOptions(quiz.shuffleOptions ?? false);
    setTimeLimitSec(quiz.timeLimitSec ?? '');
    setQuestions(quiz.questions.length > 0 ? quiz.questions : [createEmptyQuestion()]);
  }, [quiz]);

  const updateQuestion = (index: number, partial: Partial<IQuizQuestion>) => {
    setQuestions((prev) => prev.map((question, questionIndex) => (
      questionIndex === index ? { ...question, ...partial } : question
    )));
  };

  const saveQuiz = async () => {
    if (!lessonId) return;

    try {
      const payload = {
        title,
        passingScore,
        shuffleQuestions,
        shuffleOptions,
        timeLimitSec: timeLimitSec === '' ? null : Number(timeLimitSec),
        questions,
      };

      const savedQuiz = await saveQuizMutation.mutateAsync({
        courseId,
        lessonId,
        quizId,
        payload: payload as any,
      });

      setQuizId(savedQuiz._id);
      toast.success('Đã lưu bài tập.');
    } catch (error: any) {
      toast.error(error.message || 'Lưu bài tập thất bại.');
    }
  };

  return (
    <div className="mt-2 space-y-6 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-[1fr_140px]">
          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block">Tên Quiz</label>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Nhập tên quiz..." className="h-10" />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block">Điểm đạt (%)</label>
            <Input type="number" value={passingScore} onChange={(event) => setPassingScore(Number(event.target.value) || 0)} placeholder="VD: 70" className="h-10" min={0} max={100} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 p-4 bg-zinc-50 dark:bg-zinc-950/50 rounded-xl border border-zinc-200 dark:border-zinc-800/60">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={shuffleQuestions} onChange={(e) => setShuffleQuestions(e.target.checked)} className="w-4 h-4 rounded border-zinc-300 text-primary focus:ring-primary bg-white dark:bg-zinc-900 dark:border-zinc-700" />
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Trộn thứ tự câu hỏi</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={shuffleOptions} onChange={(e) => setShuffleOptions(e.target.checked)} className="w-4 h-4 rounded border-zinc-300 text-primary focus:ring-primary bg-white dark:bg-zinc-900 dark:border-zinc-700" />
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Trộn thứ tự đáp án</span>
          </label>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 whitespace-nowrap">Thời gian (giây):</span>
            <Input type="number" value={timeLimitSec} onChange={(e) => setTimeLimitSec(e.target.value ? Number(e.target.value) : '')} placeholder="Không giới hạn" className="h-8 text-sm" min={0} />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((question, index) => (
          <div key={index} className="rounded-xl border border-zinc-200 bg-white dark:bg-zinc-900 dark:border-zinc-800 shadow-sm overflow-hidden">
            <div className="bg-zinc-50 dark:bg-zinc-950 p-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {index + 1}
                </span>
                <select
                  value={question.type}
                  onChange={(e) => {
                    const newType = e.target.value as IQuizQuestion['type'];
                    const partial: Partial<IQuizQuestion> = { type: newType, correctOptionIndexes: [0] };
                    if (newType === 'TRUE_FALSE') {
                      partial.options = [{ text: 'Đúng' }, { text: 'Sai' }];
                    }
                    updateQuestion(index, partial);
                  }}
                  className="h-8 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="SINGLE_CHOICE">Một đáp án</option>
                  <option value="MULTIPLE_CHOICE">Nhiều đáp án</option>
                  <option value="TRUE_FALSE">Đúng / Sai</option>
                </select>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-zinc-500">Điểm:</span>
                  <Input type="number" value={question.points ?? 1} onChange={(e) => updateQuestion(index, { points: Number(e.target.value) || 0 })} className="h-8 w-16 text-xs text-center px-1" min={0} />
                </div>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setQuestions((prev) => prev.filter((_, qIdx) => qIdx !== index))} className="h-8 w-8 text-zinc-400 hover:text-red-500 transition-colors">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-4 space-y-4">
              <Input value={question.prompt} onChange={(event) => updateQuestion(index, { prompt: event.target.value })} placeholder="Nhập câu hỏi..." className="font-medium" />

              <div className="space-y-2 pl-2">
                {question.options.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-center gap-3">
                    {question.type === 'MULTIPLE_CHOICE' ? (
                      <input
                        type="checkbox"
                        checked={question.correctOptionIndexes.includes(optionIndex)}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          let nextIndexes = [...question.correctOptionIndexes];
                          if (isChecked) {
                            nextIndexes.push(optionIndex);
                          } else {
                            nextIndexes = nextIndexes.filter((idx) => idx !== optionIndex);
                          }
                          updateQuestion(index, { correctOptionIndexes: nextIndexes });
                        }}
                        className="w-4 h-4 shrink-0 rounded border-zinc-300 text-primary focus:ring-primary bg-white dark:bg-zinc-900 dark:border-zinc-700 mt-0.5"
                      />
                    ) : (
                      <input
                        type="radio"
                        name={`question-${index}`}
                        checked={question.correctOptionIndexes[0] === optionIndex}
                        onChange={() => updateQuestion(index, { correctOptionIndexes: [optionIndex] })}
                        className="w-4 h-4 shrink-0 border-zinc-300 text-primary focus:ring-primary bg-white dark:bg-zinc-900 dark:border-zinc-700 mt-0.5"
                      />
                    )}
                    <Input
                      value={option.text}
                      onChange={(event) => {
                        const nextOptions = question.options.map((item, itemIndex) => (
                          itemIndex === optionIndex ? { text: event.target.value } : item
                        ));
                        updateQuestion(index, { options: nextOptions });
                      }}
                      placeholder={`Lựa chọn ${optionIndex + 1}`}
                      className="h-9"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const nextOptions = question.options.filter((_, idx) => idx !== optionIndex);
                        let nextIndexes = question.correctOptionIndexes
                          .filter((idx) => idx !== optionIndex)
                          .map((idx) => (idx > optionIndex ? idx - 1 : idx));
                        if (nextIndexes.length === 0 && nextOptions.length > 0) nextIndexes = [0];
                        updateQuestion(index, { options: nextOptions, correctOptionIndexes: nextIndexes });
                      }}
                      disabled={question.options.length <= 2}
                      className="h-8 w-8 text-zinc-400 hover:text-red-500 shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                
                {question.type !== 'TRUE_FALSE' && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => updateQuestion(index, { options: [...question.options, { text: '' }] })} className="gap-2 text-xs text-muted-foreground mt-1 ml-5">
                    <Plus className="h-3.5 w-3.5" /> Thêm lựa chọn
                  </Button>
                )}
              </div>

              <div>
                <textarea
                  value={question.explanation || ''}
                  onChange={(e) => updateQuestion(index, { explanation: e.target.value })}
                  placeholder="Giải thích đáp án (tùy chọn)..."
                  rows={2}
                  className="w-full p-3 rounded-xl bg-zinc-50 border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-zinc-800">
        <Button type="button" variant="outline" onClick={() => setQuestions((prev) => [...prev, createEmptyQuestion()])} className="gap-2 rounded-xl">
          <Plus className="h-4 w-4" />
          Thêm câu hỏi
        </Button>
        <Button type="button" onClick={saveQuiz} disabled={saveQuizMutation.isPending || !lessonId} className="gap-2 rounded-xl">
          <Save className="h-4 w-4" />
          Lưu bài tập
        </Button>
      </div>
    </div>
  );
}
