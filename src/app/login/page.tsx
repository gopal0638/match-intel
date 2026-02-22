"use client";

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.replace('/');
      } else {
        setError('Incorrect password');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error message */}
            {error && (
              <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-4 flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <p className="text-red-100 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Password input */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-white mb-3">
                🔐 Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                placeholder="Enter password"
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/30 text-white placeholder-blue-100/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all backdrop-blur-sm disabled:opacity-50"
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold rounded-lg transition-all transform hover:scale-105 disabled:scale-100 disabled:opacity-70 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="inline-block animate-spin">⏳</span>
                  Logging in...
                </>
              ) : (
                <>
                  <span>🔓</span>
                  Log In
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-blue-100 text-xs mt-6">
            Protected access • Secure login required
          </p>
        </div>

        {/* Card glow effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400 to-indigo-400 opacity-0 group-hover:opacity-20 transition-opacity blur -z-10"></div>
      </div>
    </div>
  );
}
