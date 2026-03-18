import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const isHttps =
    forwardedProto === 'https' || request.nextUrl.protocol === 'https:';
  response.cookies.set({
    name: 'auth',
    value: '',
    path: '/',
    maxAge: 0,
    secure: isHttps,
  });
  return response;
}
