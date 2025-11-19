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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error || !chapter || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">오류</h2>
          <p className="text-gray-700 mb-4">
            {error || '페이지를 불러올 수 없습니다.'}
          </p>
          <button
            onClick={() => router.push('/learn')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProgressHeader
        userName={session.userName}
        currentChapterOrder={chapter.fields.Order}
        totalChapters={allChapters.length}
        completedChapters={completedChapters}
        chapterName={`${chapter.fields.Order}장. ${chapter.fields.Name}`}
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-2">
            {chapter.fields.Order}장. {chapter.fields.Name}
          </h1>
          <div className="border-b border-gray-200 mb-6"></div>

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
              <h2 className="text-xl font-semibold mb-4">📝 학습 자료</h2>
              <div className="bg-gray-50 rounded-lg p-6 prose prose-sm max-w-none">
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
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                videoCompleted
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              다음 (문제풀이) →
            </button>
          </div>

          {!videoCompleted && (
            <p className="text-sm text-gray-500 text-right mt-2">
              영상을 {chapter.fields.Required_Watch_Percentage || 60}% 이상
              시청해야 다음으로 넘어갈 수 있습니다
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
