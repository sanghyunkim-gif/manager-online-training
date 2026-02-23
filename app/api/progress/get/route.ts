import { NextRequest, NextResponse } from 'next/server';
import { getAllUserProgress } from '@/lib/supabase/progress';
import type { ApiResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: '사용자 ID가 필요합니다.',
        } as ApiResponse,
        { status: 400 }
      );
    }

    const progressList = await getAllUserProgress(userId);

    return NextResponse.json({
      success: true,
      data: progressList,
    } as ApiResponse);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '진행 상황을 불러올 수 없습니다.';

    return NextResponse.json(
      {
        success: false,
        error: message,
      } as ApiResponse,
      { status: 500 }
    );
  }
}
