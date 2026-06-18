'use client';

import { type ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** 모달 패널 최대 너비 클래스 (기본 max-w-lg). */
  maxWidthClass?: string;
}

/**
 * 데스크탑 중앙 팝업 모달.
 * 어드민은 데스크탑 뷰이므로 전체화면(FullModal) 대신 중앙 다이얼로그로 띄운다.
 * 오버레이/ESC 닫기, body 스크롤 잠금, 긴 폼 내부 스크롤(max-h)을 지원한다.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidthClass = 'max-w-lg',
}: ModalProps): ReactNode {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-scrim-default p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`flex max-h-[90vh] w-full ${maxWidthClass} flex-col overflow-hidden rounded-2xl border border-border-subtle bg-bg-surface shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-border-subtle px-6 py-4">
          <h2 className="text-lg font-bold text-text-primary">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="rounded-md p-1 text-text-secondary transition hover:bg-bg-surface-secondary hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focused"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
