// 서버 전용 모듈. service_role 클라이언트를 supabase 별칭으로 사용한다.
import { supabaseAdmin as supabase } from './client';

export type InviteStatus = 'issued' | 'entered' | 'completed' | 'expired' | 'failed';

export interface DbInvite {
  id: string;
  applicant_id: string;
  token_hash: string;
  callback_url: string;
  status: InviteStatus;
  user_id: string | null;
  name: string | null;
  phone: string | null;
  expires_at: string;
  entered_at: string | null;
  completed_at: string | null;
  webhook_attempts: number;
  last_webhook_error: string | null;
  created_at: string;
  updated_at: string;
}

interface CreateInviteParams {
  applicantId: string;
  tokenHash: string;
  callbackUrl: string;
  name?: string;
  phone?: string;
}

/**
 * 새 초대를 발급한다. 만료 기간은 14일이다.
 */
export async function createInvite(params: CreateInviteParams): Promise<DbInvite> {
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  const insertData: Record<string, unknown> = {
    applicant_id: params.applicantId,
    token_hash: params.tokenHash,
    callback_url: params.callbackUrl,
    status: 'issued',
    expires_at: expiresAt,
  };

  if (params.name !== undefined) {
    insertData['name'] = params.name;
  }
  if (params.phone !== undefined) {
    insertData['phone'] = params.phone;
  }

  const { data, error } = await supabase
    .from('invites')
    .insert(insertData)
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || '초대를 생성할 수 없습니다.');
  }

  return data as DbInvite;
}

/**
 * 토큰 해시로 초대를 조회한다.
 */
export async function getInviteByTokenHash(hash: string): Promise<DbInvite | null> {
  const { data, error } = await supabase
    .from('invites')
    .select('*')
    .eq('token_hash', hash)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as DbInvite | null;
}

/**
 * 초대를 issued → entered 상태로 전이한다 (CAS — 이미 entered 이상이면 조작하지 않음).
 * user_id를 연결하고 entered_at을 기록한다.
 */
export async function markInviteEntered(inviteId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('invites')
    .update({
      status: 'entered',
      user_id: userId,
      entered_at: new Date().toISOString(),
    })
    .eq('id', inviteId)
    .eq('status', 'issued');

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * 멱등 완료 클레임. user_id=userId AND status='entered' 인 행을 CAS로 completed로 전이한다.
 * 성공 시 갱신된 행을 반환, 해당 행이 없으면 null(이미 처리됐거나 invite 없음).
 */
export async function claimInviteForCompletion(userId: string): Promise<DbInvite | null> {
  const { data, error } = await supabase
    .from('invites')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('status', 'entered')
    .select()
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as DbInvite | null;
}

interface WebhookResultParams {
  success: boolean;
  attempts: number;
  error?: string;
}

/**
 * 웹훅 결과를 기록한다. 실패 시 status='failed'와 오류 메시지를 저장한다.
 */
export async function recordWebhookResult(
  inviteId: string,
  result: WebhookResultParams
): Promise<void> {
  const updateData: Record<string, unknown> = {
    webhook_attempts: result.attempts,
  };

  if (!result.success) {
    updateData['status'] = 'failed';
    updateData['last_webhook_error'] = result.error ?? '알 수 없는 오류';
  }

  const { error } = await supabase
    .from('invites')
    .update(updateData)
    .eq('id', inviteId);

  if (error) {
    // 웹훅 결과 기록 실패 자체는 핵심 플로우를 막아선 안 되지만 로그는 남긴다.
    console.error('[recordWebhookResult] 웹훅 결과 기록 실패:', error.message);
  }
}
