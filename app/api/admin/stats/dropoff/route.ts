import { NextRequest, NextResponse } from 'next/server';
import { getDropoffAnalysis } from '@/lib/supabase/stats';
import type { ApiResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const analysis = await getDropoffAnalysis();

    return NextResponse.json({
      success: true,
      data: analysis,
    } as ApiResponse);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '이탈 분석을 불러올 수 없습니다.';

    return NextResponse.json(
      {
        success: false,
        error: message,
      } as ApiResponse,
      { status: 500 }
    );
  }
}
