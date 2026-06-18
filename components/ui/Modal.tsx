'use client';

import {
  useEffect,
  useRef,
  type ReactNode,
  type KeyboardEvent,
} from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** 모달 패널 최대 너비 클래스 (기본 max-w-lg) */
  maxWidthClass?: string;
}

const FOCUSABLE_SELECTORS = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidthClass = 'max-w-lg',
}: ModalProps): ReactNode {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Esc 닫기
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // 포커스 트랩
  useEffect(() => {
    if (!open) return;

    // 마운트 시 닫기 버튼으로 포커스 이동
    const raf = requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    return () => cancelAnimationFrame(raf);
  }, [open]);

  // body 스크롤 잠금
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  const handleTabTrap = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab' || !panelRef.current) return;

    const focusable = Array.from(
      panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="presentation"
    >
      {/* 백드롭 */}
      <div
        className="absolute inset-0 bg-neutral-900/60"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 패널 */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={[
          'relative z-10 w-full mx-4 rounded-lg bg-neutral-50 shadow-md',
          'max-h-[90vh] overflow-y-auto',
          maxWidthClass,
        ].join(' ')}
        onKeyDown={handleTabTrap}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <h2
            id="modal-title"
            className="text-base font-bold text-neutral-800"
          >
            {title}
          </h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="닫기"
            className="rounded-md p-1.5 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* 본문 */}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
