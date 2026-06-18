'use client';

import { AlertTriangle, Pencil, Trash2, Power, Plus } from 'lucide-react';
import type { DbChapter } from '@/types';
import { Button } from '@/components/ui/Button';

interface ChapterTableProps {
  chapters: DbChapter[];
  questionCounts: Record<string, number>;
  onEdit: (chapter: DbChapter) => void;
  onDelete: (chapter: DbChapter) => void;
  onHardDelete: (chapter: DbChapter) => void;
  onAdd: () => void;
}

function StatusBadge({ status }: { status: 'Active' | 'Inactive' }) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
        status === 'Active'
          ? 'bg-success-50 text-success-700 border border-success-200'
          : 'bg-neutral-100 text-neutral-500 border border-neutral-200',
      ].join(' ')}
    >
      {status === 'Active' ? '활성' : '비활성'}
    </span>
  );
}

export function ChapterTable({
  chapters,
  questionCounts,
  onEdit,
  onDelete,
  onHardDelete,
  onAdd,
}: ChapterTableProps) {
  if (chapters.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-neutral-200 bg-neutral-50 py-16 text-center">
        <p className="text-sm text-neutral-500">등록된 챕터가 없습니다.</p>
        <Button leftIcon={<Plus size={16} />} onClick={onAdd}>
          첫 번째 챕터 추가
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button leftIcon={<Plus size={16} />} onClick={onAdd} size="sm">
          챕터 추가
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-100">
              <tr>
                {[
                  '순서',
                  '챕터명',
                  '상태',
                  '출제 수',
                  '활성 문제',
                  '정합성',
                  '관리',
                ].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-neutral-600"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-neutral-50">
              {chapters.map((chapter) => {
                const activeCount = questionCounts[chapter.id] ?? 0;
                const hasIntegrityIssue =
                  chapter.questions_count > activeCount ||
                  (chapter.status === 'Active' && activeCount === 0);

                return (
                  <tr
                    key={chapter.id}
                    className="transition hover:bg-neutral-100"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-neutral-800">
                      {chapter.order}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-neutral-800">
                      {chapter.name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <StatusBadge status={chapter.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-700">
                      {chapter.questions_count}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-700">
                      {activeCount}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {hasIntegrityIssue ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent-50 px-2 py-0.5 text-xs font-semibold text-accent-600 border border-accent-200">
                          <AlertTriangle size={12} aria-hidden="true" />
                          {chapter.questions_count > activeCount
                            ? '출제 수 초과'
                            : '문제 없음'}
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-400">정상</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEdit(chapter)}
                          aria-label={`${chapter.name} 수정`}
                          className="rounded-md p-1.5 text-neutral-500 transition hover:bg-neutral-200 hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                        >
                          <Pencil size={15} aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => onDelete(chapter)}
                          aria-label={`${chapter.name} 비활성화`}
                          className="rounded-md p-1.5 text-neutral-500 transition hover:bg-neutral-200 hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                        >
                          <Power size={15} aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => onHardDelete(chapter)}
                          aria-label={`${chapter.name} 영구 삭제`}
                          className="rounded-md p-1.5 text-accent-500 transition hover:bg-accent-50 hover:text-accent-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                        >
                          <Trash2 size={15} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
