import { NextRequest, NextResponse } from 'next/server';
import { getDropoffAnalysis } from '@/lib/airtable/stats';
import type { ApiResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const analysis = await getDropoffAnalysis();

    return NextResponse.json({
      success: true,
      data: analysis,
    } as ApiResponse);
  } catch (error: any) {
    console.error('이탈 분석 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || '이탈 분석을 불러올 수 없습니다.',
      } as ApiResponse,
      { status: 500 }
    );
  }
}
