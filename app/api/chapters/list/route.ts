import { NextRequest, NextResponse } from 'next/server';
import { getActiveChapters } from '@/lib/airtable/chapters';
import { mockChapters } from '@/lib/mock-data';
import type { ApiResponse } from '@/types';

const USE_MOCK = process.env.USE_MOCK_DATA === 'true';

export async function GET(request: NextRequest) {
  try {
    const chapters = USE_MOCK ? mockChapters : await getActiveChapters();

    return NextResponse.json({
      success: true,
      data: chapters,
    } as ApiResponse);
  } catch (error: any) {
    console.error('챕터 목록 조회 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || '챕터 목록을 불러올 수 없습니다.',
      } as ApiResponse,
      { status: 500 }
    );
  }
}
