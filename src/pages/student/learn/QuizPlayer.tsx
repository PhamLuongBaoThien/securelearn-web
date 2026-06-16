import { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, HelpCircle, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  useLearningQuiz,
  useStartQuizAttempt,
  useSubmitQuizAttempt,
} from '@/hooks/useCourseLearning';
import type {
  ILesson,
  IQuizAttempt,
  IQuizAttemptQuestionResult,
  IQuizAttemptResult,
  IQuizForAttempt,
  IQuizQuestion,
  IQuizQuestionForAttempt,
  QuizAttemptAnswerPayload,
} from '@/services/courseApi';

type SelectedAnswers = Record<string, number[]>;

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

export function QuizPlayer({ courseId, lesson }: { courseId: string; lesson: ILesson }) {
  const lessonId = lesson._id || '';
  const quizQuery = useLearningQuiz(courseId, lessonId, lesson.type === 'QUIZ');
  const quiz = quizQuery.data;
  const [attempt, setAttempt] = useState<IQuizAttempt | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<SelectedAnswers>({});
  const [result, setResult] = useState<IQuizAttemptResult | null>(null);

  const startAttempt = useStartQuizAttempt(courseId, lessonId, quiz?._id || '');
  const submitAttempt = useSubmitQuizAttempt(courseId, lessonId, quiz?._id || '', attempt?._id || '');

  const answeredCount = useMemo(() => {
    if (!quiz) return 0;
    return quiz.questions.filter((question) => (selectedAnswers[question.questionId || ''] || []).length > 0).length;
  }, [quiz, selectedAnswers]);

  const allAnswered = Boolean(quiz?.questions.length) && answeredCount === quiz?.questions.length;

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
    if (!quiz) return;
    const startedAttempt = await startAttempt.mutateAsync();
    setAttempt(startedAttempt);
    setSelectedAnswers({});
    setResult(null);
  };

  const handleSubmit = async () => {
    if (!quiz || !attempt) return;
    const submittedResult = await submitAttempt.mutateAsync(normalizeAnswers(quiz, selectedAnswers));
    setResult(submittedResult);
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

          {!attempt && !result && (
            <Button onClick={handleStart} disabled={startAttempt.isPending} className="gap-2">
              {startAttempt.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Bắt đầu làm bài
            </Button>
          )}
        </div>
      </div>

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
