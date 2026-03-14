import { NextRequest, NextResponse } from 'next/server';
import { otpStorage } from '@/lib/otp-storage';
import { isValidOTPFormat } from '@/lib/otp-generator';

/**
 * POST /api/auth/verify-otp
 * Verifies the OTP and creates a login session if valid
 */
export async function POST(request: NextRequest) {
  try {
    const { otp, sessionId } = await request.json();

    // Validate input
    if (!otp || typeof otp !== 'string') {
      return NextResponse.json(
        { error: 'OTP is required' },
        { status: 400 }
      );
    }

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Validate OTP format (must be 6 digits)
    if (!isValidOTPFormat(otp)) {
      return NextResponse.json(
        { error: 'Invalid OTP format. OTP must be exactly 6 digits' },
        { status: 400 }
      );
    }

    // Check if OTP session exists and is valid (not expired, not used)
    const sessionExists = otpStorage.isValid(sessionId);

    if (!sessionExists) {
      return NextResponse.json(
        { error: 'Invalid OTP or OTP expired' },
        { status: 401 }
      );
    }

    // Verify OTP matches
    const isValid = otpStorage.verify(sessionId, otp);

    if (!isValid) {
      // This shouldn't happen if sessionExists was true, but handle it anyway
      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 401 }
      );
    }

    // OTP is valid - create login session
    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: 'auth',
      value: 'true',
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24, // 1 day
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { error: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}
