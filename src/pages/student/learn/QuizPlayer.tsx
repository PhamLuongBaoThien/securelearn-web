import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, HelpCircle, History, Loader2, RotateCcw, XCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  courseLearningKeys,
  useQuizAttemptHistory,
  useLearningQuiz,
  useStartQuizAttempt,
  useSubmitQuizAttempt,
} from '@/hooks/useCourseLearning';
import { useCompleteQuizProgress, useProgressHeartbeat } from '@/hooks/useLearningProgress';
import type {
  ILesson,
  IQuizAttempt,
  IQuizAttemptHistory,
  IQuizAttemptHistoryItem,
  IQuizAttemptQuestionResult,
  IQuizAttemptResult,
  IQuizForAttempt,
  IQuizQuestion,
  IQuizQuestionForAttempt,
  QuizAttemptAnswerPayload,
} from '@/services/courseApi';
import type { LessonAccessSummary } from '@/services/progressApi';

type SelectedAnswers = Record<string, number[]>;
const QUIZ_HEARTBEAT_MS = 15_000;

const QUESTION_TYPE_LABEL: Record<IQuizQuestion['type'], string> = {
  SINGLE_CHOICE: 'Một đáp án đúng',
  MULTIPLE_CHOICE: 'Nhiều đáp án đúng',
  TRUE_FALSE: 'Đúng / Sai',
};

function isSingleAnswer(type: IQuizQuestion['type']) {
  return type === 'SINGLE_CHOICE' || type === 'TRUE_FALSE';
}

function normalizeAnswers(quiz: IQuizForAttempt, selectedAnswers: SelectedAnswers): QuizAttemptAnswerPayload[] {
  return quiz.questions.map((question) => {
    const selectedIndexes = selectedAnswers[question.questionId || ''] || [];
    if (isSingleAnswer(question.type)) {
      return {
        questionId: question.questionId || '',
        selectedIndex: selectedIndexes[0],
        selectedIndexes,
      };
    }

    return {
      questionId: question.questionId || '',
      selectedIndexes,
    };
  });
}

function upsertSubmittedAttemptHistory(
  current: IQuizAttemptHistory | undefined,
  attempt: IQuizAttempt,
  result: IQuizAttemptResult,
): IQuizAttemptHistory {
  const submittedAt = result.completedAt || new Date().toISOString();
  const existingAttempts = current?.attempts || [];
  const nextAttempt: IQuizAttemptHistoryItem = {
    attemptId: result.attemptId,
    attemptNumber: existingAttempts.find((item) => item.attemptId === result.attemptId)?.attemptNumber || (current?.totalAttempts || 0) + 1,
    score: result.score,
    passed: result.passed,
    status: result.status,
    startedAt: attempt.startedAt,
    completedAt: submittedAt,
  };
  const mergedAttempts = [nextAttempt, ...existingAttempts.filter((item) => item.attemptId !== result.attemptId)]
    .map((item, index, list) => ({ ...item, attemptNumber: list.length - index }));

  return {
    totalAttempts: mergedAttempts.length,
    submittedAttempts: mergedAttempts.filter((item) => item.status === 'SUBMITTED').length,
    bestScore: mergedAttempts.reduce((best, item) => Math.max(best, item.score || 0), 0),
    attempts: mergedAttempts,
  };
}
function EmptyQuizState({ message }: { message: string }) {
  return (
    <div className="flex min-h-[360px] items-center justify-center border-b border-zinc-200 bg-white px-6 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
      <div>
        <AlertCircle className="mx-auto h-9 w-9 text-zinc-500" />
        <p className="mt-3 text-sm">{message}</p>
      </div>
    </div>
  );
}

