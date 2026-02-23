'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import VideoPlayer from '@/components/ui/VideoPlayer';
import type { Session, DbChapter, DbUserProgress } from '@/types';

export default function ChapterPage() {
  const router = useRouter();
  const params = useParams();
  const chapterId = params.id as string;

  const [session, setSession] = useState<Session | null>(null);
  const [chapter, setChapter] = useState<DbChapter | null>(null);
  const [allChapters, setAllChapters] = useState<DbChapter[]>([]);
  const [completedChapters, setCompletedChapters] = useState<number[]>([]);
  const [videoCompleted, setVideoCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const init = async () => {
      const sessionData = localStorage.getItem('session');
      if (!sessionData) {
        router.push('/');
        return;
      }

      const parsedSession: Session = JSON.parse(sessionData);
      setSession(parsedSession);

      try {
        const chaptersRes = await fetch('/api/chapters/list');
        const chaptersData = await chaptersRes.json();

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

          const currentProgress = progressData.data.find(
            (p: DbUserProgress) => p.chapter_id === chapterId
          );

          if (currentProgress?.video_watched) {
            setVideoCompleted(true);
          }
        }

        setLoading(false);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : '알 수 없는 오류';
        setError(message);
        setLoading(false);
      }
    };

    init();
  }, [chapterId, router]);

  const handleProgressUpdate = async (
    watchTime: number,
    percentage: number
  ) => {
    if (!session) return;

    try {
      await fetch('/api/progress/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.userId,
          chapterId,
          watchTime,
          isWatched: percentage >= (chapter?.required_watch_percentage || 60),
        }),
      });
    } catch (err) {
      console.error('진행 상황 저장 오류:', err);
    }
  };

  const handleVideoComplete = () => {
    setVideoCompleted(true);
  };

  const handleNext = () => {
    router.push(`/learn/chapter/${chapterId}/quiz`);
  };

  if (loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#2d1b69] via-[#3b2f87] to-[#4a5ea8]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-bl from-[#5dd9d1]/30 via-[#7b9ad9]/20 to-transparent" />
          <div className="absolute bottom-0 left-0 h-1/2 w-1/2 bg-gradient-to-tr from-[#8b5cbb]/20 to-transparent" />
        </div>
        <div className="relative flex flex-col items-center gap-5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 px-12 py-10 text-center shadow-2xl">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-white/20 border-t-white" />
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-white">
            로딩 중...
          </p>
        </div>
      </div>
    );
  }

  if (error || !chapter || !session) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#2d1b69] via-[#3b2f87] to-[#4a5ea8] px-6 py-10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-bl from-[#5dd9d1]/30 via-[#7b9ad9]/20 to-transparent" />
          <div className="absolute bottom-0 left-0 h-1/2 w-1/2 bg-gradient-to-tr from-[#8b5cbb]/20 to-transparent" />
        </div>
        <div className="relative mx-auto max-w-xl rounded-xl bg-white/10 backdrop-blur-md border border-white/20 p-8 text-center shadow-2xl">
          <h2 className="text-xl font-bold mb-2 text-white">오류</h2>
          <p className="mb-6 text-white/80">
            {error || '페이지를 불러올 수 없습니다.'}
          </p>
          <button
            onClick={() => router.push('/learn')}
            className="rounded-full bg-gradient-to-r from-[#3b82f6] to-[#2563eb] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.02]"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  const handleExit = () => {
    if (
      confirm(
        '학습을 종료하시겠습니까? 진행 상황은 자동으로 저장됩니다.'
      )
    ) {
      localStorage.removeItem('session');
      router.push('/');
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#2d1b69] via-[#3b2f87] to-[#4a5ea8] pb-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-bl from-[#5dd9d1]/30 via-[#7b9ad9]/20 to-transparent" />
        <div className="absolute bottom-0 left-0 h-1/2 w-1/2 bg-gradient-to-tr from-[#8b5cbb]/20 to-transparent" />
      </div>

      {/* Top Header */}
      <div className="relative border-b border-white/10 bg-white/5 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <img src="/logo.png" alt="플랩" className="h-8 brightness-0 invert" />
          <div className="flex items-center gap-3 text-xs">
            <span className="rounded-full bg-white/10 border border-white/20 px-3 py-1.5 font-semibold text-white">
              {session.userName}님
            </span>
            <button
              onClick={handleExit}
              className="rounded-full border border-white/20 bg-white/5 px-3 py-1.5 font-semibold text-white transition hover:bg-white/10"
            >
              나가기
            </button>
          </div>
        </div>
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Left: Video and Content */}
          <div className="space-y-6">
            <div className="rounded-xl border border-neutral-200 bg-white p-8 shadow-lg">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-primary-600 font-bold">
                    Chapter {chapter.order}
                  </p>
                  <h1 className="text-3xl font-bold text-neutral-900">
                    {chapter.order}장. {chapter.name}
                  </h1>
                </div>
                <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-700">
                  영상 & 자료
                </span>
              </div>
              <div className="my-6 h-px bg-neutral-200" />

              <VideoPlayer
                url={chapter.video_url}
                videoDuration={chapter.video_duration}
                requiredPercentage={
                  chapter.required_watch_percentage || 60
                }
                onProgressUpdate={handleProgressUpdate}
                onComplete={handleVideoComplete}
              />

              {chapter.description && (
                <div className="mt-8">
                  <h2 className="text-xl font-bold text-neutral-900 mb-4">
                    학습 자료
                  </h2>
                  <div className="prose prose-sm max-w-none rounded-lg border border-neutral-200 bg-neutral-50 p-6">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {chapter.description}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleNext}
                  disabled={!videoCompleted}
                  className={`rounded-full px-6 py-3 text-sm font-bold transition ${
                    videoCompleted
                      ? 'bg-primary-500 text-white shadow-lg hover:bg-primary-600'
                      : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                  }`}
                >
                  다음 (문제풀이) →
                </button>
              </div>

              {!videoCompleted && (
                <p className="mt-2 text-right text-sm text-neutral-600">
                  영상을 {chapter.required_watch_percentage || 60}% 이상
                  시청해야 다음으로 넘어갈 수 있습니다
                </p>
              )}
            </div>
          </div>

          {/* Right: Progress Sidebar */}
          <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-md p-6 shadow-2xl lg:sticky lg:top-24 lg:self-start">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.14em] text-white/60 font-bold mb-1">
                학습 진행 상황
              </p>
              <h2 className="text-lg font-bold text-white">
                챕터 진행도
              </h2>
            </div>

            <div className="space-y-3">
              {allChapters.map((ch) => {
                const chapterNum = ch.order;
                const isCompleted = completedChapters.includes(chapterNum);
                const isCurrent = chapterNum === chapter.order;

                return (
                  <div
                    key={ch.id}
                    className={`flex items-center gap-3 rounded-lg p-3 transition ${
                      isCurrent
                        ? 'bg-white/20 border border-white/30'
                        : 'bg-white/5 border border-white/10'
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border text-sm font-bold ${
                        isCompleted
                          ? 'border-success-300 bg-success-500 text-white'
                          : isCurrent
                          ? 'border-primary-300 bg-primary-500 text-white'
                          : 'border-white/20 bg-white/10 text-white/40'
                      }`}
                    >
                      {isCompleted ? '✓' : chapterNum}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate ${
                        isCurrent ? 'text-white' : 'text-white/70'
                      }`}>
                        {chapterNum}장. {ch.name}
                      </p>
                      <p className="text-xs text-white/50">
                        {isCompleted ? '완료' : isCurrent ? '진행 중' : '대기'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/70">전체 진행률</span>
                <span className="font-bold text-white">
                  {Math.round((completedChapters.length / allChapters.length) * 100)}%
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-success-400 to-success-500 transition-all"
                  style={{
                    width: `${(completedChapters.length / allChapters.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
