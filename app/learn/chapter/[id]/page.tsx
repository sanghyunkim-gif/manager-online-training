'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ProgressHeader from '@/components/layout/ProgressHeader';
import VideoPlayer from '@/components/ui/VideoPlayer';
import type { Session, AirtableRecord, Chapter } from '@/types';

export default function ChapterPage() {
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
  const [videoCompleted, setVideoCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

      try {
        // 챕터 목록 가져오기
        const chaptersRes = await fetch('/api/chapters/list');
        const chaptersData = await chaptersRes.json();

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

        if (progressData.success && progressData.data.length > 0) {
          const completed = progressData.data
            .filter((p: any) => p.fields.Chapter_Completed)
            .map((p: any) => {
              const chapterLink = p.fields.Chapter[0];
              const chapter = chapters.find((c) => c.id === chapterLink);
              return chapter?.fields.Order || 0;
            });
          setCompletedChapters(completed);

          // 현재 챕터의 진행 상황 확인
          const currentProgress = progressData.data.find(
            (p: any) => p.fields.Chapter[0] === chapterId
          );

          if (currentProgress?.fields.Video_Watched) {
            setVideoCompleted(true);
          }
        }

        setLoading(false);
      } catch (err: any) {
        console.error('초기화 오류:', err);
        setError(err.message);
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
          isWatched: percentage >= (chapter?.fields.Required_Watch_Percentage || 60),
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
    // 문제 풀이 페이지로 이동
    router.push(`/learn/chapter/${chapterId}/quiz`);
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
            로딩 중...
          </p>
        </div>
      </div>
    );
  }

  if (error || !chapter || !session) {
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
            {error || '페이지를 불러올 수 없습니다.'}
          </p>
          <button
            onClick={() => router.push('/learn')}
            className="rounded-2xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg transition hover:opacity-95"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
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
        chapterName={`${chapter.fields.Order}장. ${chapter.fields.Name}`}
      />

      <div className="relative mx-auto max-w-5xl px-6 py-8">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-emerald-200">
                Chapter {chapter.fields.Order}
              </p>
              <h1 className="text-3xl font-bold text-white">
                {chapter.fields.Order}장. {chapter.fields.Name}
              </h1>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-200">
              영상 & 자료
            </span>
          </div>
          <div className="my-6 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <VideoPlayer
            url={chapter.fields.Video_URL}
            videoDuration={chapter.fields.Video_Duration}
            requiredPercentage={
              chapter.fields.Required_Watch_Percentage || 60
            }
            onProgressUpdate={handleProgressUpdate}
            onComplete={handleVideoComplete}
          />

          {chapter.fields.Description && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-white mb-4">
                📝 학습 자료
              </h2>
              <div className="prose prose-invert prose-sm max-w-none rounded-2xl border border-white/10 bg-slate-900/60 p-6">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {chapter.fields.Description}
                </ReactMarkdown>
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleNext}
              disabled={!videoCompleted}
              className={`rounded-2xl px-6 py-3 text-sm font-bold transition ${
                videoCompleted
                  ? 'bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 text-slate-950 shadow-lg hover:opacity-95'
                  : 'bg-white/10 text-slate-400 cursor-not-allowed'
              }`}
            >
              다음 (문제풀이) →
            </button>
          </div>

          {!videoCompleted && (
            <p className="mt-2 text-right text-sm text-slate-300/80">
              영상을 {chapter.fields.Required_Watch_Percentage || 60}% 이상
              시청해야 다음으로 넘어갈 수 있습니다
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
