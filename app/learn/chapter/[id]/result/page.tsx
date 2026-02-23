'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ProgressHeader from '@/components/layout/ProgressHeader';
import type { Session, DbChapter, DbUserProgress } from '@/types';

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
  const [chapter, setChapter] = useState<DbChapter | null>(null);
  const [allChapters, setAllChapters] = useState<DbChapter[]>([]);
  const [completedChapters, setCompletedChapters] = useState<number[]>([]);
  const [resultData, setResultData] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const sessionData = localStorage.getItem('session');
      if (!sessionData) {
        router.push('/');
        return;
      }

      const parsedSession: Session = JSON.parse(sessionData);
      setSession(parsedSession);

      const resultStr = sessionStorage.getItem(`result_${chapterId}`);
      if (!resultStr) {
        router.push(`/learn/chapter/${chapterId}/quiz`);
        return;
      }

      const result: ResultData = JSON.parse(resultStr);
      setResultData(result);

      const chaptersRes = await fetch('/api/chapters/list');
      const chaptersData = await chaptersRes.json();

      if (chaptersData.success) {
        const chapters: DbChapter[] = chaptersData.data;
        setAllChapters(chapters);

        const currentChapter = chapters.find((c) => c.id === chapterId);
        if (currentChapter) {
          setChapter(currentChapter);
        }

        const progressRes = await fetch(
          `/api/progress/get?userId=${parsedSession.userId}`
        );
        const progressData = await progressRes.json();

        if (progressData.success && progressData.data.length > 0) {
          const completed = progressData.data
            .filter((p: DbUserProgress) => p.chapter_completed)
            .map((p: DbUserProgress) => {
              const ch = chapters.find((c) => c.id === p.chapter_id);
              return ch?.order || 0;
            });
          setCompletedChapters(completed);
        }
      }

      setLoading(false);
    };

    init();
  }, [chapterId, router]);

  const handleRetry = () => {
    sessionStorage.removeItem(`result_${chapterId}`);
    router.push(`/learn/chapter/${chapterId}/quiz`);
  };

  const handleNext = async () => {
    if (!session || !allChapters.length) return;

    await fetch('/api/progress/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: session.userId,
        chapterId,
      }),
    });

    sessionStorage.removeItem(`result_${chapterId}`);

    const currentChapterIndex = allChapters.findIndex((c) => c.id === chapterId);
    if (currentChapterIndex < allChapters.length - 1) {
      const nextChapter = allChapters[currentChapterIndex + 1];
      router.push(`/learn/chapter/${nextChapter.id}`);
    } else {
      router.push('/complete');
    }
  };

  if (loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#2d1b69] via-[#3b2f87] to-[#4a5ea8]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-bl from-[#5dd9d1]/30 via-[#7b9ad9]/20 to-transparent" />
          <div className="absolute bottom-0 left-0 h-1/2 w-1/2 bg-gradient-to-tr from-[#8b5cbb]/20 to-transparent" />
        </div>
        <div className="relative flex flex-col items-center gap-5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 px-12 py-10 text-center shadow-lg">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-white/20 border-t-white" />
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-white">
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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#2d1b69] via-[#3b2f87] to-[#4a5ea8] pb-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-bl from-[#5dd9d1]/30 via-[#7b9ad9]/20 to-transparent" />
        <div className="absolute bottom-0 left-0 h-1/2 w-1/2 bg-gradient-to-tr from-[#8b5cbb]/20 to-transparent" />
      </div>
      <ProgressHeader
        userName={session.userName}
        currentChapterOrder={chapter.order}
        totalChapters={allChapters.length}
        completedChapters={completedChapters}
        chapterName={`${chapter.order}장. ${chapter.name} - 결과`}
      />

      <div className="relative mx-auto max-w-5xl px-6 py-8">
        <div className="rounded-xl bg-white/10 backdrop-blur-md border border-white/20 p-8 shadow-lg">
          {resultData.allCorrect ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-3xl">
                ✅
              </div>
              <h1 className="text-3xl font-extrabold mb-2 text-white">축하합니다!</h1>
              <p className="text-lg text-white mb-8">
                {chapter.order}장을 완료했습니다.
              </p>

              <div className="mb-8 inline-flex items-center gap-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-6 py-4">
                <span className="text-sm font-bold uppercase tracking-[0.12em] text-white">
                  정답
                </span>
                <span className="text-xl font-bold text-white">
                  {resultData.correctCount} / {resultData.totalCount}
                </span>
              </div>

              <button
                onClick={handleNext}
                className="rounded-full bg-gradient-to-r from-[#3b82f6] to-[#2563eb] shadow-lg shadow-blue-500/25 px-8 py-4 text-lg font-bold text-white transition hover:opacity-90"
              >
                {allChapters.findIndex((c) => c.id === chapterId) <
                allChapters.length - 1
                  ? '다음 챕터로 →'
                  : '완료 →'}
              </button>
            </div>
          ) : (
            <div>
              <div className="text-center mb-8">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-3xl">
                  ⚠️
                </div>
                <h1 className="text-3xl font-extrabold mb-2 text-white">아쉽습니다!</h1>
                <p className="text-lg text-white mb-4">
                  오답이 있습니다
                </p>

                <div className="inline-flex items-center gap-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-6 py-4">
                  <span className="text-sm font-bold uppercase tracking-[0.12em] text-white">
                    정답
                  </span>
                  <span className="text-xl font-bold text-white">
                    {resultData.correctCount} / {resultData.totalCount}
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-white/10 backdrop-blur-md border border-white/20 p-6">
                <h2 className="text-xl font-bold mb-4 text-white">오답 문제</h2>

                <div className="space-y-6">
                  {resultData.incorrectQuestions.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg bg-white/10 backdrop-blur-md border border-white/20 p-6"
                    >
                      <h3 className="font-bold text-white mb-2">
                        문제 {idx + 1}
                      </h3>
                      <p className="text-sm text-white font-medium mb-4 whitespace-pre-wrap">
                        {item.questionText}
                      </p>

                      <div className="space-y-2 mb-4 text-sm">
                        <div className="flex items-start gap-2 text-white">
                          <span className="font-bold">당신의 답변:</span>
                          <span className="font-medium">
                            {item.userAnswer}. {item.options[item.userAnswer]}
                          </span>
                        </div>
                        <div className="flex items-start gap-2 text-white">
                          <span className="font-bold">정답:</span>
                          <span className="font-medium">
                            {item.correctAnswer}. {item.options[item.correctAnswer]}
                          </span>
                        </div>
                      </div>

                      {item.explanation && (
                        <div className="rounded-lg bg-white/10 backdrop-blur-md border border-white/20 p-4">
                          <p className="text-xs font-bold text-white mb-2">
                            해설:
                          </p>
                          <div className="prose prose-sm max-w-none text-white">
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
                <p className="text-white mb-6">
                  학습 자료를 다시 확인하고 문제를 재시도해주세요
                </p>
                <button
                  onClick={handleRetry}
                  className="rounded-full bg-gradient-to-r from-[#3b82f6] to-[#2563eb] shadow-lg shadow-blue-500/25 px-8 py-4 text-lg font-bold text-white transition hover:opacity-90"
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
