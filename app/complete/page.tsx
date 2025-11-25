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

        // 완료 페이지에 도달하면 사용자를 완료 처리
        console.log('완료 페이지 도달 - 사용자 완료 처리 시작:', { userId: parsedSession.userId });

        const completeRes = await fetch('/api/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: parsedSession.userId }),
        });

        const completeData = await completeRes.json();
        console.log('완료 처리 응답:', completeData);

        if (!completeData.success) {
          console.error('완료 처리 실패:', completeData.error);

          // 모든 챕터를 완료하지 않았다면 학습 페이지로 리다이렉트
          if (completeRes.status === 403) {
            console.warn('⚠️  모든 챕터를 완료하지 않음 - /learn으로 리다이렉트');
            alert('모든 챕터를 완료해야 합니다.');
            router.push('/learn');
            return;
          }
        } else {
          console.log('✅ 사용자 완료 처리 성공!');
        }

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
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-neutral-50">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(21,112,255,0.06),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(0,204,123,0.04),transparent_50%)]" />
        </div>
        <div className="relative flex flex-col items-center gap-5 rounded-xl border border-neutral-200 bg-white px-12 py-10 text-center shadow-lg">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-neutral-200 border-t-primary-500" />
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-neutral-600">
            완료 처리 중...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-50 px-4 sm:px-6 py-10 lg:py-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(21,112,255,0.06),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(0,204,123,0.04),transparent_50%)]" />
      </div>

      <div className="relative mx-auto max-w-5xl space-y-10">
        <div className="flex flex-col items-center rounded-xl border border-neutral-200 bg-white p-12 lg:p-16 text-center shadow-lg animate-scale-in">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-success-50 border border-success-200 text-5xl">
            🎉
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-neutral-900 mb-3">
            모든 과정을 완료했습니다!
          </h1>
          <p className="text-xl text-neutral-600">
            {session?.userName}님, 수고하셨습니다.
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-8 lg:p-10 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-neutral-500 font-bold mb-1">
                완료 요약
              </p>
              <h2 className="text-3xl font-extrabold text-neutral-900">학습 결과</h2>
            </div>
            <div className="rounded-full bg-success-50 border border-success-200 px-5 py-2.5 text-sm font-bold text-success-700">
              {chapters.length}개 챕터 완료
            </div>
          </div>

          <div className="space-y-4">
            {chapters.map((chapter, index) => (
              <div
                key={chapter.id}
                className="group flex items-center gap-5 rounded-lg border border-neutral-200 bg-neutral-50 p-5 transition-all hover:border-primary-300 hover:shadow-sm"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success-50 border border-success-200 text-xl font-bold text-success-600">
                  ✓
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-neutral-900">
                    {chapter.fields.Order}장. {chapter.fields.Name}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-lg border border-neutral-200 bg-neutral-50 p-8">
            <h3 className="text-2xl font-bold text-neutral-900 mb-3">다음 단계</h3>
            <p className="text-neutral-600 leading-relaxed text-base">
              온라인 실습을 완료했습니다. 지원 페이지로 돌아가 나머지 과정을 진행해주세요.
            </p>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleClose}
            className="group rounded-full border border-neutral-300 bg-white px-10 py-4 text-base font-bold text-neutral-700 shadow-sm transition-all hover:border-primary-500 hover:bg-primary-50 hover:text-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
