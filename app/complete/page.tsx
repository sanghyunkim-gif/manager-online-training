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
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-0 top-0 h-96 w-96 rounded-full bg-primary-500/10 blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-3xl animate-pulse-slow" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(20,184,166,0.12),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(6,182,212,0.12),transparent_35%)]" />
        </div>
        <div className="relative flex flex-col items-center gap-5 rounded-3xl border border-white/20 bg-gradient-to-br from-white/10 to-white/5 px-12 py-10 text-center shadow-2xl backdrop-blur-xl">
          <div className="h-14 w-14 animate-spin rounded-full border-3 border-white/20 border-t-primary-400 shadow-glow-sm" />
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-primary-100">
            완료 처리 중...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 sm:px-6 py-10 lg:py-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-0 h-[500px] w-[500px] rounded-full bg-primary-500/15 blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 right-0 h-[600px] w-[600px] rounded-full bg-cyan-500/15 blur-3xl animate-pulse-slow" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(20,184,166,0.15),transparent_45%),radial-gradient(circle_at_80%_20%,rgba(6,182,212,0.15),transparent_40%)]" />
      </div>

      <div className="relative mx-auto max-w-5xl space-y-10">
        <div className="flex flex-col items-center rounded-3xl border border-white/20 bg-gradient-to-br from-white/10 to-white/5 p-12 lg:p-16 text-center shadow-2xl backdrop-blur-xl animate-scale-in">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary-500/20 to-emerald-500/20 border border-primary-400/30 text-5xl shadow-glow-emerald">
            🎉
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-3">
            모든 과정을 완료했습니다!
          </h1>
          <p className="text-xl text-primary-200">
            {session?.userName}님, 수고하셨습니다.
          </p>
        </div>

        <div className="rounded-3xl border border-white/20 bg-gradient-to-br from-white/10 to-white/5 p-8 lg:p-10 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-primary-200/80 font-medium mb-1">
                완료 요약
              </p>
              <h2 className="text-3xl font-extrabold text-white">학습 결과</h2>
            </div>
            <div className="rounded-full bg-gradient-to-r from-primary-500/20 to-emerald-500/20 border border-primary-400/30 px-5 py-2.5 text-sm font-bold text-primary-100 shadow-glow-sm">
              {chapters.length}개 챕터 완료
            </div>
          </div>

          <div className="space-y-4">
            {chapters.map((chapter, index) => (
              <div
                key={chapter.id}
                className="group flex items-center gap-5 rounded-2xl border border-white/15 bg-gradient-to-r from-white/5 to-white/[0.02] p-5 transition-all hover:border-primary-400/30 hover:shadow-glow-sm"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500/25 to-emerald-500/25 border border-primary-400/30 text-xl font-bold text-primary-100 shadow-lg">
                  ✓
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-white">
                    {chapter.fields.Order}장. {chapter.fields.Name}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-white/15 bg-gradient-to-br from-white/5 to-white/[0.02] p-8">
            <h3 className="text-2xl font-bold text-white mb-3">다음 단계</h3>
            <p className="text-slate-200/90 leading-relaxed text-base">
              온라인 실습을 완료했습니다. 지원 페이지로 돌아가 나머지 과정을 진행해주세요.
            </p>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleClose}
            className="group rounded-2xl border border-white/20 bg-gradient-to-r from-white/10 to-white/5 px-10 py-4 text-base font-bold text-white shadow-xl backdrop-blur-sm transition-all hover:border-primary-400/40 hover:bg-gradient-to-r hover:from-primary-500/10 hover:to-cyan-500/10 hover:text-primary-100 hover:shadow-glow-md focus:ring-2 focus:ring-primary-400/50 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
