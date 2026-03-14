"use client";

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [otp, setOtp] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sendingOTP, setSendingOTP] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [sendOTPDisabled, setSendOTPDisabled] = useState(false);

  async function handleSendOTP(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSendingOTP(true);
    setSendOTPDisabled(true);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSessionId(data.sessionId);
        setOtpSent(true);
        // Re-enable button after 30 seconds to prevent spam
        setTimeout(() => {
          setSendOTPDisabled(false);
        }, 30000);
      } else {
        setError(data.error || 'Failed to send OTP. Please try again.');
        setSendOTPDisabled(false);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setSendOTPDisabled(false);
    } finally {
      setSendingOTP(false);
    }
  }

  async function handleVerifyOTP(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!sessionId) {
      setError('Session expired. Please request a new OTP.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ otp, sessionId }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.replace('/');
      } else {
        setError(data.error || 'Invalid OTP. Please try again.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setOtp('');
    setSessionId(null);
    setOtpSent(false);
    setError(null);
    setSendOTPDisabled(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 flex items-center justify-center p-4">
      {/* Background animation pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      </div>

      {/* Login card */}
      <div className="relative w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 md:p-10 border border-white/20">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-block bg-blue-500 p-3 rounded-full mb-4">
              <span className="text-3xl">🏏</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Match Intel</h1>
            <p className="text-blue-100">Cricket Data Management</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-4 flex items-start gap-3 mb-6">
              <span className="text-2xl">⚠️</span>
              <p className="text-red-100 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Success message when OTP is sent */}
          {otpSent && !error && (
            <div className="bg-green-500/20 border border-green-400/50 rounded-lg p-4 flex items-start gap-3 mb-6">
              <span className="text-2xl">✅</span>
              <p className="text-green-100 text-sm font-medium">
                OTP sent successfully! Check your Telegram for the 6-digit code.
              </p>
            </div>
          )}

          {/* Form */}
          {!otpSent ? (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div className="text-center">
                <p className="text-blue-100 text-sm mb-4">
                  Click the button below to receive a one-time password (OTP) via Telegram
                </p>
              </div>

              <button
                type="submit"
                disabled={sendingOTP || sendOTPDisabled}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold rounded-lg transition-all transform hover:scale-105 disabled:scale-100 disabled:opacity-70 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                {sendingOTP ? (
                  <>
                    <span className="inline-block animate-spin">⏳</span>
                    Sending OTP...
                  </>
                ) : (
                  <>
                    <span>📱</span>
                    Send OTP
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              {/* OTP input */}
              <div>
                <label htmlFor="otp" className="block text-sm font-semibold text-white mb-3">
                  🔐 Enter OTP
                </label>
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => {
                    // Only allow digits
                    const value = e.target.value.replace(/\D/g, '');
                    setOtp(value);
                  }}
                  disabled={loading}
                  required
                  placeholder="000000"
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/30 text-white placeholder-blue-100/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all backdrop-blur-sm disabled:opacity-50 text-center text-2xl tracking-widest font-mono"
                />
                <p className="text-blue-100/70 text-xs mt-2 text-center">
                  Enter the 6-digit code sent to your Telegram
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={loading}
                  className="flex-1 py-3 px-4 bg-gray-500/50 hover:bg-gray-500/70 disabled:bg-gray-500/30 text-white font-bold rounded-lg transition-all disabled:opacity-50"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold rounded-lg transition-all transform hover:scale-105 disabled:scale-100 disabled:opacity-70 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="inline-block animate-spin">⏳</span>
                      Verifying...
                    </>
                  ) : (
                    <>
                      <span>✓</span>
                      Verify OTP
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Footer */}
          <p className="text-center text-blue-100 text-xs mt-6">
            Protected access • OTP authentication required
          </p>
        </div>

        {/* Card glow effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400 to-indigo-400 opacity-0 group-hover:opacity-20 transition-opacity blur -z-10"></div>
      </div>
    </div>
  );
}
