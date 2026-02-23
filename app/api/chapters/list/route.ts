import { NextRequest, NextResponse } from 'next/server';
import { getActiveChapters } from '@/lib/supabase/chapters';
import type { ApiResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const chapters = await getActiveChapters();

    return NextResponse.json({
      success: true,
      data: chapters,
    } as ApiResponse);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '챕터 목록을 불러올 수 없습니다.';

    return NextResponse.json(
      {
        success: false,
        error: message,
      } as ApiResponse,
      { status: 500 }
    );
  }
}
