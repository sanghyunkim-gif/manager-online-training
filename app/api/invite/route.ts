import { NextRequest, NextResponse } from 'next/server';
import { generateInviteToken, hashToken, timingSafeCompare } from '@/lib/invite/token';
import { createInvite } from '@/lib/supabase/invites';
import { validateInviteCreate } from '@/lib/validation/invite';

export const runtime = 'nodejs';

export async function POST(request: NextRequest): Promise<NextResponse> {
  // X-API-Key 상수시간 검증 — 미설정 시에도 fail-closed (401)
  const apiKey = request.headers.get('X-API-Key') ?? '';
  const expectedKey = process.env.INVITE_API_KEY ?? '';

  if (!expectedKey || !timingSafeCompare(apiKey, expectedKey)) {
    return NextResponse.json(
      { success: false, error: 'unauthorized' },
      { status: 401 }
    );
  }

  // 요청 본문 파싱
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: '요청 본문을 파싱할 수 없습니다.' },
      { status: 400 }
    );
  }

  // 입력 검증
  const validation = validateInviteCreate(body);
  if (!validation.ok) {
    return NextResponse.json(
      { success: false, error: validation.error },
      { status: 400 }
    );
  }

  const { applicantId, callbackUrl, name, phone } = validation.value;

  try {
    // 토큰 생성 + 해시 저장
    const token = generateInviteToken();
    const tokenHash = hashToken(token);

    const invite = await createInvite({
      applicantId,
      tokenHash,
      callbackUrl,
      ...(name !== undefined ? { name } : {}),
      ...(phone !== undefined ? { phone } : {}),
    });

    // 초대 링크 구성
    const base =
      process.env.NEXT_PUBLIC_APP_URL || 'https://manager-online-training.vercel.app';
    const url = `${base}/enter?token=${token}`;

    return NextResponse.json({
      success: true,
      data: {
        token,
        url,
        expiresAt: invite.expires_at,
      },
    });
  } catch (err: unknown) {
    // 내부 오류(DB 제약·스키마 등)는 서버 로그에만 남기고 클라이언트에는 generic 메시지 반환
    console.error('[POST /api/invite] 초대 발급 실패:', err instanceof Error ? err.message : err);
    return NextResponse.json(
      { success: false, error: '초대 발급 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
