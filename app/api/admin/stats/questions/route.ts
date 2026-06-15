import { NextRequest, NextResponse } from 'next/server';
import { getQuestionStats } from '@/lib/supabase/stats';
import type { ApiResponse } from '@/types';
import { isAdminAuthenticated } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json(
        { success: false, error: '관리자 인증이 필요합니다.' } as ApiResponse,
        { status: 401 }
      );
    }

    const stats = await getQuestionStats();

    return NextResponse.json({
      success: true,
      data: stats,
    } as ApiResponse);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '문제별 통계를 불러올 수 없습니다.';

    return NextResponse.json(
      {
        success: false,
        error: message,
      } as ApiResponse,
      { status: 500 }
    );
  }
}
