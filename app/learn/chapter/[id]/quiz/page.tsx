'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProgressHeader from '@/components/layout/ProgressHeader';
import type {
  Session,
  AirtableRecord,
  Chapter,
  Question,
} from '@/types';

export default function QuizPage() {
  const router = useRouter();
  const params = useParams();
  const chapterId = params.id as string;

  const [session, setSession] = useState<Session | null>(null);
  const [chapter, setChapter] = useState<AirtableRecord<Chapter> | null>(
    null
  );
  const [allChapters, setAllChapters] = useState<AirtableRecord<Chapter>[]>(
    []
  );
  const [completedChapters, setCompletedChapters] = useState<number[]>([]);
  const [questions, setQuestions] = useState<AirtableRecord<Question>[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      // 세션 확인
      const sessionData = localStorage.getItem('session');
      if (!sessionData) {
        router.push('/');
        return;
      }

      const parsedSession: Session = JSON.parse(sessionData);
      if (!mounted) return;
      setSession(parsedSession);

      try {
        // 챕터 목록 가져오기
        const chaptersRes = await fetch('/api/chapters/list');
        const chaptersData = await chaptersRes.json();

        if (!mounted) return;

        if (!chaptersData.success) {
          throw new Error('챕터 목록을 불러올 수 없습니다.');
        }

        const chapters: AirtableRecord<Chapter>[] = chaptersData.data;
        setAllChapters(chapters);

        // 현재 챕터 찾기
        const currentChapter = chapters.find((c) => c.id === chapterId);
        if (!currentChapter) {
          throw new Error('챕터를 찾을 수 없습니다.');
        }
        setChapter(currentChapter);

        // 진행 상황 가져오기
        const progressRes = await fetch(
          `/api/progress/get?userId=${parsedSession.userId}`
        );
        const progressData = await progressRes.json();

        if (!mounted) return;

        if (progressData.success && progressData.data.length > 0) {
          const completed = progressData.data
            .filter((p: any) => p.fields.Chapter_Completed)
            .map((p: any) => {
              const chapterLink = p.fields.Chapter[0];
              const chapter = chapters.find((c) => c.id === chapterLink);
              return chapter?.fields.Order || 0;
            });
          setCompletedChapters(completed);
        }

        // 문제 가져오기
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
      } catch (err: any) {
        console.error('초기화 오류:', err);
        if (!mounted) return;
        setError(err.message);
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
    // 모든 문제에 답했는지 확인
    const unanswered = questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      alert(`${unanswered.length}개의 문제가 답변되지 않았습니다.`);
      return;
    }

    setSubmitting(true);

    try {
      // 답안 제출
      const response = await fetch('/api/answer/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session?.userId,
          chapterId,
          answers,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      // 결과 데이터를 sessionStorage에 저장
      sessionStorage.setItem(
        `result_${chapterId}`,
        JSON.stringify(data.data)
      );

      // 결과 페이지로 이동
      router.push(`/learn/chapter/${chapterId}/result`);
    } catch (err: any) {
      alert(err.message || '답안 제출 중 오류가 발생했습니다.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(56,189,248,0.12),transparent_35%),radial-gradient(circle_at_82%_0%,rgba(34,197,94,0.12),transparent_30%)]" />
        </div>
        <div className="relative flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-white/5 px-10 py-8 text-center shadow-2xl backdrop-blur">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/30 border-t-emerald-300" />
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-100">
            문제를 불러오는 중...
          </p>
        </div>
      </div>
    );
  }

  if (error || !chapter || !session || questions.length === 0) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-slate-950 px-6 py-10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-white shadow-2xl backdrop-blur">
          <div className="mb-3 text-3xl">⚠️</div>
          <h2 className="text-xl font-bold mb-2">오류</h2>
          <p className="mb-6 text-slate-200/80">
            {error || '문제를 불러올 수 없습니다.'}
          </p>
          <button
            onClick={() => router.push(`/learn/chapter/${chapterId}`)}
            className="rounded-2xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg transition hover:opacity-95"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 pb-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(56,189,248,0.12),transparent_35%),radial-gradient(circle_at_82%_0%,rgba(34,197,94,0.12),transparent_30%)]" />
      </div>
      <ProgressHeader
        userName={session.userName}
        currentChapterOrder={chapter.fields.Order}
        totalChapters={allChapters.length}
        completedChapters={completedChapters}
        chapterName={`${chapter.fields.Order}장. ${chapter.fields.Name} - 문제 풀이`}
      />

      <div className="relative mx-auto max-w-5xl px-6 py-8">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-emerald-200">
                Quiz
              </p>
              <h1 className="text-2xl font-bold text-white">
                문제 {currentQuestionIndex + 1} / {questions.length}
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              {questions.map((_, idx) => (
                <div
                  key={idx}
                  className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-semibold ${
                    answers[questions[idx].id]
                      ? 'bg-emerald-500/30 text-emerald-50 border border-emerald-300/40'
                      : idx === currentQuestionIndex
                      ? 'bg-cyan-500/25 text-cyan-50 border border-cyan-300/40'
                      : 'border border-white/10 bg-white/5 text-slate-200'
                  }`}
                >
                  {idx + 1}
                </div>
              ))}
            </div>
          </div>

          <div className="mb-8 mt-4">
            <div className="w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 transition-all"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="mt-2 text-sm text-slate-300/80">
              답변 완료: {answeredCount} / {questions.length}
            </p>
          </div>

          <div className="mb-8">
            <div className="mb-6 rounded-2xl border border-white/10 bg-slate-900/60 p-6">
              <p className="text-lg font-semibold text-white whitespace-pre-wrap">
                {currentQuestion.fields.Question_Text}
              </p>
            </div>

            <div className="space-y-3">
              {(['1', '2', '3', '4'] as const).map((num) => {
                const optionText =
                  currentQuestion.fields[`Option_${num}` as keyof Question];
                const isSelected = answers[currentQuestion.id] === num;

                return (
                  <button
                    key={num}
                    onClick={() => handleAnswerSelect(num)}
                    className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                      isSelected
                        ? 'border-emerald-300/60 bg-emerald-500/15 text-white shadow-[0_0_0_1px_rgba(16,185,129,0.2)]'
                        : 'border-white/10 bg-white/5 text-slate-100 hover:border-cyan-300/50 hover:bg-cyan-500/10'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                          isSelected
                            ? 'bg-emerald-400 text-slate-950'
                            : 'bg-white/10 text-slate-200'
                        }`}
                      >
                        {num}
                      </div>
                      <span className="flex-1 text-sm">{optionText as string}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className={`rounded-2xl px-6 py-3 text-sm font-bold transition ${
                currentQuestionIndex === 0
                  ? 'cursor-not-allowed border border-white/10 bg-white/5 text-slate-500'
                  : 'border border-white/10 bg-white/5 text-white hover:border-emerald-300/50 hover:text-emerald-100'
              }`}
            >
              ← 이전 문제
            </button>

            {currentQuestionIndex < questions.length - 1 ? (
              <button
                onClick={handleNext}
                className="rounded-2xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg transition hover:opacity-95"
              >
                다음 문제 →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting || answeredCount < questions.length}
                className={`rounded-2xl px-6 py-3 text-sm font-bold transition ${
                  submitting || answeredCount < questions.length
                    ? 'cursor-not-allowed border border-white/10 bg-white/5 text-slate-500'
                    : 'bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 text-slate-950 shadow-lg hover:opacity-95'
                }`}
              >
                {submitting ? '제출 중...' : '제출하기'}
              </button>
            )}
          </div>

          {answeredCount < questions.length && (
            <p className="mt-4 text-center text-sm text-slate-300/80">
              * 모든 문제를 풀고 나면 제출할 수 있습니다
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
