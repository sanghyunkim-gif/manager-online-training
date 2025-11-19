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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">결과 확인 중...</p>
        </div>
      </div>
    );
  }

  if (!session || !chapter || !resultData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProgressHeader
        userName={session.userName}
        currentChapterOrder={chapter.fields.Order}
        totalChapters={allChapters.length}
        completedChapters={completedChapters}
        chapterName={`${chapter.fields.Order}장. ${chapter.fields.Name} - 결과`}
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {resultData.allCorrect ? (
            // 전체 정답
            <div className="text-center">
              <div className="text-6xl mb-4">✅</div>
              <h1 className="text-3xl font-bold mb-4">축하합니다!</h1>
              <p className="text-xl text-gray-600 mb-8">
                {chapter.fields.Order}장을 완료했습니다
              </p>

              <div className="bg-green-50 rounded-lg p-6 mb-8 inline-block">
                <p className="text-lg font-semibold text-green-900">
                  정답: {resultData.correctCount} / {resultData.totalCount}
                </p>
              </div>

              <button
                onClick={handleNext}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-lg transition"
              >
                {allChapters.findIndex((c) => c.id === chapterId) <
                allChapters.length - 1
                  ? '다음 챕터로 →'
                  : '완료 →'}
              </button>
            </div>
          ) : (
            // 오답 있음
            <div>
              <div className="text-center mb-8">
                <div className="text-6xl mb-4">⚠️</div>
                <h1 className="text-3xl font-bold mb-4">아쉽습니다!</h1>
                <p className="text-xl text-gray-600 mb-4">오답이 있습니다</p>

                <div className="bg-yellow-50 rounded-lg p-6 inline-block">
                  <p className="text-lg font-semibold text-yellow-900">
                    정답: {resultData.correctCount} / {resultData.totalCount}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-8">
                <h2 className="text-2xl font-bold mb-6">📌 오답 문제</h2>

                <div className="space-y-6">
                  {resultData.incorrectQuestions.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-red-50 border border-red-200 rounded-lg p-6"
                    >
                      <h3 className="font-semibold text-red-900 mb-3">
                        문제 {idx + 1}
                      </h3>
                      <p className="text-gray-800 mb-4 whitespace-pre-wrap">
                        {item.questionText}
                      </p>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-start gap-2">
                          <span className="text-red-600 font-semibold">
                            당신의 답변:
                          </span>
                          <span className="text-red-800">
                            {item.userAnswer}.{' '}
                            {item.options[item.userAnswer]}
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-green-600 font-semibold">
                            정답:
                          </span>
                          <span className="text-green-800">
                            {item.correctAnswer}.{' '}
                            {item.options[item.correctAnswer]}
                          </span>
                        </div>
                      </div>

                      {item.explanation && (
                        <div className="bg-white rounded-lg p-4">
                          <p className="text-sm font-semibold text-gray-700 mb-2">
                            💡 해설:
                          </p>
                          <div className="text-sm text-gray-700 prose prose-sm max-w-none">
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
                <p className="text-gray-600 mb-6">
                  학습 자료를 다시 확인하고 문제를 재시도해주세요
                </p>
                <button
                  onClick={handleRetry}
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-lg transition"
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
