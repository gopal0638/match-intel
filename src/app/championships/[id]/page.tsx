'use client';

import { useState, useEffect } from 'react';
import MatchesSection from '@/components/MatchesSection';
import Link from 'next/link';

interface Championship {
  id: number;
  name: string;
}

interface ChampionshipPageProps {
  params: Promise<{ id: string }>;
}

export default function ChampionshipPage({
  params,
}: ChampionshipPageProps) {
  const [championship, setChampionship] = useState<Championship | null>(null);
  const [loading, setLoading] = useState(true);
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    params.then((resolved) => {
      setId(resolved.id);
    });
  }, [params]);

  useEffect(() => {
    if (!id) return;

    const fetchChampionship = async () => {
      try {
        const res = await fetch(`/api/championships`);
        const championships = await res.json();
        const found = championships.find((c: Championship) => c.id === parseInt(id));
        setChampionship(found || null);
      } catch (err) {
        console.error('Failed to load championship');
      } finally {
        setLoading(false);
      }
    };

    fetchChampionship();
  }, [id]);

  if (!id || loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!championship) {
    return <div className="text-center py-8">Championship not found</div>;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="bg-gradient-to-r from-amber-600 to-amber-800 text-white py-8 shadow-lg">
        <div className="max-w-6xl mx-auto px-4">
          <Link href="/" className="text-amber-200 hover:text-white hover:underline mb-4 inline-flex items-center gap-2 transition-colors">
            ← Back to Home
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-4xl">🏆</span>
            <div>
              <h1 className="text-4xl font-bold">{championship.name}</h1>
              <p className="text-amber-200">Manage matches and records</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <MatchesSection championshipId={parseInt(id)} />
      </div>
    </main>
  );
}
