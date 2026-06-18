'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { Button, Badge } from 'plab-design-system';
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
      <div className="flex min-h-screen items-center justify-center bg-bg-surface-secondary">
        <div className="flex flex-col items-center gap-5 rounded-2xl border border-border-subtle bg-bg-surface px-12 py-10 text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-border-subtle border-t-bg-primary" />
          <p className="text-sm font-semibold text-text-secondary">결과 확인 중...</p>
        </div>
      </div>
    );
  }

  if (!session || !chapter || !resultData) {
    return null;
  }

  const isLastChapter =
    allChapters.findIndex((c) => c.id === chapterId) >= allChapters.length - 1;

  return (
    <div className="min-h-screen bg-bg-surface-secondary">
      {/* ProgressHeader — 수정 금지, max-w-6xl 그대로 */}
      <ProgressHeader
        userName={session.userName}
        currentChapterOrder={chapter.order}
        totalChapters={allChapters.length}
        completedChapters={completedChapters}
        chapterName={`${chapter.order}장. ${chapter.name} - 결과`}
      />

      {/* 콘텐츠 컨테이너: 모바일 폭으로 제한 */}
      <div className="mx-auto max-w-[480px] px-5 py-5">
        {resultData.allCorrect ? (
          /* 전체 정답 */
          <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6 text-center">
            <CheckCircle2
              size={48}
              className="mx-auto mb-4 text-text-success"
              aria-hidden="true"
            />
            <h1 className="mb-2 text-2xl font-extrabold text-text-primary">
              축하합니다!
            </h1>
            <p className="mb-6 text-base text-text-secondary">
              {chapter.order}장을 완료했습니다.
            </p>

            <div className="mb-8 flex justify-center">
              <Badge tone="success" variant="soft" size="md">
                정답 {resultData.correctCount} / {resultData.totalCount}
              </Badge>
            </div>

            <Button
              variant="solid"
              className="w-full"
              onClick={handleNext}
            >
              {isLastChapter ? '완료' : '다음 챕터로'}
              <ArrowRight size={16} aria-hidden="true" />
            </Button>
          </div>
        ) : (
          /* 오답 있음 */
          <div className="flex flex-col gap-4">
            {/* 결과 헤더 카드 */}
            <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6 text-center">
              <AlertTriangle
                size={48}
                className="mx-auto mb-4 text-text-error"
                aria-hidden="true"
              />
              <h1 className="mb-2 text-2xl font-extrabold text-text-primary">
                아쉽습니다!
              </h1>
              <p className="mb-6 text-base text-text-secondary">오답이 있습니다</p>

              <div className="flex justify-center">
                <Badge tone="error" variant="soft" size="md">
                  정답 {resultData.correctCount} / {resultData.totalCount}
                </Badge>
              </div>
            </div>

            {/* 오답 목록 */}
            <div className="rounded-2xl border border-border-subtle bg-bg-surface p-5">
              <h2 className="mb-4 text-base font-bold text-text-primary">오답 문제</h2>

              <div className="space-y-4">
                {resultData.incorrectQuestions.map((item, idx) => (
                  <div
                    key={item.questionId}
                    className="rounded-xl border border-border-subtle bg-bg-surface-secondary p-4"
                  >
                    <h3 className="mb-2 font-bold text-text-primary">
                      문제 {idx + 1}
                    </h3>
                    <p className="mb-4 text-sm font-medium text-text-primary whitespace-pre-wrap">
                      {item.questionText}
                    </p>

                    <div className="mb-4 space-y-1 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="font-semibold text-text-secondary">당신의 답변:</span>
                        <span className="text-text-secondary">
                          {item.userAnswer}. {item.options[item.userAnswer]}
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-semibold text-text-secondary">정답:</span>
                        <span className="font-semibold text-text-primary">
                          {item.correctAnswer}. {item.options[item.correctAnswer]}
                        </span>
                      </div>
                    </div>

                    {item.explanation && (
                      <div className="rounded-lg border border-border-subtle bg-bg-surface p-4">
                        <p className="mb-2 text-xs font-bold text-text-secondary">
                          해설
                        </p>
                        <div className="prose prose-sm max-w-none prose-headings:text-text-primary prose-p:text-text-secondary prose-strong:text-text-primary prose-li:text-text-secondary prose-a:text-text-brand">
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

            {/* 재시도 버튼 */}
            <div className="rounded-2xl border border-border-subtle bg-bg-surface p-5 text-center">
              <p className="mb-4 text-sm text-text-secondary">
                학습 자료를 다시 확인하고 문제를 재시도해주세요
              </p>
              <Button
                variant="solid"
                className="w-full"
                onClick={handleRetry}
              >
                다시 학습하기
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
