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
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-neutral-50">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(21,112,255,0.06),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(0,204,123,0.04),transparent_50%)]" />
        </div>
        <div className="relative flex flex-col items-center gap-5 rounded-xl border border-neutral-200 bg-white px-12 py-10 text-center shadow-lg">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-neutral-200 border-t-primary-500" />
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-neutral-600">
            학습 준비 중...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-neutral-50 px-6 py-10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(21,112,255,0.06),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(0,204,123,0.04),transparent_50%)]" />
        </div>

        <div className="relative mx-auto max-w-4xl space-y-8 rounded-xl border border-neutral-200 bg-white p-10 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-neutral-500 font-bold mb-1">
                환영합니다
              </p>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900">
                {session?.userName}님, 학습을 시작해요
              </h1>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent-50 border border-accent-200 text-3xl">
              ⚠️
            </div>
          </div>

          <div className="rounded-lg border border-accent-200 bg-accent-50 p-6">
            <h2 className="text-lg font-bold mb-3 text-accent-700">오류</h2>
            <p className="text-sm text-accent-600 leading-relaxed">{error}</p>
          </div>

          <div className="grid gap-5 rounded-lg border border-neutral-200 bg-neutral-50 p-6 sm:grid-cols-3">
            <div className="rounded-lg border border-neutral-200 bg-white p-5">
              <p className="text-xs uppercase tracking-[0.12em] text-neutral-500 font-bold mb-2">
                준비 1
              </p>
              <p className="text-sm font-bold text-neutral-900 leading-relaxed">
                Airtable에 챕터/문제 추가
              </p>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-5">
              <p className="text-xs uppercase tracking-[0.12em] text-neutral-500 font-bold mb-2">
                준비 2
              </p>
              <p className="text-sm font-bold text-neutral-900 leading-relaxed">
                .env.local에 API KEY/BASE ID 설정
              </p>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-5">
              <p className="text-xs uppercase tracking-[0.12em] text-neutral-500 font-bold mb-2">
                준비 3
              </p>
              <p className="text-sm font-bold text-neutral-900 leading-relaxed">
                챕터 추가 후 새로고침
              </p>
            </div>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center rounded-full bg-primary-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-primary-600 hover:shadow-xl focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            새로고침
          </button>
        </div>
      </div>
    );
  }

  return null;
}
