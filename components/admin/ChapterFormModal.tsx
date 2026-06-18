'use client';

import { useState, useEffect } from 'react';
import type { DbChapter } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';

type ChapterPayload = {
  name: string;
  order: number;
  video_url: string;
  video_duration: number;
  required_watch_percentage: number;
  description: string | null;
  status: 'Active' | 'Inactive';
};

interface ChapterFormModalProps {
  open: boolean;
  onClose: () => void;
  chapter?: DbChapter;
  onSubmit: (payload: ChapterPayload) => Promise<void>;
}

const STATUS_OPTIONS = [
  { value: 'Active', label: '활성' },
  { value: 'Inactive', label: '비활성' },
];

const DEFAULT_FORM: ChapterPayload = {
  name: '',
  order: 1,
  video_url: '',
  video_duration: 0,
  required_watch_percentage: 60,
  description: null,
  status: 'Active',
};

function buildForm(chapter?: DbChapter): ChapterPayload {
  if (!chapter) return DEFAULT_FORM;
  return {
    name: chapter.name,
    order: chapter.order,
    video_url: chapter.video_url,
    video_duration: chapter.video_duration,
    required_watch_percentage: chapter.required_watch_percentage,
    description: chapter.description,
    status: chapter.status,
  };
}

interface FormErrors {
  name?: string;
  order?: string;
  video_url?: string;
  video_duration?: string;
  required_watch_percentage?: string;
}

export function ChapterFormModal({
  open,
  onClose,
  chapter,
  onSubmit,
}: ChapterFormModalProps) {
  const [form, setForm] = useState<ChapterPayload>(() => buildForm(chapter));
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // chapter prop이 바뀌면 폼 리셋 (열릴 때마다)
  useEffect(() => {
    if (open) {
      setForm(buildForm(chapter));
      setErrors({});
    }
  }, [open, chapter]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.name.trim()) newErrors.name = '챕터명은 필수입니다.';
    if (form.order < 1) newErrors.order = '순서는 1 이상이어야 합니다.';
    if (!form.video_url.trim()) newErrors.video_url = '영상 URL은 필수입니다.';
    if (form.video_duration < 1)
      newErrors.video_duration = '영상 길이는 1초 이상이어야 합니다.';
    if (
      form.required_watch_percentage < 1 ||
      form.required_watch_percentage > 100
    )
      newErrors.required_watch_percentage = '1~100 사이 값을 입력하세요.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(form);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const setField = <K extends keyof ChapterPayload>(
    key: K,
    value: ChapterPayload[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const title = chapter ? '챕터 수정' : '챕터 추가';

  return (
    <Modal open={open} onClose={onClose} title={title} maxWidthClass="max-w-xl">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Input
          label="챕터명"
          placeholder="예: 챕터 1 - 기초 전술 이해"
          value={form.name}
          onChange={(e) => setField('name', e.target.value)}
          error={errors.name}
          required
        />

        <Input
          label="순서"
          type="number"
          min={1}
          placeholder="1"
          value={String(form.order)}
          onChange={(e) => setField('order', Number(e.target.value))}
          error={errors.order}
          required
        />

        <Input
          label="YouTube URL"
          type="url"
          placeholder="https://www.youtube.com/watch?v=..."
          value={form.video_url}
          onChange={(e) => setField('video_url', e.target.value)}
          error={errors.video_url}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="영상 길이 (초)"
            type="number"
            min={1}
            placeholder="600"
            value={String(form.video_duration)}
            onChange={(e) => setField('video_duration', Number(e.target.value))}
            error={errors.video_duration}
            required
          />

          <Input
            label="필수 시청률 (%)"
            type="number"
            min={1}
            max={100}
            placeholder="60"
            value={String(form.required_watch_percentage)}
            onChange={(e) =>
              setField('required_watch_percentage', Number(e.target.value))
            }
            error={errors.required_watch_percentage}
            required
          />
        </div>

        <Textarea
          label="설명 (선택)"
          placeholder="챕터에 대한 설명을 입력하세요."
          rows={3}
          value={form.description ?? ''}
          onChange={(e) =>
            setField('description', e.target.value || null)
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
            {chapter ? '저장' : '추가'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
