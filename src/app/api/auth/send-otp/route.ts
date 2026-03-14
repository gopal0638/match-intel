import { NextRequest, NextResponse } from 'next/server';
import { generateOTP } from '@/lib/otp-generator';
import { otpStorage } from '@/lib/otp-storage';

/**
 * POST /api/auth/send-otp
 * Generates an OTP, stores it temporarily, and sends it to Telegram
 */
export async function POST(request: NextRequest) {
  try {
    // Check if Telegram configuration is available
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      return NextResponse.json(
        { error: 'Telegram bot configuration is missing' },
        { status: 500 }
      );
    }

    // Generate 6-digit OTP
    const otp = generateOTP();

    // Store OTP temporarily
    const otpKey = otpStorage.store(otp);

    // Send OTP to Telegram via GET request
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(`Your OTP is ${otp}`)}`;

    try {
      const telegramResponse = await fetch(telegramUrl, {
        method: 'GET',
      });

      if (!telegramResponse.ok) {
        // If Telegram send fails, remove the stored OTP
        otpStorage.remove(otpKey);
        const errorText = await telegramResponse.text();
        console.error('Telegram API error:', errorText);
        return NextResponse.json(
          { error: 'Failed to send OTP via Telegram' },
          { status: 500 }
        );
      }
    } catch (telegramError) {
      // If network error, remove the stored OTP
      otpStorage.remove(otpKey);
      console.error('Telegram request error:', telegramError);
      return NextResponse.json(
        { error: 'Failed to send OTP via Telegram' },
        { status: 500 }
      );
    }

    // Return success (don't return the OTP key for security - we'll use a different approach)
    // Actually, we need to return something to identify the OTP session
    // For simplicity, we'll return a session ID that the client will send back
    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      sessionId: otpKey, // Client will send this back with the OTP
    });
  } catch (error: any) {
    console.error('Error sending OTP:', error);
    return NextResponse.json(
      { error: 'Failed to send OTP' },
      { status: 500 }
    );
  }
}
