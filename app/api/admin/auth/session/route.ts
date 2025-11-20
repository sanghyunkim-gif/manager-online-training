import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';

const SECRET_KEY = process.env.ADMIN_JWT_SECRET || 'your-secret-key-change-in-production';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin-token');

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    try {
      verify(token.value, SECRET_KEY);
      return NextResponse.json({ authenticated: true });
    } catch (err) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
  } catch (error) {
    console.error('세션 확인 오류:', error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
