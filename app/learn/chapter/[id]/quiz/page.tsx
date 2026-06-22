'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from 'plab-design-system';
import ProgressHeader from '@/components/layout/ProgressHeader';
import type { Session, DbChapter, PublicQuestion, DbUserProgress } from '@/types';

export default function QuizPage() {
  const router = useRouter();
  const params = useParams();
  const chapterId = params.id as string;

  const [session, setSession] = useState<Session | null>(null);
  const [chapter, setChapter] = useState<DbChapter | null>(null);
  const [allChapters, setAllChapters] = useState<DbChapter[]>([]);
  const [completedChapters, setCompletedChapters] = useState<number[]>([]);
  const [questions, setQuestions] = useState<PublicQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const sessionData = localStorage.getItem('session');
      if (!sessionData) {
        router.push('/');
        return;
      }

      const parsedSession: Session = JSON.parse(sessionData);
      if (!mounted) return;
      setSession(parsedSession);

      try {
        const chaptersRes = await fetch('/api/chapters/list');
        const chaptersData = await chaptersRes.json();

        if (!mounted) return;

        if (!chaptersData.success) {
          throw new Error('챕터 목록을 불러올 수 없습니다.');
        }

        const chapters: DbChapter[] = chaptersData.data;
        setAllChapters(chapters);

        const currentChapter = chapters.find((c) => c.id === chapterId);
        if (!currentChapter) {
          throw new Error('챕터를 찾을 수 없습니다.');
        }
        setChapter(currentChapter);

        const progressRes = await fetch('/api/progress/get', {
          headers: { 'X-Session-Token': parsedSession.sessionToken },
        });
        const progressData = await progressRes.json();

        if (!mounted) return;

        if (progressData.success && progressData.data.length > 0) {
          const completed = progressData.data
            .filter((p: DbUserProgress) => p.chapter_completed)
            .map((p: DbUserProgress) => {
              const ch = chapters.find((c) => c.id === p.chapter_id);
              return ch?.order || 0;
            });
          setCompletedChapters(completed);
        }

        const questionsRes = await fetch(
          `/api/questions/random?chapterId=${chapterId}`
        );
        const questionsData = await questionsRes.json();

        if (!mounted) return;

        if (!questionsData.success) {
          throw new Error(
            questionsData.error || '문제를 불러올 수 없습니다.'
          );
        }

        setQuestions(questionsData.data);
        setLoading(false);
      } catch (err: unknown) {
        if (!mounted) return;
        const message = err instanceof Error ? err.message : '알 수 없는 오류';
        setError(message);
        setLoading(false);
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [chapterId, router]);

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswerSelect = (answer: string) => {
    setAnswers({
      ...answers,
      [currentQuestion.id]: answer,
    });
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleSubmit = async () => {
    const unanswered = questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      alert(`${unanswered.length}개의 문제가 답변되지 않았습니다.`);
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/answer/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': session?.sessionToken ?? '',
        },
        body: JSON.stringify({ chapterId, answers }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      sessionStorage.setItem(
        `result_${chapterId}`,
        JSON.stringify(data.data)
      );

      router.push(`/learn/chapter/${chapterId}/result`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '답안 제출 중 오류가 발생했습니다.';
      alert(message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-surface-secondary">
        <div className="flex flex-col items-center gap-5 rounded-2xl border border-border-subtle bg-bg-surface px-12 py-10 text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-border-subtle border-t-bg-primary" />
          <p className="text-sm font-semibold text-text-secondary">문제를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !chapter || !session || questions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-surface-secondary px-5">
        <div className="w-full max-w-[480px] rounded-2xl border border-border-subtle bg-bg-surface p-8 text-center">
          <h2 className="mb-2 text-xl font-bold text-text-primary">오류</h2>
          <p className="mb-6 text-text-secondary">
            {error || '문제를 불러올 수 없습니다.'}
          </p>
          <Button
            variant="solid"
            onClick={() => router.push(`/learn/chapter/${chapterId}`)}
          >
            돌아가기
          </Button>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const optionKeys = ['option_1', 'option_2', 'option_3', 'option_4'] as const;

  return (
    <div className="min-h-screen bg-bg-surface-secondary">
      {/* ProgressHeader — 수정 금지, max-w-6xl 그대로 */}
      <ProgressHeader
        userName={session.userName}
        currentChapterOrder={chapter.order}
        totalChapters={allChapters.length}
        completedChapters={completedChapters}
        chapterName={`${chapter.order}장. ${chapter.name} - 문제 풀이`}
      />

      {/* 콘텐츠 컨테이너: 모바일 폭으로 제한 */}
      <div className="mx-auto max-w-[480px] px-5 py-5">
        <div className="rounded-2xl border border-border-subtle bg-bg-surface p-5">
          {/* 헤더: 라벨 + 문제 번호 + 네비 칩 */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-text-brand">
                Quiz
              </p>
              <h1 className="text-xl font-bold text-text-primary">
                문제 {currentQuestionIndex + 1} / {questions.length}
              </h1>
            </div>
            <div className="flex flex-wrap gap-2" role="navigation" aria-label="문제 목록">
              {questions.map((q, idx) => {
                const isAnswered = Boolean(answers[q.id]);
                const isCurrent = idx === currentQuestionIndex;
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    aria-label={`문제 ${idx + 1}${isAnswered ? ' (답변 완료)' : ''}`}
                    aria-current={isCurrent ? 'true' : undefined}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg border text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focused ${
                      isAnswered
                        ? 'border-border-success bg-bg-success text-text-success'
                        : isCurrent
                        ? 'border-border-focused bg-bg-primary text-text-on-primary'
                        : 'border-border-subtle bg-bg-surface-secondary text-text-tertiary'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 진행바 */}
          <div className="mb-6 mt-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-bg-surface-tertiary">
              <div
                className="h-full rounded-full bg-bg-primary transition-all"
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-valuenow={currentQuestionIndex + 1}
                aria-valuemin={1}
                aria-valuemax={questions.length}
                aria-label="문제 진행률"
              />
            </div>
            <p className="mt-2 text-sm font-medium text-text-secondary">
              답변 완료: {answeredCount} / {questions.length}
            </p>
          </div>

          {/* 문제 텍스트 */}
          <div className="mb-6">
            <div className="mb-5 rounded-lg border border-border-subtle bg-bg-surface-secondary p-4">
              <p className="text-base font-semibold text-text-primary whitespace-pre-wrap">
                {currentQuestion.question_text}
              </p>
            </div>

            {/* 선택지 */}
            <div className="space-y-3" role="radiogroup" aria-label="선택지">
              {(['1', '2', '3', '4'] as const).map((num, idx) => {
                const optionText = currentQuestion[optionKeys[idx]];
                if (!optionText) return null;
                const isSelected = answers[currentQuestion.id] === num;

                return (
                  <button
                    key={num}
                    onClick={() => handleAnswerSelect(num)}
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={`선택지 ${num}: ${optionText}`}
                    className={`w-full rounded-xl border px-4 py-4 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focused ${
                      isSelected
                        ? 'border-border-focused bg-bg-surface-secondary'
                        : 'border-border-default bg-bg-surface hover:border-border-strong'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                          isSelected
                            ? 'bg-bg-primary text-text-on-primary'
                            : 'bg-bg-surface-secondary text-text-secondary'
                        }`}
                        aria-hidden="true"
                      >
                        {num}
                      </div>
                      <span className="flex-1 text-sm font-medium text-text-primary">
                        {optionText}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 네비게이션 버튼 */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              aria-label="이전 문제"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              이전 문제
            </Button>

            {currentQuestionIndex < questions.length - 1 ? (
              <Button
                variant="solid"
                onClick={handleNext}
                aria-label="다음 문제"
              >
                다음 문제
                <ArrowRight size={16} aria-hidden="true" />
              </Button>
            ) : (
              <Button
                variant="solid"
                onClick={handleSubmit}
                disabled={submitting || answeredCount < questions.length}
                aria-label="답안 제출"
              >
                {submitting ? '제출 중...' : '제출하기'}
              </Button>
            )}
          </div>

          {answeredCount < questions.length && (
            <p className="mt-4 text-center text-sm text-text-secondary">
              * 모든 문제를 풀고 나면 제출할 수 있습니다
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
