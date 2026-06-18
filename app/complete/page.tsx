'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Badge } from 'plab-design-system';
import { CheckCircle2, Check } from 'lucide-react';
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
      <div className="mx-auto flex min-h-screen max-w-[480px] flex-col items-center justify-center bg-bg-surface-secondary px-5">
        <div className="flex w-full flex-col items-center gap-5 rounded-2xl border border-border-subtle bg-bg-surface px-8 py-10 text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-border-subtle border-t-bg-primary" />
          <p className="text-sm font-bold text-text-secondary">
            완료 처리 중...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[480px] flex-col bg-bg-surface-secondary px-5 py-8">
      {/* 완료 축하 카드 */}
      <div className="animate-scale-in mb-4 flex flex-col items-center rounded-2xl border border-border-subtle bg-bg-surface px-6 py-8 text-center">
        <CheckCircle2 className="mb-4 h-14 w-14 text-text-success" />
        <h1 className="mb-2 text-2xl font-bold text-text-primary">
          모든 과정을 완료했습니다!
        </h1>
        <p className="text-base text-text-secondary">
          {session?.userName}님, 수고하셨습니다.
        </p>
      </div>

      {/* 학습 결과 카드 */}
      <div className="mb-4 rounded-2xl border border-border-subtle bg-bg-surface px-5 py-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-text-tertiary">완료 요약</p>
            <h2 className="mt-0.5 text-xl font-bold text-text-primary">학습 결과</h2>
          </div>
          <Badge tone="success" variant="soft" size="md">
            {chapters.length}개 챕터 완료
          </Badge>
        </div>

        <div className="space-y-2">
          {chapters.map((ch) => (
            <div
              key={ch.id}
              className="flex items-center gap-3 rounded-xl border border-border-subtle bg-bg-surface-secondary px-4 py-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border-subtle bg-bg-surface">
                <Check className="h-4 w-4 text-text-success" />
              </div>
              <p className="text-sm font-semibold text-text-primary">
                {ch.order}장. {ch.name}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 다음 단계 카드 */}
      <div className="mb-6 rounded-2xl border border-border-subtle bg-bg-surface px-5 py-5">
        <h3 className="mb-2 text-base font-bold text-text-primary">다음 단계</h3>
        <p className="text-sm leading-relaxed text-text-secondary">
          온라인 실습을 완료했습니다. 지원 페이지로 돌아가 나머지 과정을 진행해주세요.
        </p>
      </div>

      {/* 닫기 버튼 */}
      <Button
        variant="solid"
        size="lg"
        onClick={handleClose}
        className="w-full"
      >
        닫기
      </Button>
    </div>
  );
}