export function QuizPlayer({
  courseId,
  lesson,
  access,
}: {
  courseId: string;
  lesson: ILesson;
  access?: LessonAccessSummary;
}) {
  const lessonId = lesson._id || '';
  const isLocked = Boolean(access?.locked);
  const quizQuery = useLearningQuiz(courseId, lessonId, lesson.type === 'QUIZ' && !isLocked);
  const quiz = quizQuery.data;
  const queryClient = useQueryClient();
  const [attempt, setAttempt] = useState<IQuizAttempt | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<SelectedAnswers>({});
  const [result, setResult] = useState<IQuizAttemptResult | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const sessionId = useMemo(() => crypto.randomUUID(), []);

  const startAttempt = useStartQuizAttempt(courseId, lessonId, quiz?._id || '');
  const submitAttempt = useSubmitQuizAttempt(courseId, lessonId, quiz?._id || '', attempt?._id || '');
  const attemptHistory = useQuizAttemptHistory(courseId, lessonId, quiz?._id || '', historyOpen);
  const progressHeartbeat = useProgressHeartbeat(courseId);
  const sendProgressHeartbeat = progressHeartbeat.mutate;
  const completeProgress = useCompleteQuizProgress(courseId);

  const answeredCount = useMemo(() => {
    if (!quiz) return 0;
    return quiz.questions.filter((question) => (selectedAnswers[question.questionId || ''] || []).length > 0).length;
  }, [quiz, selectedAnswers]);

  const allAnswered = Boolean(quiz?.questions.length) && answeredCount === quiz?.questions.length;

  useEffect(() => {
    if (!attempt || result || !lessonId) return;
    const sendHeartbeat = () => {
      sendProgressHeartbeat({
        courseId,
        lessonId,
        lessonType: 'QUIZ',
        sessionId,
        quizAttemptId: attempt._id,
      });
    };

    sendHeartbeat();
    const interval = window.setInterval(sendHeartbeat, QUIZ_HEARTBEAT_MS);
    return () => window.clearInterval(interval);
  }, [attempt, courseId, lessonId, result, sendProgressHeartbeat, sessionId]);

  const handleSelect = (question: IQuizQuestionForAttempt, optionIndex: number, checked: boolean) => {
    if (result || !question.questionId) return;
    const questionId = question.questionId;

    setSelectedAnswers((current) => {
      if (isSingleAnswer(question.type)) {
        return { ...current, [questionId]: [optionIndex] };
      }

      const currentIndexes = current[questionId] || [];
      const nextIndexes = checked
        ? Array.from(new Set([...currentIndexes, optionIndex])).sort((a, b) => a - b)
        : currentIndexes.filter((index) => index !== optionIndex);

      return { ...current, [questionId]: nextIndexes };
    });
  };

  const handleStart = async () => {
    if (!quiz || isLocked) return;
    const startedAttempt = await startAttempt.mutateAsync();
    setAttempt(startedAttempt);
    setSelectedAnswers({});
    setResult(null);
  };

  const handleSubmit = async () => {
    if (!quiz || !attempt) return;
    const submittedResult = await submitAttempt.mutateAsync(normalizeAnswers(quiz, selectedAnswers));
    setResult(submittedResult);
    queryClient.setQueryData<IQuizAttemptHistory | undefined>(
      courseLearningKeys.quizAttempts(courseId, lessonId, quiz._id || ''),
      (current) => upsertSubmittedAttemptHistory(current, attempt, submittedResult),
    );
    completeProgress.mutate({
      courseId,
      lessonId,
      attemptId: submittedResult.attemptId,
      score: submittedResult.score,
      passed: submittedResult.passed,
    });
    void queryClient.invalidateQueries({
      queryKey: courseLearningKeys.quizAttempts(courseId, lessonId, quiz._id || ''),
      refetchType: 'inactive',
    });
  };

  if (quizQuery.isLoading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center border-b border-zinc-200 bg-white text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
        <div className="text-center">
          <Loader2 className="mx-auto h-7 w-7 animate-spin" />
          <p className="mt-3 text-sm">Đang tải bài quiz...</p>
        </div>
      </div>
    );
  }

  if (isLocked) {
    return <EmptyQuizState message={access?.reason || 'Hoàn thành bài trước để mở quiz này.'} />;
  }

  if (quizQuery.isError || !quiz) {
    return <EmptyQuizState message={(quizQuery.error as Error)?.message || 'Không thể tải bài quiz.'} />;
  }

  if (quiz.questions.length === 0) {
    return <EmptyQuizState message="Quiz này chưa có câu hỏi." />;
  }

  return (
    <div className="bg-zinc-50 dark:bg-zinc-950">
      <div className="border-b border-zinc-200 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-zinc-400">Bài kiểm tra</p>
            <h2 className="mt-1 text-xl font-bold text-zinc-950 dark:text-white">{quiz.title || lesson.title}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
              <span>{quiz.questions.length} câu hỏi</span>
              <span>Điểm đạt {quiz.passingScore}%</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button type="button" variant="outline" onClick={() => setHistoryOpen(true)} className="gap-2">
              <History className="h-4 w-4" />
              Lịch sử làm bài
            </Button>

            {!attempt && !result && (
              <Button onClick={handleStart} disabled={startAttempt.isPending} className="gap-2">
                {startAttempt.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Bắt đầu làm bài
              </Button>
            )}

            {result && (
              <Button onClick={handleStart} disabled={startAttempt.isPending} className="gap-2">
                {startAttempt.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                Làm bài lại
              </Button>
            )}
          </div>
        </div>
      </div>

      <AttemptHistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        history={attemptHistory.data}
        loading={attemptHistory.isLoading}
        error={(attemptHistory.error as Error)?.message}
      />

      {startAttempt.isError && (
        <p className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
          {(startAttempt.error as Error).message}
        </p>
      )}

      {result && <ResultSummary result={result} passingScore={quiz.passingScore} />}

      <div className="space-y-4 p-5">
        {!attempt && !result ? (
          <div className="flex min-h-48 items-center justify-center border border-dashed border-zinc-300 bg-white px-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <div>
              <HelpCircle className="mx-auto h-8 w-8 text-zinc-400" />
              <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                Bấm bắt đầu để mở bài quiz và chọn đáp án.
              </p>
            </div>
          </div>
        ) : (
          <>
            {quiz.questions.map((question, index) => (
              <QuestionCard
                key={question.questionId || index}
                index={index}
                question={question}
                selectedIndexes={selectedAnswers[question.questionId || ''] || []}
                result={result?.results.find((item) => item.questionId === question.questionId)}
                disabled={Boolean(result)}
                onSelect={handleSelect}
              />
            ))}

            {!result && (
              <div className="flex flex-col gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Đã trả lời {answeredCount}/{quiz.questions.length} câu.
                </p>
                <Button
                  onClick={handleSubmit}
                  disabled={!allAnswered || submitAttempt.isPending || !attempt}
                  className="gap-2"
                >
                  {submitAttempt.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Nộp bài
                </Button>
              </div>
            )}

            {submitAttempt.isError && (
              <p className="text-sm text-red-600 dark:text-red-400">{(submitAttempt.error as Error).message}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function AttemptHistoryDialog({
  open,
  onOpenChange,
  history,
  loading,
  error,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  history?: IQuizAttemptHistory;
  loading: boolean;
  error?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Lịch sử làm bài</DialogTitle>
          <DialogDescription>
            Xem lại số lần đã làm, điểm từng lần và kết quả đạt/chưa đạt.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex min-h-32 items-center justify-center text-zinc-500 dark:text-zinc-400">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Đang tải lịch sử...
          </div>
        ) : error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
            {error}
          </p>
        ) : !history || history.attempts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 px-5 py-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            Chưa có lần làm bài nào.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <HistoryStat label="Tổng lần làm" value={history.totalAttempts} />
              <HistoryStat label="Đã nộp" value={history.submittedAttempts} />
              <HistoryStat label="Điểm cao nhất" value={`${history.bestScore}%`} />
            </div>

            <div className="max-h-80 overflow-y-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
              {history.attempts.map((attempt) => (
                <div
                  key={attempt.attemptId}
                  className="flex flex-col gap-3 border-b border-zinc-200 px-4 py-3 last:border-b-0 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-zinc-950 dark:text-white">Lần {attempt.attemptNumber}</p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {attempt.completedAt
                        ? `Nộp lúc ${formatDateTime(attempt.completedAt)}`
                        : `Bắt đầu lúc ${formatDateTime(attempt.startedAt)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black text-zinc-950 dark:text-white">{attempt.score}%</span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        attempt.status !== 'SUBMITTED'
                          ? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
                          : attempt.passed
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300'
                      }`}
                    >
                      {attempt.status !== 'SUBMITTED' ? 'Đang làm' : attempt.passed ? 'Đạt' : 'Chưa đạt'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function HistoryStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-xs font-semibold uppercase text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-black text-zinc-950 dark:text-white">{value}</p>
    </div>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

function ResultSummary({ result, passingScore }: { result: IQuizAttemptResult; passingScore: number }) {
  const correctCount = result.results.filter((item) => item.isCorrect).length;

  return (
    <div
      className={`border-b px-5 py-4 ${
        result.passed
          ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-200'
          : 'border-red-200 bg-red-50 text-red-900 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-200'
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {result.passed ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
          <div>
            <p className="font-bold">{result.passed ? 'Bạn đã đạt bài quiz' : 'Bạn chưa đạt bài quiz'}</p>
            <p className="text-sm opacity-80">
              Đúng {correctCount}/{result.results.length} câu. Điểm đạt yêu cầu: {passingScore}%.
            </p>
          </div>
        </div>
        <div className="text-3xl font-black">{result.score}%</div>
      </div>
    </div>
  );
}

function QuestionCard({
  index,
  question,
  selectedIndexes,
  result,
  disabled,
  onSelect,
}: {
  index: number;
  question: IQuizQuestionForAttempt;
  selectedIndexes: number[];
  result?: IQuizAttemptQuestionResult;
  disabled: boolean;
  onSelect: (question: IQuizQuestionForAttempt, optionIndex: number, checked: boolean) => void;
}) {
  const questionResult = result;

  return (
    <article className="border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase text-zinc-400">Câu {index + 1}</span>
            <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              {QUESTION_TYPE_LABEL[question.type]}
            </span>
            <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              {question.points || 1} điểm
            </span>
          </div>
          <h3 className="mt-2 text-base font-semibold text-zinc-950 dark:text-white">{question.prompt}</h3>
        </div>

        {questionResult && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-bold ${
              questionResult.isCorrect
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300'
            }`}
          >
            {questionResult.isCorrect ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
            {questionResult.isCorrect ? 'Đúng' : 'Sai'}
          </span>
        )}
      </div>

      <div className="mt-4 space-y-2">
        {question.options.map((option, optionIndex) => (
          <AnswerOption
            key={`${question.questionId}-${optionIndex}`}
            question={question}
            optionText={option.text}
            optionIndex={optionIndex}
            selected={selectedIndexes.includes(optionIndex)}
            result={questionResult}
            disabled={disabled}
            onSelect={onSelect}
          />
        ))}
      </div>

      {questionResult?.explanation?.trim() && (
        <div className="mt-4 border-l-4 border-zinc-300 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-950">
          <p className="text-xs font-semibold uppercase text-zinc-400">Giải thích đáp án</p>
          <p className="mt-1 text-sm leading-6 text-zinc-700 dark:text-zinc-300">{questionResult.explanation}</p>
        </div>
      )}
    </article>
  );
}

function AnswerOption({
  question,
  optionText,
  optionIndex,
  selected,
  result,
  disabled,
  onSelect,
}: {
  question: IQuizQuestionForAttempt;
  optionText: string;
  optionIndex: number;
  selected: boolean;
  result?: IQuizAttemptQuestionResult;
  disabled: boolean;
  onSelect: (question: IQuizQuestionForAttempt, optionIndex: number, checked: boolean) => void;
}) {
  const inputType = question.type === 'MULTIPLE_CHOICE' ? 'checkbox' : 'radio';
  const correct = result?.correctOptionIndexes.includes(optionIndex) || false;
  const chosen = result?.selectedIndexes.includes(optionIndex) || selected;
  const showResult = Boolean(result);

  const resultClass = showResult
    ? correct
      ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-200'
      : chosen
        ? 'border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/20 dark:text-red-200'
        : 'border-zinc-200 bg-white text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'
    : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800';

  return (
    <label className={`flex cursor-pointer items-start gap-3 border p-3 text-sm transition-colors ${resultClass}`}>
      <input
        type={inputType}
        name={`question-${question.questionId}`}
        checked={selected}
        disabled={disabled}
        onChange={(event) => onSelect(question, optionIndex, event.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-primary disabled:cursor-not-allowed"
      />
      <span className="min-w-0 flex-1">{optionText}</span>
      {showResult && correct && <span className="text-xs font-bold">Đáp án đúng</span>}
      {showResult && chosen && !correct && <span className="text-xs font-bold">Bạn chọn</span>}
    </label>
  );
}



