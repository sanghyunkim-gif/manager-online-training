'use client';

import { useState, useEffect, useId } from 'react';
import type { DbQuestion, DbChapter } from '@/types';
import type { QuestionCreateInput } from '@/lib/supabase/questions';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';

type CorrectAnswer = '1' | '2' | '3' | '4';

interface QuestionFormModalProps {
  open: boolean;
  onClose: () => void;
  question?: DbQuestion;
  chapters: DbChapter[];
  defaultChapterId?: string;
  onSubmit: (payload: QuestionCreateInput) => Promise<void>;
}

type FormState = {
  chapter_id: string;
  question_text: string;
  question_image: string;
  option_1: string;
  option_2: string;
  option_3: string;
  option_4: string;
  correct_answer: CorrectAnswer;
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  status: 'Active' | 'Inactive';
};

interface FormErrors {
  chapter_id?: string;
  question_text?: string;
  option_1?: string;
  option_2?: string;
  correct_answer?: string;
}

const DIFFICULTY_OPTIONS = [
  { value: 'Easy', label: '쉬움' },
  { value: 'Medium', label: '보통' },
  { value: 'Hard', label: '어려움' },
];

const STATUS_OPTIONS = [
  { value: 'Active', label: '활성' },
  { value: 'Inactive', label: '비활성' },
];

const ANSWER_OPTIONS: CorrectAnswer[] = ['1', '2', '3', '4'];

function buildForm(
  question?: DbQuestion,
  defaultChapterId?: string
): FormState {
  if (question) {
    return {
      chapter_id: question.chapter_id,
      question_text: question.question_text,
      question_image: question.question_image ?? '',
      option_1: question.option_1,
      option_2: question.option_2,
      option_3: question.option_3,
      option_4: question.option_4,
      correct_answer: question.correct_answer,
      explanation: question.explanation ?? '',
      difficulty: question.difficulty,
      status: question.status,
    };
  }
  return {
    chapter_id: defaultChapterId ?? '',
    question_text: '',
    question_image: '',
    option_1: '',
    option_2: '',
    option_3: '',
    option_4: '',
    correct_answer: '1',
    explanation: '',
    difficulty: 'Medium',
    status: 'Active',
  };
}

