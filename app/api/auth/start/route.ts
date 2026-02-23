import { NextRequest, NextResponse } from 'next/server';
import { createOrGetUser } from '@/lib/supabase/users';
import type { ApiResponse, Session } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, region, applicationReason } = body;

    if (!name || !phone) {
      return NextResponse.json(
        {
          success: false,
          error: '이름과 전화번호를 입력해주세요.',
        } as ApiResponse,
        { status: 400 }
      );
    }

    if (!region || !applicationReason) {
      return NextResponse.json(
        {
          success: false,
          error: '지역과 지원동기를 선택해주세요.',
        } as ApiResponse,
        { status: 400 }
      );
    }

    const user = await createOrGetUser(name, phone, region, applicationReason);

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
        user,
      },
    } as ApiResponse);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '인증 처리 중 오류가 발생했습니다.';

    return NextResponse.json(
      {
        success: false,
        error: message,
      } as ApiResponse,
      { status: 500 }
    );
  }
}
