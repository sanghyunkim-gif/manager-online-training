import { NextRequest, NextResponse } from 'next/server';
import { completeUser } from '@/lib/supabase/users';
import type { ApiResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: '사용자 ID가 필요합니다.',
        } as ApiResponse,
        { status: 400 }
      );
    }

    await completeUser(userId);

    return NextResponse.json({
      success: true,
      message: '사용자가 완료 처리되었습니다.',
    } as ApiResponse);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '완료 처리를 할 수 없습니다.';

    return NextResponse.json(
      {
        success: false,
        error: message,
      } as ApiResponse,
      { status: 500 }
    );
  }
}
