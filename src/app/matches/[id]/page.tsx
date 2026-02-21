'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import BallByBallEvents from '@/components/BallByBallEvents';

interface MatchPageProps {
  params: Promise<{ id: string }>;
}

export default function MatchPage({
  params,
}: MatchPageProps) {
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    params.then((resolved) => {
      setId(resolved.id);
    });
  }, [params]);

  if (!id) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="bg-gradient-to-r from-blue-600 to-blue-900 text-white py-8 shadow-lg">
        <div className="max-w-6xl mx-auto px-4">
          <Link href="/" className="text-blue-200 hover:text-white hover:underline mb-4 inline-flex items-center gap-2 transition-colors">
            ← Back to Home
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-4xl">🎯</span>
            <div>
              <h1 className="text-4xl font-bold">Match Events</h1>
              <p className="text-blue-200">Record ball-by-ball events</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <BallByBallEvents matchId={parseInt(id)} />
      </div>
    </main>
  );
}
