import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth/admin';

export async function GET() {
  try {
    const authenticated = await isAdminAuthenticated();
    return NextResponse.json(
      { authenticated },
      { status: authenticated ? 200 : 401 }
    );
  } catch (error) {
    console.error('세션 확인 오류:', error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
