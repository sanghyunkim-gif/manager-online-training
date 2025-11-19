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
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center mb-4">
          <div className="text-lg font-bold text-blue-600">⚽ 플랩풋볼</div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{userName}님</span>
            <button
              onClick={handleExit}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              나가기
            </button>
          </div>
        </div>

        {/* 진행률 바 */}
        <div className="mb-2">
          <div className="flex items-center gap-2">
            {Array.from({ length: totalChapters }, (_, i) => {
              const chapterNum = i + 1;
              const isCompleted = completedChapters.includes(chapterNum);
              const isCurrent = chapterNum === currentChapterOrder;

              return (
                <div key={i} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isCurrent
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {isCompleted ? '✓' : chapterNum}
                    </div>
                    <div className="text-xs mt-1 text-gray-600">
                      {chapterNum}장
                    </div>
                  </div>
                  {i < totalChapters - 1 && (
                    <div
                      className={`flex-1 h-1 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    ></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-sm text-gray-600">현재: {chapterName}</div>
      </div>
    </div>
  );
}
