'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Session, AirtableRecord, Chapter } from '@/types';

export default function LearnPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const initLearn = async () => {
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

        if (!chaptersData.success || chaptersData.data.length === 0) {
          setError('챕터가 없습니다. Airtable에 챕터를 추가해주세요.');
          setLoading(false);
          return;
        }

        const chapters: AirtableRecord<Chapter>[] = chaptersData.data;

        // 진행 상황 가져오기
        const progressRes = await fetch(
          `/api/progress/get?userId=${parsedSession.userId}`
        );
        const progressData = await progressRes.json();

        // 완료한 챕터 찾기
        let nextChapter = chapters[0];

        if (progressData.success && progressData.data.length > 0) {
          const completedChapterIds = progressData.data
            .filter((p: any) => p.fields.Chapter_Completed)
            .map((p: any) => p.fields.Chapter[0]);

          // 완료하지 않은 첫 번째 챕터 찾기
          nextChapter =
            chapters.find((c) => !completedChapterIds.includes(c.id)) ||
            chapters[chapters.length - 1];
        }

        // 챕터 페이지로 리다이렉트
        router.push(`/learn/chapter/${nextChapter.id}`);
      } catch (err: any) {
        console.error('학습 초기화 오류:', err);
        setError('학습을 시작할 수 없습니다. 잠시 후 다시 시도해주세요.');
        setLoading(false);
      }
    };

    initLearn();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">학습 준비 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h1 className="text-3xl font-bold mb-4">
              환영합니다, {session?.userName}님!
            </h1>

            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
              <h2 className="font-semibold text-red-900 mb-2">⚠️ 오류</h2>
              <p className="text-red-800">{error}</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h2 className="font-semibold text-blue-900 mb-2">
                📋 준비 사항
              </h2>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>
                  • Airtable에 챕터와 문제를 추가해주세요
                </li>
                <li>
                  • .env.local 파일에 AIRTABLE_API_KEY와 AIRTABLE_BASE_ID를
                  설정해주세요
                </li>
                <li>
                  • 챕터 추가 후 이 페이지를 새로고침하면 자동으로 학습이
                  시작됩니다
                </li>
              </ul>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
            >
              새로고침
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
