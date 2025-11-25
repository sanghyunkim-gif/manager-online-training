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
    <div className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/75 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-emerald-200">
            <span className="text-base">⚽</span>
            플랩풋볼 매니저
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-200">
            <span className="rounded-full bg-white/10 px-3 py-1 font-semibold text-emerald-100">
              {userName}님
            </span>
            <button
              onClick={handleExit}
              className="rounded-full border border-white/10 px-3 py-1 font-semibold text-white transition hover:border-emerald-300/50 hover:text-emerald-100"
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
                    className={`flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-bold ${
                      isCompleted
                        ? 'border-emerald-300/60 bg-emerald-500/20 text-emerald-50 shadow-[0_0_0_1px_rgba(16,185,129,0.2)]'
                        : isCurrent
                        ? 'border-cyan-300/60 bg-cyan-500/20 text-cyan-50 shadow-[0_0_0_1px_rgba(34,211,238,0.2)]'
                        : 'border-white/10 bg-white/5 text-slate-300'
                    }`}
                  >
                    {isCompleted ? '✓' : chapterNum}
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.08em] text-slate-400">
                    {chapterNum}장
                  </div>
                </div>
                {i < totalChapters - 1 && (
                  <div className="h-[2px] flex-1 rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full transition ${
                        isCompleted
                          ? 'bg-gradient-to-r from-emerald-400 to-cyan-300'
                          : isCurrent
                          ? 'bg-gradient-to-r from-cyan-300 to-emerald-300'
                          : 'bg-white/10'
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-300">
          현재: <span className="text-emerald-100">{chapterName}</span>
        </div>
      </div>
    </div>
  );
}
