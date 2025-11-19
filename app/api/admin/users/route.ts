import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers } from '@/lib/airtable/users';
import type { ApiResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const users = await getAllUsers();

    return NextResponse.json({
      success: true,
      data: users,
    } as ApiResponse);
  } catch (error: any) {
    console.error('사용자 목록 조회 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || '사용자 목록을 불러올 수 없습니다.',
      } as ApiResponse,
      { status: 500 }
    );
  }
}
