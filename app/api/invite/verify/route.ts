import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { hashToken } from '@/lib/invite/token';
import {
  getInviteByTokenHash,
  markInviteEntered,
} from '@/lib/supabase/invites';
import { supabaseAdmin as supabase } from '@/lib/supabase/client';
import { createOrGetUser, findUserByPhone, getUserById } from '@/lib/supabase/users';
import { validateInviteVerify } from '@/lib/validation/invite';
import type { Session } from '@/types';

export const runtime = 'nodejs';

function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 요청 본문 파싱
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: '요청 본문을 파싱할 수 없습니다.', reason: 'invalid' as const },
      { status: 400 }
    );
  }

  // 입력 검증
  const validation = validateInviteVerify(body);
  if (!validation.ok) {
    return NextResponse.json(
      { success: false, error: validation.error, reason: 'invalid' as const },
      { status: 400 }
    );
  }

  const { token } = validation.value;

  // 토큰 해시 → DB 조회
  let invite;
  try {
    const tokenHash = hashToken(token);
    invite = await getInviteByTokenHash(tokenHash);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '토큰 조회 중 오류가 발생했습니다.';
    console.error('[POST /api/invite/verify] 토큰 조회 실패:', message);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.', reason: 'invalid' as const },
      { status: 500 }
    );
  }

  if (!invite) {
    return NextResponse.json(
      { success: false, error: '유효하지 않은 초대 토큰입니다.', reason: 'invalid' as const },
      { status: 404 }
    );
  }

  // 이미 완료된 초대
  if (invite.status === 'completed') {
    return NextResponse.json(
      { success: false, error: '이미 완료된 초대입니다.', reason: 'completed' as const },
      { status: 409 }
    );
  }

  // 만료 확인
  if (new Date(invite.expires_at) < new Date()) {
    // 상태를 expired로 갱신 (best-effort, 실패해도 응답은 내려감)
    try {
      await supabase
        .from('invites')
        .update({ status: 'expired' })
        .eq('id', invite.id)
        .eq('status', 'issued');
    } catch (err: unknown) {
      console.warn('[POST /api/invite/verify] expired 상태 갱신 실패:', err);
    }
    return NextResponse.json(
      { success: false, error: '만료된 초대 토큰입니다.', reason: 'expired' as const },
      { status: 410 }
    );
  }

  // 유효 상태(issued 또는 entered) — user lazy 확보
  try {
    let user;

    if (invite.user_id) {
      // 이미 연결된 user 사용
      user = await getUserById(invite.user_id);
      if (!user) {
        return NextResponse.json(
          { success: false, error: '연결된 사용자를 찾을 수 없습니다.', reason: 'invalid' as const },
          { status: 404 }
        );
      }

      // Completed 상태이면 이미 완료 처리
      if (user.status === 'Completed') {
        return NextResponse.json(
          { success: false, error: '이미 완료된 사용자입니다.', reason: 'completed' as const },
          { status: 409 }
        );
      }

      // session_token 재발급
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ session_token: generateSessionToken() })
        .eq('id', user.id)
        .select()
        .single();

      if (updateError || !updatedUser) {
        throw new Error('세션 토큰 갱신에 실패했습니다.');
      }
      user = updatedUser;
    } else {
      // invite에 name/phone이 있으면 createOrGetUser, 없으면 applicant_id 합성 phone으로 생성
      // DbInvite 타입에 name/phone이 포함되어 있으므로 직접 접근 가능
      const inviteName = typeof invite.name === 'string' && invite.name.length > 0
        ? invite.name
        : undefined;
      const invitePhone = typeof invite.phone === 'string' && invite.phone.length > 0
        ? invite.phone
        : undefined;

      if (inviteName && invitePhone) {
        // createOrGetUser는 Completed이면 throw — 아래 catch에서 처리
        user = await createOrGetUser(inviteName, invitePhone);
      } else {
        // applicant_id 기반 합성 phone — 재진입 시 동일 user 반환
        const syntheticPhone = `invite-${invite.applicant_id}`;
        const existingUser = await findUserByPhone(syntheticPhone);

        if (existingUser) {
          if (existingUser.status === 'Completed') {
            return NextResponse.json(
              {
                success: false,
                error: '이미 완료된 사용자입니다.',
                reason: 'completed' as const,
              },
              { status: 409 }
            );
          }
          // 기존 user — session_token 갱신
          const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update({ session_token: generateSessionToken() })
            .eq('id', existingUser.id)
            .select()
            .single();

          if (updateError || !updatedUser) {
            throw new Error('세션 토큰 갱신에 실패했습니다.');
          }
          user = updatedUser;
        } else {
          // 신규 user 생성 — name 없으면 applicant_id를 name으로 사용
          user = await createOrGetUser(invite.applicant_id, syntheticPhone);
        }
      }

      // issued 상태인 경우에만 entered로 전이 (entered는 이미 연결됨)
      if (invite.status === 'issued') {
        await markInviteEntered(invite.id, user.id);
      }
    }

    const session: Session = {
      userId: user.id,
      userName: user.name,
      userPhone: user.phone,
      sessionToken: user.session_token || '',
    };

    return NextResponse.json({
      success: true,
      data: {
        session,
        redirect: '/learn',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '사용자 처리 중 오류가 발생했습니다.';

    // createOrGetUser가 Completed 사용자에 대해 throw하는 경우
    if (message.includes('이미 온라인 실습을 완료하셨습니다')) {
      return NextResponse.json(
        { success: false, error: message, reason: 'completed' as const },
        { status: 409 }
      );
    }

    console.error('[POST /api/invite/verify] 처리 실패:', message);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
