'use client';

import { AlertTriangle, Pencil, Trash2, Power, Plus } from 'lucide-react';
import { Badge } from 'plab-design-system';
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
    <Badge
      variant="soft"
      tone={status === 'Active' ? 'success' : 'neutral'}
      size="sm"
    >
      {status === 'Active' ? '활성' : '비활성'}
    </Badge>
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
      <div className="flex flex-col items-center gap-4 rounded-lg border border-border-subtle bg-bg-surface-secondary py-16 text-center">
        <p className="text-sm text-text-secondary">등록된 챕터가 없습니다.</p>
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

      <div className="overflow-hidden rounded-lg border border-border-subtle shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[color:var(--border-subtle)]">
            <thead className="bg-bg-surface-secondary">
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
                    className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-text-secondary"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--border-subtle)] bg-bg-surface">
              {chapters.map((chapter) => {
                const activeCount = questionCounts[chapter.id] ?? 0;
                const hasIntegrityIssue =
                  chapter.questions_count > activeCount ||
                  (chapter.status === 'Active' && activeCount === 0);

                return (
                  <tr
                    key={chapter.id}
                    className="transition hover:bg-bg-surface-secondary"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-text-primary">
                      {chapter.order}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-text-primary">
                      {chapter.name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <StatusBadge status={chapter.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-text-secondary">
                      {chapter.questions_count}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-text-secondary">
                      {activeCount}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {hasIntegrityIssue ? (
                        <Badge
                          variant="soft"
                          tone="warning"
                          size="sm"
                          leftIcon={<AlertTriangle size={12} aria-hidden="true" />}
                        >
                          {chapter.questions_count > activeCount
                            ? '출제 수 초과'
                            : '문제 없음'}
                        </Badge>
                      ) : (
                        <span className="text-xs text-text-tertiary">정상</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEdit(chapter)}
                          aria-label={`${chapter.name} 수정`}
                          className="rounded-md p-1.5 text-text-secondary transition hover:bg-bg-surface-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus"
                        >
                          <Pencil size={15} aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => onDelete(chapter)}
                          aria-label={`${chapter.name} 비활성화`}
                          className="rounded-md p-1.5 text-text-secondary transition hover:bg-bg-surface-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus"
                        >
                          <Power size={15} aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => onHardDelete(chapter)}
                          aria-label={`${chapter.name} 영구 삭제`}
                          className="rounded-md p-1.5 text-text-error transition hover:bg-bg-error hover:text-text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-error"
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
