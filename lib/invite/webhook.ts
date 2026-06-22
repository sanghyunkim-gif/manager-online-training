/**
 * 완료 웹훅 발송 모듈. node:crypto HMAC-SHA256 서명 + 3회 지수 백오프.
 * 이 파일을 import 하는 route는 반드시 export const runtime = 'nodejs' 선언 필요.
 */
import { createHmac } from 'node:crypto';
import type { DbInvite } from '@/lib/supabase/invites';
import { claimInviteForCompletion, recordWebhookResult } from '@/lib/supabase/invites';

const MAX_ATTEMPTS = 3;
// 지수 백오프 딜레이(ms): 1회 실패 후 500ms, 2회 실패 후 1000ms, 3회 실패 후 2000ms
const BACKOFF_DELAYS: [number, number, number] = [500, 1000, 2000];

/**
 * rawBody를 HMAC-SHA256으로 서명해 hex 문자열로 반환한다.
 */
export function signWebhook(secret: string, bodyString: string): string {
  return createHmac('sha256', secret).update(bodyString).digest('hex');
}

interface WebhookPayload {
  applicantId: string;
  status: 'passed';
  completedAt: string;
  trainingId?: string;
}

/**
 * 웹훅 페이로드를 생성한다.
 */
export function buildPayload(invite: DbInvite): WebhookPayload {
  return {
    applicantId: invite.applicant_id,
    status: 'passed',
    completedAt: (invite.completed_at ?? new Date().toISOString()),
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 완료 웹훅을 발송한다. 3회 지수 백오프 재시도.
 * WEBHOOK_SIGNING_SECRET 미설정 시 fail-closed: console.error 후 즉시 return.
 */
export async function sendCompletionWebhook(invite: DbInvite): Promise<void> {
  const secret = process.env.WEBHOOK_SIGNING_SECRET;
  if (!secret) {
    console.error(
      '[webhook] WEBHOOK_SIGNING_SECRET이 설정되지 않았습니다. 웹훅 발송을 중단합니다.',
      { inviteId: invite.id, applicantId: invite.applicant_id }
    );
    return;
  }

  const payload = buildPayload(invite);
  const rawBody = JSON.stringify(payload);
  const signature = signWebhook(secret, rawBody);

  let lastError: string | undefined;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(invite.callback_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Signature': signature,
        },
        body: rawBody,
      });

      if (response.ok) {
        await recordWebhookResult(invite.id, { success: true, attempts: attempt });
        return;
      }

      lastError = `HTTP ${response.status} ${response.statusText}`;
      console.warn(
        `[webhook] 웹훅 발송 실패 (시도 ${attempt}/${MAX_ATTEMPTS}):`,
        lastError,
        { inviteId: invite.id }
      );
    } catch (err: unknown) {
      lastError = err instanceof Error ? err.message : '알 수 없는 네트워크 오류';
      console.warn(
        `[webhook] 웹훅 발송 예외 (시도 ${attempt}/${MAX_ATTEMPTS}):`,
        lastError,
        { inviteId: invite.id }
      );
    }

    // 마지막 시도가 아니면 지수 백오프 대기
    if (attempt < MAX_ATTEMPTS) {
      await sleep(BACKOFF_DELAYS[attempt - 1]);
    }
  }

  // 모든 재시도 소진 — 실패 기록
  console.error(
    '[webhook] 웹훅 최종 실패. 수동 재시도가 필요합니다.',
    { inviteId: invite.id, applicantId: invite.applicant_id, lastError }
  );
  await recordWebhookResult(invite.id, {
    success: false,
    attempts: MAX_ATTEMPTS,
    error: lastError,
  });
}

/**
 * userId로 완료된 초대를 멱등 클레임하고 웹훅을 발송한다.
 * after()로 감싸 호출하면 응답 반환 후 비동기로 처리된다.
 * claimInviteForCompletion이 null을 반환하면 (fallback user이거나 이미 처리) 아무 것도 하지 않는다.
 */
export async function fireCompletionWebhookIfPending(userId: string): Promise<void> {
  try {
    const invite = await claimInviteForCompletion(userId);
    if (!invite) {
      // invite 없음(일반 입장 user) 또는 이미 completed/failed — 정상 케이스
      return;
    }
    await sendCompletionWebhook(invite);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    console.error('[fireCompletionWebhookIfPending] 처리 중 오류:', message, { userId });
  }
}
