'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from 'plab-design-system';
import type { Session, DbChapter, DbUserProgress } from '@/types';

export default function LearnPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const initLearn = async () => {
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

        if (!chaptersData.success || chaptersData.data.length === 0) {
          setError('챕터가 없습니다. 챕터를 추가해주세요.');
          setLoading(false);
          return;
        }

        const chapters: DbChapter[] = chaptersData.data;

        const progressRes = await fetch('/api/progress/get', {
          headers: { 'X-Session-Token': parsedSession.sessionToken },
        });
        const progressData = await progressRes.json();

        let nextChapter = chapters[0];

        if (progressData.success && progressData.data.length > 0) {
          const completedChapterIds = progressData.data
            .filter((p: DbUserProgress) => p.chapter_completed)
            .map((p: DbUserProgress) => p.chapter_id);

          nextChapter =
            chapters.find((c) => !completedChapterIds.includes(c.id)) ||
            chapters[chapters.length - 1];
        }

        router.push(`/learn/chapter/${nextChapter.id}`);
      } catch (err) {
        console.error('학습 초기화 오류:', err);
        setError('학습을 시작할 수 없습니다. 잠시 후 다시 시도해주세요.');
        setLoading(false);
      }
    };

    initLearn();
  }, [router]);

  if (loading) {
    return (
      <div className="mx-auto flex min-h-screen max-w-[480px] flex-col items-center justify-center bg-bg-surface-secondary px-5">
        <div className="flex w-full flex-col items-center gap-5 rounded-2xl border border-border-subtle bg-bg-surface px-8 py-10 text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-border-subtle border-t-bg-primary" />
          <p className="text-sm font-bold text-text-secondary">
            학습 준비 중...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex min-h-screen max-w-[480px] flex-col bg-bg-surface-secondary px-5 py-8">
        <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6">
          <p className="mb-0.5 text-xs font-bold uppercase tracking-widest text-text-tertiary">환영합니다</p>
          <h1 className="mb-6 text-2xl font-bold text-text-primary">
            {session?.userName}님, 학습을 시작해요
          </h1>

          <div className="mb-6 rounded-xl border border-border-error bg-bg-error px-4 py-4">
            <h2 className="mb-1.5 text-sm font-bold text-text-error">오류</h2>
            <p className="text-sm leading-relaxed text-text-error">{error}</p>
          </div>

          <div className="mb-6 space-y-3">
            <div className="rounded-2xl border border-border-subtle bg-bg-surface-secondary p-4">
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-text-tertiary">
                준비 1
              </p>
              <p className="text-sm font-semibold leading-relaxed text-text-primary">
                Supabase에 챕터/문제 추가
              </p>
            </div>
            <div className="rounded-2xl border border-border-subtle bg-bg-surface-secondary p-4">
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-text-tertiary">
                준비 2
              </p>
              <p className="text-sm font-semibold leading-relaxed text-text-primary">
                .env.local에 Supabase URL/Key 설정
              </p>
            </div>
            <div className="rounded-2xl border border-border-subtle bg-bg-surface-secondary p-4">
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-text-tertiary">
                준비 3
              </p>
              <p className="text-sm font-semibold leading-relaxed text-text-primary">
                챕터 추가 후 새로고침
              </p>
            </div>
          </div>

          <Button
            variant="solid"
            size="md"
            onClick={() => window.location.reload()}
            className="w-full"
          >
            새로고침
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
