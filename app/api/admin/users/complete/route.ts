import { NextRequest, NextResponse } from 'next/server';
import { completeUser } from '@/lib/airtable/users';
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

    console.log('수동 완료 처리 시작:', { userId });

    // 사용자 완료 처리
    await completeUser(userId);

    console.log('수동 완료 처리 완료:', { userId });

    return NextResponse.json({
      success: true,
      message: '사용자가 완료 처리되었습니다.',
    } as ApiResponse);
  } catch (error: any) {
    console.error('사용자 완료 처리 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || '완료 처리를 할 수 없습니다.',
      } as ApiResponse,
      { status: 500 }
    );
  }
}
