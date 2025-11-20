'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Session, AirtableRecord, Chapter } from '@/types';

export default function CompletePage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [chapters, setChapters] = useState<AirtableRecord<Chapter>[]>([]);
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

      try {
        // 챕터 목록 가져오기
        const chaptersRes = await fetch('/api/chapters/list');
        const chaptersData = await chaptersRes.json();

        if (chaptersData.success) {
          setChapters(chaptersData.data);
        }

        // 완료 처리는 마지막 챕터 완료 시 자동으로 처리됨
        // 여기서는 완료 페이지만 표시

        setLoading(false);
      } catch (err) {
        console.error('초기화 오류:', err);
        setLoading(false);
      }
    };

    init();
  }, [router]);

  const handleClose = () => {
    localStorage.removeItem('session');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">완료 처리 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            모든 과정을 완료했습니다!
          </h1>
          <p className="text-xl text-gray-600">
            {session?.userName}님, 수고하셨습니다!
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">📊 학습 결과</h2>

          <div className="space-y-4 mb-8">
            {chapters.map((chapter, idx) => (
              <div
                key={chapter.id}
                className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-lg"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center font-semibold">
                  ✓
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    {chapter.fields.Order}장. {chapter.fields.Name}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-xl font-bold mb-4">📌 다음 단계</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <p className="text-gray-800 mb-4">
                온라인 실습을 성공적으로 완료하셨습니다!
              </p>
              <p className="text-gray-800">
                지원페이지로 돌아가 나머지 과정을 진행해주세요
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={handleClose}
            className="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
