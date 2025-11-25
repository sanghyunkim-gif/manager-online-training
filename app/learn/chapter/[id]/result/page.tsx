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
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-neutral-50">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(21,112,255,0.06),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(0,204,123,0.04),transparent_50%)]" />
        </div>
        <div className="relative flex flex-col items-center gap-5 rounded-xl border border-neutral-200 bg-white px-12 py-10 text-center shadow-lg">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-neutral-200 border-t-primary-500" />
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-neutral-600">
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
    <div className="relative min-h-screen overflow-hidden bg-neutral-50 pb-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(21,112,255,0.06),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(0,204,123,0.04),transparent_50%)]" />
      </div>
      <ProgressHeader
        userName={session.userName}
        currentChapterOrder={chapter.fields.Order}
        totalChapters={allChapters.length}
        completedChapters={completedChapters}
        chapterName={`${chapter.fields.Order}장. ${chapter.fields.Name} - 결과`}
      />

      <div className="relative mx-auto max-w-5xl px-6 py-8">
        <div className="rounded-xl border border-neutral-200 bg-white p-8 shadow-lg">
          {resultData.allCorrect ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-success-50 border border-success-200 text-3xl">
                ✅
              </div>
              <h1 className="text-3xl font-extrabold mb-2 text-neutral-900">축하합니다!</h1>
              <p className="text-lg text-neutral-600 mb-8">
                {chapter.fields.Order}장을 완료했습니다.
              </p>

              <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-success-200 bg-success-50 px-6 py-4">
                <span className="text-sm font-bold uppercase tracking-[0.12em] text-success-700">
                  정답
                </span>
                <span className="text-xl font-bold text-success-600">
                  {resultData.correctCount} / {resultData.totalCount}
                </span>
              </div>

              <button
                onClick={handleNext}
                className="rounded-full bg-primary-500 px-8 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-primary-600"
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
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-amber-50 border border-amber-200 text-3xl">
                  ⚠️
                </div>
                <h1 className="text-3xl font-extrabold mb-2 text-neutral-900">아쉽습니다!</h1>
                <p className="text-lg text-neutral-600 mb-4">
                  오답이 있습니다
                </p>

                <div className="inline-flex items-center gap-3 rounded-full border border-amber-200 bg-amber-50 px-6 py-4">
                  <span className="text-sm font-bold uppercase tracking-[0.12em] text-amber-700">
                    정답
                  </span>
                  <span className="text-xl font-bold text-amber-600">
                    {resultData.correctCount} / {resultData.totalCount}
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-6">
                <h2 className="text-xl font-bold mb-4 text-neutral-900">오답 문제</h2>

                <div className="space-y-6">
                  {resultData.incorrectQuestions.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-accent-200 bg-accent-50 p-6"
                    >
                      <h3 className="font-bold text-accent-700 mb-2">
                        문제 {idx + 1}
                      </h3>
                      <p className="text-sm text-neutral-900 font-medium mb-4 whitespace-pre-wrap">
                        {item.questionText}
                      </p>

                      <div className="space-y-2 mb-4 text-sm">
                        <div className="flex items-start gap-2 text-accent-700">
                          <span className="font-bold">당신의 답변:</span>
                          <span className="font-medium">
                            {item.userAnswer}. {item.options[item.userAnswer]}
                          </span>
                        </div>
                        <div className="flex items-start gap-2 text-success-700">
                          <span className="font-bold">정답:</span>
                          <span className="font-medium">
                            {item.correctAnswer}. {item.options[item.correctAnswer]}
                          </span>
                        </div>
                      </div>

                      {item.explanation && (
                        <div className="rounded-lg border border-neutral-200 bg-white p-4">
                          <p className="text-xs font-bold text-neutral-700 mb-2">
                            💡 해설:
                          </p>
                          <div className="prose prose-sm max-w-none">
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
                <p className="text-neutral-600 mb-6">
                  학습 자료를 다시 확인하고 문제를 재시도해주세요
                </p>
                <button
                  onClick={handleRetry}
                  className="rounded-full bg-primary-500 px-8 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-primary-600"
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
