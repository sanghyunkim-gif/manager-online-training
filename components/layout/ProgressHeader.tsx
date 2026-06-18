'use client';

import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';

interface ProgressHeaderProps {
  userName: string;
  currentChapterOrder: number;
  totalChapters: number;
  completedChapters: number[];
  chapterName: string;
}

export default function ProgressHeader({
  userName,
  currentChapterOrder,
  totalChapters,
  completedChapters,
  chapterName,
}: ProgressHeaderProps) {
  const router = useRouter();

  const handleExit = () => {
    if (
      confirm(
        '학습을 종료하시겠습니까? 진행 상황은 자동으로 저장됩니다.'
      )
    ) {
      localStorage.removeItem('session');
      router.push('/');
    }
  };

  return (
    <div className="sticky top-0 z-20 border-b border-border-subtle bg-bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4">
        <div className="flex items-center justify-between">
          <img src="/logo.png" alt="PLAB Manager" className="h-8" />
          <div className="flex items-center gap-3 text-xs">
            <span className="rounded-full bg-bg-surface-secondary border border-border-subtle px-3 py-1 font-semibold text-text-brand">
              {userName}님
            </span>
            <button
              onClick={handleExit}
              className="rounded-full border border-border-default bg-bg-surface px-3 py-1 font-semibold text-text-secondary transition hover:border-border-focused hover:text-text-brand"
            >
              나가기
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {Array.from({ length: totalChapters }, (_, i) => {
            const chapterNum = i + 1;
            const isCompleted = completedChapters.includes(chapterNum);
            const isCurrent = chapterNum === currentChapterOrder;

            return (
              <div key={i} className="flex flex-1 items-center gap-2">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-bold ${
                      isCompleted
                        ? 'border-border-success bg-bg-success text-text-success'
                        : isCurrent
                        ? 'border-border-focused bg-bg-primary text-text-on-primary'
                        : 'border-border-subtle bg-bg-surface-secondary text-text-tertiary'
                    }`}
                  >
                    {isCompleted ? <Check size={16} aria-hidden="true" /> : chapterNum}
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.08em] text-text-tertiary">
                    {chapterNum}장
                  </div>
                </div>
                {i < totalChapters - 1 && (
                  <div className="h-[2px] flex-1 rounded-full bg-bg-surface-tertiary">
                    <div
                      className={`h-full rounded-full transition ${
                        isCompleted
                          ? 'bg-[var(--text-success)]'
                          : isCurrent
                          ? 'bg-bg-primary'
                          : 'bg-bg-surface-tertiary'
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="text-xs font-semibold uppercase tracking-[0.1em] text-text-secondary">
          현재: <span className="text-text-brand">{chapterName}</span>
        </div>
      </div>
    </div>
  );
}
