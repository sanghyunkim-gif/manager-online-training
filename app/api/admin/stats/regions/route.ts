import { NextRequest, NextResponse } from 'next/server';
import { getRegionStats } from '@/lib/supabase/stats';
import type { ApiResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const stats = await getRegionStats();

    return NextResponse.json({
      success: true,
      data: stats,
    } as ApiResponse);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '지역별 통계를 불러올 수 없습니다.';

    return NextResponse.json(
      {
        success: false,
        error: message,
      } as ApiResponse,
      { status: 500 }
    );
  }
}
