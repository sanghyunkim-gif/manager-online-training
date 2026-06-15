import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers } from '@/lib/supabase/users';
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
