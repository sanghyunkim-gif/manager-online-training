import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers } from '@/lib/supabase/users';
import type { ApiResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const users = await getAllUsers();

    return NextResponse.json({
      success: true,
      data: users,
    } as ApiResponse);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '사용자 목록을 불러올 수 없습니다.';

    return NextResponse.json(
      {
        success: false,
        error: message,
      } as ApiResponse,
      { status: 500 }
    );
  }
}
