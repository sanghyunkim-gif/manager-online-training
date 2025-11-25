'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ProgressHeader from '@/components/layout/ProgressHeader';
import type { Session, AirtableRecord, Chapter } from '@/types';

interface ResultData {
  allCorrect: boolean;
  correctCount: number;
  totalCount: number;
  incorrectQuestions: Array<{
    questionId: string;
    userAnswer: string;
    correctAnswer: string;
    questionText: string;
    explanation?: string;
    options: { [key: string]: string };
  }>;
}

export default function ResultPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const chapterId = params.id as string;

  const [session, setSession] = useState<Session | null>(null);
  const [chapter, setChapter] = useState<AirtableRecord<Chapter> | null>(null);
  const [allChapters, setAllChapters] = useState<AirtableRecord<Chapter>[]>([]);
  const [completedChapters, setCompletedChapters] = useState<number[]>([]);
  const [resultData, setResultData] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      // 세션 확인
      const sessionData = localStorage.getItem('session');
      if (!sessionData) {
        router.push('/');
        return;
      }

      const parsedSession: Session = JSON.parse(sessionData);
      setSession(parsedSession);

      // 결과 데이터 확인
      const resultStr = sessionStorage.getItem(`result_${chapterId}`);
      if (!resultStr) {
        // 결과가 없으면 퀴즈 페이지로
        router.push(`/learn/chapter/${chapterId}/quiz`);
        return;
      }

      const result: ResultData = JSON.parse(resultStr);
      setResultData(result);

      // 챕터 정보 가져오기
      const chaptersRes = await fetch('/api/chapters/list');
      const chaptersData = await chaptersRes.json();

      if (chaptersData.success) {
        const chapters: AirtableRecord<Chapter>[] = chaptersData.data;
        setAllChapters(chapters);

        const currentChapter = chapters.find((c) => c.id === chapterId);
        if (currentChapter) {
          setChapter(currentChapter);
        }

        // 진행 상황 가져오기
        const progressRes = await fetch(
          `/api/progress/get?userId=${parsedSession.userId}`
        );
        const progressData = await progressRes.json();

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
      }

      setLoading(false);
    };

    init();
  }, [chapterId, router]);

  const handleRetry = () => {
    // 결과 데이터 삭제
    sessionStorage.removeItem(`result_${chapterId}`);
    // 챕터 학습 페이지로 (영상은 재시청 불필요)
    router.push(`/learn/chapter/${chapterId}/quiz`);
  };

  const handleNext = async () => {
    if (!session || !allChapters.length) return;

    // 챕터 완료 처리
    await fetch('/api/progress/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: session.userId,
        chapterId,
      }),
    });

    // 결과 데이터 삭제
    sessionStorage.removeItem(`result_${chapterId}`);

    // 다음 챕터 찾기
    const currentChapterIndex = allChapters.findIndex((c) => c.id === chapterId);
    if (currentChapterIndex < allChapters.length - 1) {
      const nextChapter = allChapters[currentChapterIndex + 1];
      router.push(`/learn/chapter/${nextChapter.id}`);
    } else {
      // 마지막 챕터면 완료 페이지로
      router.push('/complete');
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
            결과 확인 중...
          </p>
        </div>
      </div>
    );
  }

  if (!session || !chapter || !resultData) {
    return null;
  }

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
        chapterName={`${chapter.fields.Order}장. ${chapter.fields.Name} - 결과`}
      />

      <div className="relative mx-auto max-w-5xl px-6 py-8">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
          {resultData.allCorrect ? (
            <div className="text-center text-white">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-3xl">
                ✅
              </div>
              <h1 className="text-3xl font-extrabold mb-2">축하합니다!</h1>
              <p className="text-lg text-slate-200/80 mb-8">
                {chapter.fields.Order}장을 완료했습니다.
              </p>

              <div className="mb-8 inline-flex items-center gap-3 rounded-2xl border border-emerald-300/40 bg-emerald-500/10 px-6 py-4 text-emerald-50">
                <span className="text-sm font-semibold uppercase tracking-[0.12em]">
                  정답
                </span>
                <span className="text-xl font-bold">
                  {resultData.correctCount} / {resultData.totalCount}
                </span>
              </div>

              <button
                onClick={handleNext}
                className="rounded-2xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 px-8 py-4 text-lg font-bold text-slate-950 shadow-lg transition hover:opacity-95"
              >
                {allChapters.findIndex((c) => c.id === chapterId) <
                allChapters.length - 1
                  ? '다음 챕터로 →'
                  : '완료 →'}
              </button>
            </div>
          ) : (
            <div className="text-white">
              <div className="text-center mb-8">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-3xl">
                  ⚠️
                </div>
                <h1 className="text-3xl font-extrabold mb-2">아쉽습니다!</h1>
                <p className="text-lg text-slate-200/80 mb-4">
                  오답이 있습니다
                </p>

                <div className="inline-flex items-center gap-3 rounded-2xl border border-amber-300/40 bg-amber-500/10 px-6 py-4 text-amber-50">
                  <span className="text-sm font-semibold uppercase tracking-[0.12em]">
                    정답
                  </span>
                  <span className="text-xl font-bold">
                    {resultData.correctCount} / {resultData.totalCount}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <h2 className="text-xl font-bold mb-4 text-white">오답 문제</h2>

                <div className="space-y-6">
                  {resultData.incorrectQuestions.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-rose-300/30 bg-rose-500/10 p-6"
                    >
                      <h3 className="font-semibold text-rose-50 mb-2">
                        문제 {idx + 1}
                      </h3>
                      <p className="text-sm text-white/90 mb-4 whitespace-pre-wrap">
                        {item.questionText}
                      </p>

                      <div className="space-y-2 mb-4 text-sm">
                        <div className="flex items-start gap-2 text-rose-50">
                          <span className="font-semibold">당신의 답변:</span>
                          <span>
                            {item.userAnswer}. {item.options[item.userAnswer]}
                          </span>
                        </div>
                        <div className="flex items-start gap-2 text-emerald-100">
                          <span className="font-semibold">정답:</span>
                          <span>
                            {item.correctAnswer}. {item.options[item.correctAnswer]}
                          </span>
                        </div>
                      </div>

                      {item.explanation && (
                        <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
                          <p className="text-xs font-semibold text-slate-100 mb-2">
                            💡 해설:
                          </p>
                          <div className="prose prose-invert prose-sm max-w-none text-slate-100/90">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {item.explanation}
                            </ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 text-center">
                <p className="text-slate-200/80 mb-6">
                  학습 자료를 다시 확인하고 문제를 재시도해주세요
                </p>
                <button
                  onClick={handleRetry}
                  className="rounded-2xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 px-8 py-4 text-lg font-bold text-slate-950 shadow-lg transition hover:opacity-95"
                >
                  다시 학습하기
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
