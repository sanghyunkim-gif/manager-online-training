import { NextRequest, NextResponse } from 'next/server';
import { getAllUserProgress } from '@/lib/airtable/progress';
import type { ApiResponse } from '@/types';

const USE_MOCK = process.env.USE_MOCK_DATA === 'true';

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

    const progressList = USE_MOCK ? [] : await getAllUserProgress(userId);

    return NextResponse.json({
      success: true,
      data: progressList,
    } as ApiResponse);
  } catch (error: any) {
    console.error('진행 상황 조회 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || '진행 상황을 불러올 수 없습니다.',
      } as ApiResponse,
      { status: 500 }
    );
  }
}
