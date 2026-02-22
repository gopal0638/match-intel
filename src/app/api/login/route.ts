import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    // if no password configured, always allow
    if (!process.env.AUTH_PASSWORD || password === process.env.AUTH_PASSWORD) {
      const response = NextResponse.json({ success: true });
      response.cookies.set({
        name: 'auth',
        value: 'true',
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24, // 1 day
      });
      return response;
    }
    return NextResponse.json({ success: false }, { status: 401 });
  } catch (err) {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}
