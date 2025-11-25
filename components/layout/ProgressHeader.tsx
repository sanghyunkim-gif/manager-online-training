'use client';

import { useRouter } from 'next/navigation';

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
    <div className="sticky top-0 z-20 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4">
        <div className="flex items-center justify-between">
          <img src="/logo.png" alt="PLAB Manager" className="h-8" />
          <div className="flex items-center gap-3 text-xs">
            <span className="rounded-full bg-primary-50 border border-primary-200 px-3 py-1 font-semibold text-primary-700">
              {userName}님
            </span>
            <button
              onClick={handleExit}
              className="rounded-full border border-neutral-300 bg-white px-3 py-1 font-semibold text-neutral-700 transition hover:border-primary-500 hover:text-primary-600"
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
                        ? 'border-success-300 bg-success-50 text-success-700'
                        : isCurrent
                        ? 'border-primary-500 bg-primary-500 text-white'
                        : 'border-neutral-200 bg-neutral-50 text-neutral-400'
                    }`}
                  >
                    {isCompleted ? '✓' : chapterNum}
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.08em] text-neutral-500">
                    {chapterNum}장
                  </div>
                </div>
                {i < totalChapters - 1 && (
                  <div className="h-[2px] flex-1 rounded-full bg-neutral-200">
                    <div
                      className={`h-full rounded-full transition ${
                        isCompleted
                          ? 'bg-success-500'
                          : isCurrent
                          ? 'bg-primary-500'
                          : 'bg-neutral-200'
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-600">
          현재: <span className="text-primary-600">{chapterName}</span>
        </div>
      </div>
    </div>
  );
}
