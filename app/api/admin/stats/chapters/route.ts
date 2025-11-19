import { NextRequest, NextResponse } from 'next/server';
import { getChapterStats } from '@/lib/airtable/stats';
import type { ApiResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const stats = await getChapterStats();

    return NextResponse.json({
      success: true,
      data: stats,
    } as ApiResponse);
  } catch (error: any) {
    console.error('챕터별 통계 조회 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || '챕터별 통계를 불러올 수 없습니다.',
      } as ApiResponse,
      { status: 500 }
    );
  }
}
