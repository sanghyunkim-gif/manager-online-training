'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Session, DbChapter } from '@/types';

export default function CompletePage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [chapters, setChapters] = useState<DbChapter[]>([]);
  const [loading, setLoading] = useState(true);

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

        if (chaptersData.success) {
          setChapters(chaptersData.data);
        }

        const completeRes = await fetch('/api/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: parsedSession.userId }),
        });

        const completeData = await completeRes.json();

        if (!completeData.success) {
          if (completeRes.status === 403) {
            alert('모든 챕터를 완료해야 합니다.');
            router.push('/learn');
            return;
          }
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
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#2d1b69] via-[#3b2f87] to-[#4a5ea8]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-bl from-[#5dd9d1]/30 via-[#7b9ad9]/20 to-transparent" />
          <div className="absolute bottom-0 left-0 h-1/2 w-1/2 bg-gradient-to-tr from-[#8b5cbb]/20 to-transparent" />
        </div>
        <div className="relative flex flex-col items-center gap-5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 px-12 py-10 text-center shadow-lg">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-white/20 border-t-white" />
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-white">
            완료 처리 중...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#2d1b69] via-[#3b2f87] to-[#4a5ea8] px-4 sm:px-6 py-10 lg:py-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-bl from-[#5dd9d1]/30 via-[#7b9ad9]/20 to-transparent" />
        <div className="absolute bottom-0 left-0 h-1/2 w-1/2 bg-gradient-to-tr from-[#8b5cbb]/20 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-5xl space-y-10">
        <div className="flex flex-col items-center rounded-xl bg-white/10 backdrop-blur-md border border-white/20 p-12 lg:p-16 text-center shadow-lg animate-scale-in">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-3">
            모든 과정을 완료했습니다!
          </h1>
          <p className="text-xl text-white">
            {session?.userName}님, 수고하셨습니다.
          </p>
        </div>

        <div className="rounded-xl bg-white/10 backdrop-blur-md border border-white/20 p-8 lg:p-10 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-white font-bold mb-1">
                완료 요약
              </p>
              <h2 className="text-3xl font-extrabold text-white">학습 결과</h2>
            </div>
            <div className="rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-5 py-2.5 text-sm font-bold text-white">
              {chapters.length}개 챕터 완료
            </div>
          </div>

          <div className="space-y-4">
            {chapters.map((ch) => (
              <div
                key={ch.id}
                className="group flex items-center gap-5 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 p-5 transition-all hover:border-white/30 hover:shadow-sm"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-xl font-bold text-white">
                  ✓
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-white">
                    {ch.order}장. {ch.name}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 p-8">
            <h3 className="text-2xl font-bold text-white mb-3">다음 단계</h3>
            <p className="text-white leading-relaxed text-base">
              온라인 실습을 완료했습니다. 지원 페이지로 돌아가 나머지 과정을 진행해주세요.
            </p>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleClose}
            className="group rounded-full bg-gradient-to-r from-[#3b82f6] to-[#2563eb] shadow-lg shadow-blue-500/25 px-10 py-4 text-base font-bold text-white transition hover:opacity-90 focus:ring-2 focus:ring-white/50 focus:ring-offset-2"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
