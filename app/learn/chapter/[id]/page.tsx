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
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-neutral-50">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(21,112,255,0.06),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(0,204,123,0.04),transparent_50%)]" />
        </div>
        <div className="relative flex flex-col items-center gap-5 rounded-xl border border-neutral-200 bg-white px-12 py-10 text-center shadow-lg">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-neutral-200 border-t-primary-500" />
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-neutral-600">
            로딩 중...
          </p>
        </div>
      </div>
    );
  }

  if (error || !chapter || !session) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-neutral-50 px-6 py-10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(21,112,255,0.06),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(0,204,123,0.04),transparent_50%)]" />
        </div>
        <div className="relative mx-auto max-w-xl rounded-xl border border-neutral-200 bg-white p-8 text-center shadow-lg">
          <div className="mb-3 text-3xl">⚠️</div>
          <h2 className="text-xl font-bold mb-2 text-neutral-900">오류</h2>
          <p className="mb-6 text-neutral-600">
            {error || '페이지를 불러올 수 없습니다.'}
          </p>
          <button
            onClick={() => router.push('/learn')}
            className="rounded-full bg-primary-500 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-primary-600"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
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
        chapterName={`${chapter.fields.Order}장. ${chapter.fields.Name}`}
      />

      <div className="relative mx-auto max-w-5xl px-6 py-8">
        <div className="rounded-xl border border-neutral-200 bg-white p-8 shadow-lg">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-primary-600 font-bold">
                Chapter {chapter.fields.Order}
              </p>
              <h1 className="text-3xl font-bold text-neutral-900">
                {chapter.fields.Order}장. {chapter.fields.Name}
              </h1>
            </div>
            <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-700">
              영상 & 자료
            </span>
          </div>
          <div className="my-6 h-px bg-neutral-200" />

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
              <h2 className="text-xl font-bold text-neutral-900 mb-4">
                📝 학습 자료
              </h2>
              <div className="prose prose-sm max-w-none rounded-lg border border-neutral-200 bg-neutral-50 p-6">
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
              영상을 {chapter.fields.Required_Watch_Percentage || 60}% 이상
              시청해야 다음으로 넘어갈 수 있습니다
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
