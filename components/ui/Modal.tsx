'use client';

import { type ReactNode } from 'react';
import { FullModal } from 'plab-design-system';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** 모달 패널 최대 너비 클래스 (기본 max-w-lg). FullModal은 전체화면이므로 미사용 */
  maxWidthClass?: string;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidthClass: _maxWidthClass,
}: ModalProps): ReactNode {
  return (
    <FullModal
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
      title={title}
      showClose
    >
      {children}
    </FullModal>
  );
}
