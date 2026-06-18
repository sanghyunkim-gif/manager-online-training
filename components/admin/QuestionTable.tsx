'use client';

import { useState } from 'react';
import { Pencil, Trash2, Power, Plus, Search, Filter } from 'lucide-react';
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
  const classes: Record<DbQuestion['difficulty'], string> = {
    Easy: 'bg-success-50 text-success-700 border border-success-200',
    Medium: 'bg-primary-50 text-primary-700 border border-primary-200',
    Hard: 'bg-accent-50 text-accent-700 border border-accent-200',
  };
  const labels: Record<DbQuestion['difficulty'], string> = {
    Easy: '쉬움',
    Medium: '보통',
    Hard: '어려움',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${classes[difficulty]}`}
    >
      {labels[difficulty]}
    </span>
  );
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
      <div className="flex flex-col items-center gap-4 rounded-lg border border-neutral-200 bg-neutral-50 py-16 text-center">
        <p className="text-sm text-neutral-500">등록된 문제가 없습니다.</p>
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
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 py-12 text-center">
          <p className="text-sm text-neutral-500">
            검색 조건에 맞는 문제가 없습니다.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-neutral-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-100">
                <tr>
                  {['문제', '난이도', '상태', '정답', '시도/오답률', '관리'].map(
                    (h) => (
                      <th
                        key={h}
                        scope="col"
                        className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-neutral-600"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-neutral-50">
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
                      className="transition hover:bg-neutral-100"
                    >
                      <td className="max-w-xs px-4 py-3 text-sm text-neutral-800">
                        <span title={question.question_text}>{truncatedText}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <DifficultyBadge difficulty={question.difficulty} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <StatusBadge status={question.status} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-neutral-700">
                        {question.correct_answer}번
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-600">
                        {question.total_attempts}회 /{' '}
                        <span
                          className={
                            incorrectRate >= 50
                              ? 'text-accent-600 font-semibold'
                              : 'text-neutral-600'
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
                            className="rounded-md p-1.5 text-neutral-500 transition hover:bg-neutral-200 hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                          >
                            <Pencil size={15} aria-hidden="true" />
                          </button>
                          <button
                            onClick={() => onDelete(question)}
                            aria-label="문제 비활성화"
                            className="rounded-md p-1.5 text-neutral-500 transition hover:bg-neutral-200 hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                          >
                            <Power size={15} aria-hidden="true" />
                          </button>
                          <button
                            onClick={() => onHardDelete(question)}
                            aria-label="문제 영구 삭제"
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
          <p className="border-t border-neutral-100 px-4 py-2 text-xs text-neutral-500">
            {filtered.length}개 표시 (전체 {questions.length}개)
          </p>
        </div>
      )}
    </div>
  );
}
