'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import BallByBallEvents from '@/components/BallByBallEvents';
import MatchDetails from '@/components/MatchDetails';

interface MatchPageProps {
  readonly params: Promise<{ id: string }>;
}

interface MatchSummary {
  id: number;
  team1Id: number;
  team2Id: number;
  team1Name: string;
  team2Name: string;
  matchDate?: string;
  groundName?: string | null;
  matchType?: string | null;
  tossWinnerTeamId?: number | null;
  tossDecision?: string | null;
}

interface InningsScore {
  inningsNumber: number;
  totalRuns: number;
  wickets: number;
  overs: string;
  extras: number;
  runRate: number;
}

export default function MatchPage({
  params,
}: MatchPageProps) {
  const [id, setId] = useState<string | null>(null);
  const [match, setMatch] = useState<MatchSummary | null>(null);
  const [inningsScores, setInningsScores] = useState<InningsScore[]>([]);
  const [activeTab, setActiveTab] = useState<'ball' | 'scorecard'>('ball');
  const [editingToss, setEditingToss] = useState(false);
  const [tossForm, setTossForm] = useState({
    tossWinnerTeamId: '',
    tossDecision: '',
  });

  useEffect(() => {
    params.then((resolved) => {
      setId(resolved.id);
    });
  }, [params]);

  useEffect(() => {
    if (!id) return;

    const fetchSummary = async () => {
      try {
        const res = await fetch(`/api/matches/${id}`);
        const data = await res.json();
        if (res.ok) {
          setMatch(data.match);
          const m = data.match as MatchSummary;
          setTossForm({
            tossWinnerTeamId: m.tossWinnerTeamId?.toString() ?? '',
            tossDecision: m.tossDecision ?? '',
          });
        }
      } catch {
        // ignore summary errors for now
      }
    };

    const fetchScoreboard = async () => {
      try {
        const res = await fetch(`/api/matches/${id}/scoreboard`);
        const data = await res.json();
        if (res.ok) {
          setInningsScores(data.innings || []);
        }
      } catch {
        // ignore
      }
    };

    fetchSummary();
    fetchScoreboard();
  }, [id]);

  if (!id) {
    return <div className="text-center py-8">Loading...</div>;
  }

  const renderTossInfo = () => {
    if (!match || !match.tossWinnerTeamId || !match.tossDecision) return null;

    const winnerIsTeam1 = match.tossWinnerTeamId === match.team1Id;
    const winnerName = winnerIsTeam1 ? match.team1Name : match.team2Name;
    const isBat = match.tossDecision.toLowerCase() === 'bat';
    const decision = isBat ? 'to bat' : 'to bowl';

    return (
      <p className="text-sm text-blue-100 mt-1">
        Toss: <span className="font-semibold">{winnerName}</span> won the toss and chose{' '}
        <span className="font-semibold">{decision}</span>.
      </p>
    );
  };

  const renderScoreline = () => {
    if (!inningsScores.length) return null;
    return (
      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        {inningsScores.map((inn) => (
          <div
            key={inn.inningsNumber}
            className="px-3 py-2 rounded-lg bg-blue-800/40 border border-blue-300/40"
          >
            <div className="font-semibold">
              Innings {inn.inningsNumber}:{' '}
              {inn.totalRuns}/{inn.wickets} ({inn.overs})
            </div>
            <div className="text-xs text-blue-100">
              Extras {inn.extras} • RR {inn.runRate}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const handleSaveToss = async () => {
    if (!match) return;
    if (!tossForm.tossWinnerTeamId || !tossForm.tossDecision) {
      alert('Please select toss winner and decision');
      return;
    }

    try {
      const res = await fetch(`/api/matches/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tossWinnerTeamId: Number.parseInt(tossForm.tossWinnerTeamId, 10),
          tossDecision: tossForm.tossDecision,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to save toss');
        return;
      }
      setMatch(data);
      setEditingToss(false);
    } catch {
      alert('Failed to save toss');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="bg-gradient-to-r from-blue-600 to-blue-900 text-white py-8 shadow-lg">
        <div className="max-w-6xl mx-auto px-4">
          <Link
            href="/"
            className="text-blue-200 hover:text-white hover:underline mb-4 inline-flex items-center gap-2 transition-colors"
          >
            ← Back to Home
          </Link>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <span className="text-4xl">🎯</span>
              <div>
                <h1 className="text-4xl font-bold">
                  {match
                    ? `${match.team1Name} vs ${match.team2Name}`
                    : 'Match'}
                </h1>
                <p className="text-blue-200">
                  {match?.matchType || 'Match'} at {match?.groundName || 'Ground'}
                </p>
                {renderTossInfo()}
              </div>
            </div>
            {match && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setEditingToss((prev) => !prev)}
                  className="px-3 py-1.5 rounded-lg bg-blue-800 text-blue-100 text-xs font-semibold hover:bg-blue-700 border border-blue-300/40"
                >
                  {editingToss ? '✕ Cancel Toss Edit' : match.tossWinnerTeamId ? '✏️ Edit Toss' : '🎲 Set Toss'}
                </button>
                {editingToss && (
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold mb-1" htmlFor="tossWinner">
                        Who won the toss?
                      </label>
                      <select
                        id="tossWinner"
                        value={tossForm.tossWinnerTeamId}
                        onChange={(e) =>
                          setTossForm((prev) => ({
                            ...prev,
                            tossWinnerTeamId: e.target.value,
                          }))
                        }
                        className="w-full px-2 py-1.5 rounded bg-blue-900/40 border border-blue-300/60 text-blue-50"
                      >
                        <option value="">Select</option>
                        <option value={match.team1Id}>{match.team1Name}</option>
                        <option value={match.team2Id}>{match.team2Name}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold mb-1" htmlFor="tossDecision">
                        What did they choose?
                      </label>
                      <select
                        id="tossDecision"
                        value={tossForm.tossDecision}
                        onChange={(e) =>
                          setTossForm((prev) => ({
                            ...prev,
                            tossDecision: e.target.value,
                          }))
                        }
                        disabled={!tossForm.tossWinnerTeamId}
                        className="w-full px-2 py-1.5 rounded bg-blue-900/40 border border-blue-300/60 text-blue-50 disabled:opacity-50"
                      >
                        <option value="">Select</option>
                        <option value="bat">Bat</option>
                        <option value="bowl">Bowl</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleSaveToss}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600"
                      >
                        💾 Save Toss
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {renderScoreline()}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setActiveTab('ball')}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'ball'
                ? 'bg-blue-600 text-white shadow-md scale-105'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            🏏 Ball-by-ball
          </button>
          <button
            onClick={() => setActiveTab('scorecard')}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'scorecard'
                ? 'bg-blue-600 text-white shadow-md scale-105'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            📋 Scorecard
          </button>
        </div>

        {activeTab === 'ball' && (
          <BallByBallEvents matchId={Number.parseInt(id, 10)} />
        )}

        {activeTab === 'scorecard' && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <MatchDetails matchId={Number.parseInt(id, 10)} />
          </div>
        )}
      </div>
    </main>
  );
}
