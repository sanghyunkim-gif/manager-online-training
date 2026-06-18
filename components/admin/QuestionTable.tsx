'use client';

import { useState } from 'react';
import { Pencil, Trash2, Power, Plus } from 'lucide-react';
import { Badge } from 'plab-design-system';
import type { DbQuestion } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

const MAX_TEXT_LENGTH = 60 as const;

interface QuestionTableProps {
  questions: DbQuestion[];
  onEdit: (question: DbQuestion) => void;
  onDelete: (question: DbQuestion) => void;
  onHardDelete: (question: DbQuestion) => void;
  onAdd: () => void;
}

type DifficultyFilter = 'All' | 'Easy' | 'Medium' | 'Hard';
type StatusFilter = 'All' | 'Active' | 'Inactive';

function DifficultyBadge({ difficulty }: { difficulty: DbQuestion['difficulty'] }) {
  const toneMap: Record<DbQuestion['difficulty'], 'success' | 'brand' | 'error'> = {
    Easy: 'success',
    Medium: 'brand',
    Hard: 'error',
  };
  const labels: Record<DbQuestion['difficulty'], string> = {
    Easy: '쉬움',
    Medium: '보통',
    Hard: '어려움',
  };
  return (
    <Badge variant="soft" tone={toneMap[difficulty]} size="sm">
      {labels[difficulty]}
    </Badge>
  );
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

const DIFFICULTY_OPTIONS = [
  { value: 'All', label: '난이도 전체' },
  { value: 'Easy', label: '쉬움' },
  { value: 'Medium', label: '보통' },
  { value: 'Hard', label: '어려움' },
];

const STATUS_OPTIONS = [
  { value: 'All', label: '상태 전체' },
  { value: 'Active', label: '활성' },
  { value: 'Inactive', label: '비활성' },
];

export function QuestionTable({
  questions,
  onEdit,
  onDelete,
  onHardDelete,
  onAdd,
}: QuestionTableProps) {
  const [searchText, setSearchText] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('All');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');

  const filtered = questions.filter((q) => {
    const matchesSearch =
      searchText === '' ||
      q.question_text.toLowerCase().includes(searchText.toLowerCase());
    const matchesDifficulty =
      difficultyFilter === 'All' || q.difficulty === difficultyFilter;
    const matchesStatus =
      statusFilter === 'All' || q.status === statusFilter;

    return matchesSearch && matchesDifficulty && matchesStatus;
  });

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-border-subtle bg-bg-surface-secondary py-16 text-center">
        <p className="text-sm text-text-secondary">등록된 문제가 없습니다.</p>
        <Button leftIcon={<Plus size={16} />} onClick={onAdd}>
          첫 번째 문제 추가
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 필터 바 */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-48">
          <Input
            label="문제 검색"
            placeholder="문제 내용으로 검색..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            aria-label="문제 텍스트 검색"
          />
        </div>
        <div className="w-36">
          <Select
            label="난이도"
            options={DIFFICULTY_OPTIONS}
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value as DifficultyFilter)}
            aria-label="난이도 필터"
          />
        </div>
        <div className="w-32">
          <Select
            label="상태"
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            aria-label="상태 필터"
          />
        </div>
        <Button leftIcon={<Plus size={16} />} onClick={onAdd} size="sm">
          문제 추가
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border-subtle bg-bg-surface-secondary py-12 text-center">
          <p className="text-sm text-text-secondary">
            검색 조건에 맞는 문제가 없습니다.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border-subtle shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[color:var(--border-subtle)]">
              <thead className="bg-bg-surface-secondary">
                <tr>
                  {['문제', '난이도', '상태', '정답', '시도/오답률', '관리'].map(
                    (h) => (
                      <th
                        key={h}
                        scope="col"
                        className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-text-secondary"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--border-subtle)] bg-bg-surface">
                {filtered.map((question) => {
                  const incorrectRate =
                    question.total_attempts > 0
                      ? Math.round(
                          (question.incorrect_count / question.total_attempts) * 100
                        )
                      : 0;

                  const truncatedText =
                    question.question_text.length > MAX_TEXT_LENGTH
                      ? question.question_text.slice(0, MAX_TEXT_LENGTH) + '...'
                      : question.question_text;

                  return (
                    <tr
                      key={question.id}
                      className="transition hover:bg-bg-surface-secondary"
                    >
                      <td className="max-w-xs px-4 py-3 text-sm text-text-primary">
                        <span title={question.question_text}>{truncatedText}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <DifficultyBadge difficulty={question.difficulty} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <StatusBadge status={question.status} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-text-secondary">
                        {question.correct_answer}번
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-text-secondary">
                        {question.total_attempts}회 /{' '}
                        <span
                          className={
                            incorrectRate >= 50
                              ? 'text-text-error font-semibold'
                              : 'text-text-secondary'
                          }
                        >
                          {incorrectRate}%
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onEdit(question)}
                            aria-label="문제 수정"
                            className="rounded-md p-1.5 text-text-secondary transition hover:bg-bg-surface-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus"
                          >
                            <Pencil size={15} aria-hidden="true" />
                          </button>
                          <button
                            onClick={() => onDelete(question)}
                            aria-label="문제 비활성화"
                            className="rounded-md p-1.5 text-text-secondary transition hover:bg-bg-surface-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus"
                          >
                            <Power size={15} aria-hidden="true" />
                          </button>
                          <button
                            onClick={() => onHardDelete(question)}
                            aria-label="문제 영구 삭제"
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
          <p className="border-t border-border-subtle px-4 py-2 text-xs text-text-secondary">
            {filtered.length}개 표시 (전체 {questions.length}개)
          </p>
        </div>
      )}
    </div>
  );
}
