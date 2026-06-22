'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from 'plab-design-system';
import { AlertCircle, Clock, XCircle, CheckCircle2 } from 'lucide-react';
import type { Session } from '@/types';

// ─── 상태 discriminated union ───────────────────────────────────────────────

type EnterState =
  | { status: 'loading' }
  | { status: 'ok' }
  | { status: 'invalid'; reason: 'completed' | 'other' }
  | { status: 'expired' }
  | { status: 'error'; message: string };

// ─── API 응답 타입 가드 ──────────────────────────────────────────────────────

interface VerifySuccessData {
  session: Session;
  redirect: string;
}

interface VerifySuccess {
  success: true;
  data: VerifySuccessData;
}

interface VerifyFailure {
  success: false;
  error: string;
  reason?: 'invalid' | 'expired' | 'completed';
}

function isVerifySuccess(v: unknown): v is VerifySuccess {
  if (typeof v !== 'object' || v === null) return false;
  const obj = v as Record<string, unknown>;
  if (obj['success'] !== true) return false;
  const data = obj['data'];
  if (typeof data !== 'object' || data === null) return false;
  const d = data as Record<string, unknown>;
  const session = d['session'];
  if (typeof session !== 'object' || session === null) return false;
  const s = session as Record<string, unknown>;
  return (
    typeof s['userId'] === 'string' &&
    typeof s['userName'] === 'string' &&
    typeof s['userPhone'] === 'string' &&
    typeof s['sessionToken'] === 'string' &&
    typeof d['redirect'] === 'string'
  );
}

function isVerifyFailure(v: unknown): v is VerifyFailure {
  if (typeof v !== 'object' || v === null) return false;
  const obj = v as Record<string, unknown>;
  return obj['success'] === false && typeof obj['error'] === 'string';
}

// ─── 실제 콘텐츠 컴포넌트 (useSearchParams 사용) ────────────────────────────

function EnterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<EnterState>({ status: 'loading' });

  const verify = useCallback(
    async (token: string) => {
      setState({ status: 'loading' });
      try {
        const response = await fetch('/api/invite/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const raw: unknown = await response.json();

        if (response.ok && isVerifySuccess(raw)) {
          localStorage.setItem('session', JSON.stringify(raw.data.session));
          setState({ status: 'ok' });
          router.push(raw.data.redirect);
          return;
        }

        if (!response.ok && isVerifyFailure(raw)) {
          const reason = raw.reason;
          if (reason === 'expired') {
            setState({ status: 'expired' });
          } else if (reason === 'completed') {
            setState({ status: 'invalid', reason: 'completed' });
          } else {
            setState({ status: 'invalid', reason: 'other' });
          }
          return;
        }

        // 예상치 못한 응답 형태
        setState({ status: 'invalid', reason: 'other' });
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : '네트워크 오류가 발생했습니다.';
        console.error('[enter] 초대 토큰 검증 오류:', err);
        setState({ status: 'error', message });
      }
    },
    [router]
  );

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setState({ status: 'invalid', reason: 'other' });
      return;
    }
    verify(token);
  }, [searchParams, verify]);

  // ── loading ─────────────────────────────────────────────────────────────
  if (state.status === 'loading') {
    return (
      <div className="mx-auto flex min-h-screen max-w-[480px] flex-col items-center justify-center bg-bg-surface-secondary px-5">
        <div className="flex w-full flex-col items-center gap-5 rounded-2xl border border-border-subtle bg-bg-surface px-8 py-10 text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-border-subtle border-t-bg-primary" />
          <p className="text-sm font-bold text-text-secondary">
            입장 확인 중...
          </p>
        </div>
      </div>
    );
  }

  // ── ok (리다이렉트 중) ───────────────────────────────────────────────────
  if (state.status === 'ok') {
    return (
      <div className="mx-auto flex min-h-screen max-w-[480px] flex-col items-center justify-center bg-bg-surface-secondary px-5">
        <div className="flex w-full flex-col items-center gap-5 rounded-2xl border border-border-subtle bg-bg-surface px-8 py-10 text-center">
          <CheckCircle2 className="h-12 w-12 text-text-success" aria-hidden="true" />
          <p className="text-sm font-bold text-text-secondary">
            확인되었습니다. 이동 중...
          </p>
        </div>
      </div>
    );
  }

  // ── expired ─────────────────────────────────────────────────────────────
  if (state.status === 'expired') {
    return (
      <div className="mx-auto flex min-h-screen max-w-[480px] flex-col items-center justify-center bg-bg-surface-secondary px-5">
        <div className="flex w-full flex-col items-center gap-6 rounded-2xl border border-border-subtle bg-bg-surface px-8 py-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border-subtle bg-bg-surface-secondary">
            <Clock className="h-7 w-7 text-text-tertiary" aria-hidden="true" />
          </div>
          <div>
            <h1 className="mb-2 text-xl font-bold text-text-primary">
              링크가 만료되었습니다
            </h1>
            <p className="text-sm leading-relaxed text-text-secondary">
              초대 링크의 유효 기간이 지났습니다.
              <br />
              새로운 링크를 요청해주세요.
            </p>
          </div>
          <Button
            variant="solid"
            size="lg"
            onClick={() => router.push('/')}
            className="w-full"
          >
            처음으로
          </Button>
        </div>
      </div>
    );
  }

  // ── error (네트워크 등) ─────────────────────────────────────────────────
  if (state.status === 'error') {
    const token = searchParams.get('token');
    return (
      <div className="mx-auto flex min-h-screen max-w-[480px] flex-col items-center justify-center bg-bg-surface-secondary px-5">
        <div className="flex w-full flex-col items-center gap-6 rounded-2xl border border-border-subtle bg-bg-surface px-8 py-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border-subtle bg-bg-surface-secondary">
            <AlertCircle className="h-7 w-7 text-text-error" aria-hidden="true" />
          </div>
          <div>
            <h1 className="mb-2 text-xl font-bold text-text-primary">
              연결 오류
            </h1>
            <p className="text-sm leading-relaxed text-text-secondary">
              {state.message}
            </p>
          </div>
          <div className="flex w-full flex-col gap-3">
            <Button
              variant="solid"
              size="lg"
              onClick={() => {
                if (token) verify(token);
              }}
              className="w-full"
            >
              다시 시도
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.push('/')}
              className="w-full"
            >
              처음으로
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── invalid (무효 링크 / 이미 완료) ────────────────────────────────────
  const isCompleted = state.reason === 'completed';
  return (
    <div className="mx-auto flex min-h-screen max-w-[480px] flex-col items-center justify-center bg-bg-surface-secondary px-5">
      <div className="flex w-full flex-col items-center gap-6 rounded-2xl border border-border-subtle bg-bg-surface px-8 py-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border-subtle bg-bg-surface-secondary">
          <XCircle className="h-7 w-7 text-text-error" aria-hidden="true" />
        </div>
        <div>
          <h1 className="mb-2 text-xl font-bold text-text-primary">
            {isCompleted ? '이미 완료하셨습니다' : '유효하지 않은 링크입니다'}
          </h1>
          <p className="text-sm leading-relaxed text-text-secondary">
            {isCompleted
              ? '이미 온라인 실습을 완료하셨습니다.\n중복으로 입장할 수 없습니다.'
              : '링크가 올바르지 않거나 더 이상 사용할 수 없습니다.\n담당자에게 문의해주세요.'}
          </p>
        </div>
        <Button
          variant="solid"
          size="lg"
          onClick={() => router.push('/')}
          className="w-full"
        >
          처음으로
        </Button>
      </div>
    </div>
  );
}

// ─── 페이지 루트 (Suspense 경계) ─────────────────────────────────────────────

export default function EnterPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-screen max-w-[480px] flex-col items-center justify-center bg-bg-surface-secondary px-5">
          <div className="flex w-full flex-col items-center gap-5 rounded-2xl border border-border-subtle bg-bg-surface px-8 py-10 text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-border-subtle border-t-bg-primary" />
            <p className="text-sm font-bold text-text-secondary">로딩 중...</p>
          </div>
        </div>
      }
    >
      <EnterContent />
    </Suspense>
  );
}