export function QuestionFormModal({
  open,
  onClose,
  question,
  chapters,
  defaultChapterId,
  onSubmit,
}: QuestionFormModalProps) {
  const [form, setForm] = useState<FormState>(() =>
    buildForm(question, defaultChapterId)
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const radioGroupId = useId();

  useEffect(() => {
    if (open) {
      setForm(buildForm(question, defaultChapterId));
      setErrors({});
    }
  }, [open, question, defaultChapterId]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const optionValues: Record<CorrectAnswer, string> = {
    '1': form.option_1,
    '2': form.option_2,
    '3': form.option_3,
    '4': form.option_4,
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.chapter_id) newErrors.chapter_id = '챕터를 선택해주세요.';
    if (!form.question_text.trim()) newErrors.question_text = '문제 내용은 필수입니다.';
    if (!form.option_1.trim()) newErrors.option_1 = '보기 1은 필수입니다.';
    if (!form.option_2.trim()) newErrors.option_2 = '보기 2는 필수입니다.';
    // 정답으로 선택된 보기가 비어있으면 경고
    const selectedOptionValue = optionValues[form.correct_answer];
    if (!selectedOptionValue.trim()) {
      newErrors.correct_answer = `정답으로 선택한 ${form.correct_answer}번 보기가 비어있습니다.`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload: QuestionCreateInput = {
        chapter_id: form.chapter_id,
        question_text: form.question_text,
        question_image: form.question_image || null,
        option_1: form.option_1,
        option_2: form.option_2,
        option_3: form.option_3,
        option_4: form.option_4,
        correct_answer: form.correct_answer,
        explanation: form.explanation || null,
        difficulty: form.difficulty,
        status: form.status,
      };
      await onSubmit(payload);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const chapterOptions = chapters.map((c) => ({
    value: c.id,
    label: `${c.order}. ${c.name}`,
  }));

  const title = question ? '문제 수정' : '문제 추가';

  return (
    <Modal open={open} onClose={onClose} title={title} maxWidthClass="max-w-2xl">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {/* 챕터 선택 (수정 시 비활성화) */}
        <Select
          label="챕터"
          options={chapterOptions}
          value={form.chapter_id}
          onChange={(e) => setField('chapter_id', e.target.value)}
          placeholder="챕터를 선택하세요"
          error={errors.chapter_id}
          disabled={!!question}
          required
        />

        <Textarea
          label="문제 내용"
          placeholder="문제를 입력하세요."
          rows={3}
          value={form.question_text}
          onChange={(e) => setField('question_text', e.target.value)}
          error={errors.question_text}
          required
        />

        <Input
          label="문제 이미지 URL (선택)"
          type="url"
          placeholder="https://..."
          value={form.question_image}
          onChange={(e) => setField('question_image', e.target.value)}
        />

        {/* 보기 4개 */}
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-sm font-semibold text-text-primary">
            보기 (최소 2개 필수)
          </legend>
          {ANSWER_OPTIONS.map((num) => {
            const fieldKey = `option_${num}` as keyof FormState;
            const errorKey = `option_${num}` as keyof FormErrors;
            return (
              <Input
                key={num}
                label={`보기 ${num}`}
                placeholder={`보기 ${num}를 입력하세요`}
                value={form[fieldKey] as string}
                onChange={(e) => setField(fieldKey, e.target.value)}
                error={errors[errorKey]}
                required={num === '1' || num === '2'}
              />
            );
          })}
        </fieldset>

        {/* 정답 선택 */}
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-text-primary">
            정답 선택 *
          </legend>
          <div className="flex flex-wrap gap-3">
            {ANSWER_OPTIONS.map((num) => {
              const optionText = optionValues[num];
              const isEmpty = !optionText.trim();
              const radioId = `${radioGroupId}-answer-${num}`;
              return (
                <label
                  key={num}
                  htmlFor={radioId}
                  className={[
                    'flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition',
                    form.correct_answer === num
                      ? 'border-border-focused bg-bg-surface-secondary text-text-brand font-semibold'
                      : isEmpty
                      ? 'cursor-not-allowed border-border-subtle bg-bg-surface-secondary text-text-tertiary'
                      : 'border-border-default bg-bg-surface text-text-secondary hover:border-border-strong',
                  ].join(' ')}
                >
                  <input
                    type="radio"
                    id={radioId}
                    name={`${radioGroupId}-correct_answer`}
                    value={num}
                    checked={form.correct_answer === num}
                    onChange={() => setField('correct_answer', num)}
                    disabled={isEmpty}
                    className="accent-[var(--bg-primary)]"
                    aria-label={`정답 ${num}번${isEmpty ? ' (보기 없음)' : `: ${optionText}`}`}
                  />
                  {num}번{isEmpty ? <span className="text-xs text-text-tertiary">(비어있음)</span> : ''}
                </label>
              );
            })}
          </div>
          {errors.correct_answer && (
            <p role="alert" className="mt-1 text-xs font-medium text-text-error">
              {errors.correct_answer}
            </p>
          )}
        </fieldset>

        <Textarea
          label="해설 (선택)"
          placeholder="정답 해설을 입력하세요."
          rows={2}
          value={form.explanation}
          onChange={(e) => setField('explanation', e.target.value)}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="난이도"
            options={DIFFICULTY_OPTIONS}
            value={form.difficulty}
            onChange={(e) =>
              setField('difficulty', e.target.value as FormState['difficulty'])
            }
          />
          <Select
            label="상태"
            options={STATUS_OPTIONS}
            value={form.status}
            onChange={(e) =>
              setField('status', e.target.value as 'Active' | 'Inactive')
            }
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-border-subtle pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {question ? '저장' : '추가'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
