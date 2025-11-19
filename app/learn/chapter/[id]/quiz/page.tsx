'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProgressHeader from '@/components/layout/ProgressHeader';
import type {
  Session,
  AirtableRecord,
  Chapter,
  Question,
} from '@/types';

export default function QuizPage() {
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
  const [questions, setQuestions] = useState<AirtableRecord<Question>[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      // 세션 확인
      const sessionData = localStorage.getItem('session');
      if (!sessionData) {
        router.push('/');
        return;
      }

      const parsedSession: Session = JSON.parse(sessionData);
      if (!mounted) return;
      setSession(parsedSession);

      try {
        // 챕터 목록 가져오기
        const chaptersRes = await fetch('/api/chapters/list');
        const chaptersData = await chaptersRes.json();

        if (!mounted) return;

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

        if (!mounted) return;

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

        // 문제 가져오기
        const questionsRes = await fetch(
          `/api/questions/random?chapterId=${chapterId}`
        );
        const questionsData = await questionsRes.json();

        if (!mounted) return;

        if (!questionsData.success) {
          throw new Error(
            questionsData.error || '문제를 불러올 수 없습니다.'
          );
        }

        setQuestions(questionsData.data);
        setLoading(false);
      } catch (err: any) {
        console.error('초기화 오류:', err);
        if (!mounted) return;
        setError(err.message);
        setLoading(false);
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [chapterId, router]);

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswerSelect = (answer: string) => {
    setAnswers({
      ...answers,
      [currentQuestion.id]: answer,
    });
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleSubmit = async () => {
    // 모든 문제에 답했는지 확인
    const unanswered = questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      alert(`${unanswered.length}개의 문제가 답변되지 않았습니다.`);
      return;
    }

    setSubmitting(true);

    try {
      // 답안 제출
      const response = await fetch('/api/answer/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session?.userId,
          chapterId,
          answers,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      // 결과 데이터를 sessionStorage에 저장
      sessionStorage.setItem(
        `result_${chapterId}`,
        JSON.stringify(data.data)
      );

      // 결과 페이지로 이동
      router.push(`/learn/chapter/${chapterId}/result`);
    } catch (err: any) {
      alert(err.message || '답안 제출 중 오류가 발생했습니다.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">문제를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !chapter || !session || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">오류</h2>
          <p className="text-gray-700 mb-4">
            {error || '문제를 불러올 수 없습니다.'}
          </p>
          <button
            onClick={() => router.push(`/learn/chapter/${chapterId}`)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      <ProgressHeader
        userName={session.userName}
        currentChapterOrder={chapter.fields.Order}
        totalChapters={allChapters.length}
        completedChapters={completedChapters}
        chapterName={`${chapter.fields.Order}장. ${chapter.fields.Name} - 문제 풀이`}
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">
              문제 {currentQuestionIndex + 1} / {questions.length}
            </h1>
            <div className="flex gap-2">
              {questions.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                    answers[questions[idx].id]
                      ? 'bg-blue-600 text-white'
                      : idx === currentQuestionIndex
                      ? 'bg-blue-200 text-blue-800'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {idx + 1}
                </div>
              ))}
            </div>
          </div>

          {/* 진행률 바 */}
          <div className="mb-8">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              답변 완료: {answeredCount} / {questions.length}
            </p>
          </div>

          {/* 문제 */}
          <div className="mb-8">
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <p className="text-lg font-medium whitespace-pre-wrap">
                {currentQuestion.fields.Question_Text}
              </p>
            </div>

            {/* 선택지 */}
            <div className="space-y-3">
              {(['1', '2', '3', '4'] as const).map((num) => {
                const optionText =
                  currentQuestion.fields[`Option_${num}` as keyof Question];
                const isSelected = answers[currentQuestion.id] === num;

                return (
                  <button
                    key={num}
                    onClick={() => handleAnswerSelect(num)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {num}
                      </div>
                      <span className="flex-1">{optionText as string}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                currentQuestionIndex === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-600 hover:bg-gray-700 text-white'
              }`}
            >
              ← 이전 문제
            </button>

            {currentQuestionIndex < questions.length - 1 ? (
              <button
                onClick={handleNext}
                className="px-6 py-3 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white transition"
              >
                다음 문제 →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting || answeredCount < questions.length}
                className={`px-6 py-3 rounded-lg font-semibold transition ${
                  submitting || answeredCount < questions.length
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {submitting ? '제출 중...' : '제출하기'}
              </button>
            )}
          </div>

          {answeredCount < questions.length && (
            <p className="text-sm text-gray-500 text-center mt-4">
              * 모든 문제를 풀고 나면 제출할 수 있습니다
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
