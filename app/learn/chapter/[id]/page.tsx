'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowRight, Check } from 'lucide-react';
import { Button, Badge, Divider } from 'plab-design-system';
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

        const progressRes = await fetch('/api/progress/get', {
          headers: { 'X-Session-Token': parsedSession.sessionToken },
        });
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

  const handleProgressUpdate = async (watchTime: number) => {
    if (!session) return;

    try {
      await fetch('/api/progress/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': session.sessionToken,
        },
        body: JSON.stringify({ chapterId, watchTime }),
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
      <div className="mx-auto flex min-h-screen max-w-[480px] flex-col items-center justify-center bg-bg-surface-secondary px-5">
        <div className="flex flex-col items-center gap-5 rounded-2xl border border-border-subtle bg-bg-surface px-12 py-10 text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-border-subtle border-t-bg-primary" />
          <p className="text-sm font-semibold text-text-secondary">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error || !chapter || !session) {
    return (
      <div className="mx-auto flex min-h-screen max-w-[480px] flex-col items-center justify-center bg-bg-surface-secondary px-5">
        <div className="w-full rounded-2xl border border-border-subtle bg-bg-surface p-8 text-center">
          <h2 className="mb-2 text-xl font-bold text-text-primary">오류</h2>
          <p className="mb-6 text-text-secondary">
            {error || '페이지를 불러올 수 없습니다.'}
          </p>
          <Button variant="solid" onClick={() => router.push('/learn')}>
            돌아가기
          </Button>
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

  const progressPercent =
    allChapters.length > 0
      ? Math.round((completedChapters.length / allChapters.length) * 100)
      : 0;

  return (
    <div className="mx-auto flex min-h-screen max-w-[480px] flex-col bg-bg-surface-secondary">
      {/* 헤더 */}
      <header className="sticky top-0 z-20 border-b border-border-subtle bg-bg-surface">
        <div className="flex items-center justify-between px-5 py-3">
          <img src="/logo.png" alt="PLAB Manager" className="h-7" />
          <div className="flex items-center gap-2">
            <Badge tone="brand" variant="soft">
              {session.userName}님
            </Badge>
            <Button variant="ghost" onClick={handleExit}>
              나가기
            </Button>
          </div>
        </div>
      </header>

      <main className="flex flex-col gap-4 px-5 py-5">
        {/* 챕터 제목 카드 */}
        <div className="rounded-2xl border border-border-subtle bg-bg-surface p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-text-brand">
                Chapter {chapter.order}
              </p>
              <h1 className="text-xl font-bold text-text-primary">
                {chapter.order}장. {chapter.name}
              </h1>
            </div>
            <Badge tone="neutral" variant="soft">
              영상 &amp; 자료
            </Badge>
          </div>

          <Divider className="my-4" />

          {/* VideoPlayer — props 보존 */}
          <VideoPlayer
            url={chapter.video_url}
            videoDuration={chapter.video_duration}
            requiredPercentage={chapter.required_watch_percentage || 60}
            onProgressUpdate={handleProgressUpdate}
            onComplete={handleVideoComplete}
          />

          {/* 학습 자료 */}
          {chapter.description && (
            <div className="mt-6">
              <h2 className="mb-3 text-base font-bold text-text-primary">
                학습 자료
              </h2>
              <div className="rounded-lg border border-border-subtle bg-bg-surface-secondary p-4">
                <div className="prose prose-sm max-w-none prose-headings:text-text-primary prose-p:text-text-secondary prose-strong:text-text-primary prose-li:text-text-secondary prose-a:text-text-brand">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {chapter.description}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          )}

          {/* 다음 버튼 */}
          <div className="mt-6">
            {videoCompleted ? (
              <Button
                variant="solid"
                className="w-full"
                onClick={handleNext}
              >
                다음 (문제풀이)
                <ArrowRight size={16} aria-hidden="true" />
              </Button>
            ) : (
              <>
                <Button
                  variant="solid"
                  className="w-full"
                  disabled
                  aria-disabled="true"
                >
                  다음 (문제풀이)
                  <ArrowRight size={16} aria-hidden="true" />
                </Button>
                <p className="mt-2 text-center text-sm text-text-secondary">
                  영상을 {chapter.required_watch_percentage || 60}% 이상
                  시청해야 다음으로 넘어갈 수 있습니다
                </p>
              </>
            )}
          </div>
        </div>

        {/* 진행 사이드바 — 세로 스택 */}
        <div className="rounded-2xl border border-border-subtle bg-bg-surface p-5">
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-text-secondary">
            학습 진행 상황
          </p>
          <h2 className="mb-4 text-base font-bold text-text-primary">챕터 진행도</h2>

          <div className="space-y-2">
            {allChapters.map((ch) => {
              const chapterNum = ch.order;
              const isCompleted = completedChapters.includes(chapterNum);
              const isCurrent = chapterNum === chapter.order;

              return (
                <div
                  key={ch.id}
                  className="flex items-center gap-3 rounded-xl border border-border-subtle p-3"
                >
                  <div
                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border text-sm font-bold ${
                      isCompleted
                        ? 'border-border-success bg-bg-success text-text-success'
                        : isCurrent
                        ? 'border-border-focused bg-bg-primary text-text-on-primary'
                        : 'border-border-subtle bg-bg-surface-secondary text-text-tertiary'
                    }`}
                    aria-label={
                      isCompleted
                        ? `${chapterNum}장 완료`
                        : isCurrent
                        ? `${chapterNum}장 진행 중`
                        : `${chapterNum}장 대기`
                    }
                  >
                    {isCompleted ? (
                      <Check size={16} aria-hidden="true" />
                    ) : (
                      chapterNum
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-sm font-semibold ${
                        isCurrent ? 'text-text-primary' : 'text-text-secondary'
                      }`}
                    >
                      {chapterNum}장. {ch.name}
                    </p>
                    <p className="text-xs text-text-tertiary">
                      {isCompleted ? '완료' : isCurrent ? '진행 중' : '대기'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 border-t border-border-subtle pt-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-text-secondary">전체 진행률</span>
              <span className="font-bold text-text-primary">{progressPercent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-bg-surface-tertiary">
              <div
                className="h-full rounded-full bg-[var(--text-success)] transition-all"
                style={{ width: `${progressPercent}%` }}
                role="progressbar"
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="전체 진행률"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
