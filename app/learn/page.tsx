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
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-0 top-0 h-96 w-96 rounded-full bg-primary-500/10 blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-3xl animate-pulse-slow" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(20,184,166,0.12),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(6,182,212,0.12),transparent_35%)]" />
        </div>
        <div className="relative flex flex-col items-center gap-5 rounded-3xl border border-white/20 bg-gradient-to-br from-white/10 to-white/5 px-12 py-10 text-center shadow-2xl backdrop-blur-xl">
          <div className="h-14 w-14 animate-spin rounded-full border-3 border-white/20 border-t-primary-400 shadow-glow-sm" />
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-primary-100">
            학습 준비 중...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-6 py-10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-0 top-0 h-96 w-96 rounded-full bg-primary-500/10 blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-3xl animate-pulse-slow" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(20,184,166,0.12),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(6,182,212,0.12),transparent_35%)]" />
        </div>

        <div className="relative mx-auto max-w-4xl space-y-8 rounded-3xl border border-white/20 bg-gradient-to-br from-white/10 to-white/5 p-10 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-primary-200/80 font-medium mb-1">
                환영합니다
              </p>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
                {session?.userName}님, 학습을 시작해요
              </h1>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 border border-rose-400/30 text-3xl shadow-lg">
              ⚠️
            </div>
          </div>

          <div className="rounded-2xl border border-rose-400/50 bg-gradient-to-r from-rose-500/15 to-pink-500/15 p-6 shadow-lg">
            <h2 className="text-lg font-bold mb-3 text-rose-100">오류</h2>
            <p className="text-sm text-rose-100/90 leading-relaxed">{error}</p>
          </div>

          <div className="grid gap-5 rounded-2xl border border-white/15 bg-gradient-to-br from-white/5 to-white/[0.02] p-6 sm:grid-cols-3">
            <div className="rounded-xl border border-primary-400/20 bg-gradient-to-br from-primary-500/5 to-emerald-500/5 p-5">
              <p className="text-xs uppercase tracking-[0.12em] text-primary-300/80 font-medium mb-2">
                준비 1
              </p>
              <p className="text-sm font-bold text-white leading-relaxed">
                Airtable에 챕터/문제 추가
              </p>
            </div>
            <div className="rounded-xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 p-5">
              <p className="text-xs uppercase tracking-[0.12em] text-cyan-300/80 font-medium mb-2">
                준비 2
              </p>
              <p className="text-sm font-bold text-white leading-relaxed">
                .env.local에 API KEY/BASE ID 설정
              </p>
            </div>
            <div className="rounded-xl border border-accent-400/20 bg-gradient-to-br from-accent-500/5 to-purple-500/5 p-5">
              <p className="text-xs uppercase tracking-[0.12em] text-accent-300/80 font-medium mb-2">
                준비 3
              </p>
              <p className="text-sm font-bold text-white leading-relaxed">
                챕터 추가 후 새로고침
              </p>
            </div>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-primary-400 via-cyan-400 to-accent-500 px-8 py-3.5 text-sm font-bold text-slate-950 shadow-xl shadow-primary-500/30 transition-all hover:shadow-glow-md hover:scale-105 focus:ring-2 focus:ring-primary-300 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            새로고침
          </button>
        </div>
      </div>
    );
  }

  return null;
}
