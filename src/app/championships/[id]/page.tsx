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
  const [teamsVersion, setTeamsVersion] = useState(0);
  const [availableTeams, setAvailableTeams] = useState<{ id: number; name: string }[]>([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [teamsError, setTeamsError] = useState('');
  const [teamsSaving, setTeamsSaving] = useState(false);
  const [teamsSuccess, setTeamsSuccess] = useState('');

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

  useEffect(() => {
    if (!id) return;

    const loadTeams = async () => {
      setTeamsLoading(true);
      setTeamsError('');
      setTeamsSuccess('');
      try {
        const [allTeamsRes, champTeamsRes] = await Promise.all([
          fetch('/api/teams'),
          fetch(`/api/championships/${id}/teams`),
        ]);

        const allTeams = await allTeamsRes.json();
        if (!allTeamsRes.ok) {
          setTeamsError(allTeams?.error || 'Failed to load teams');
          return;
        }

        const champTeams = await champTeamsRes.json();
        if (!champTeamsRes.ok) {
          setTeamsError(champTeams?.error || 'Failed to load championship teams');
          return;
        }

        setAvailableTeams(allTeams);
        setSelectedTeamIds((champTeams as Array<{ id: number }>).map((t) => t.id));
      } catch (err) {
        setTeamsError('Failed to load teams');
      } finally {
        setTeamsLoading(false);
      }
    };

    loadTeams();
  }, [id, teamsVersion]);

  const saveTeams = async () => {
    if (!id) return;
    setTeamsSaving(true);
    setTeamsError('');
    setTeamsSuccess('');
    try {
      const res = await fetch(`/api/championships/${id}/teams`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamIds: selectedTeamIds }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTeamsError(data?.error || 'Failed to update championship teams');
        return;
      }
      setTeamsSuccess('Teams updated successfully');
      setTeamsVersion((v) => v + 1);
    } catch (err) {
      setTeamsError('Failed to update championship teams');
    } finally {
      setTeamsSaving(false);
    }
  };

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
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">👥</span>
            <h2 className="text-2xl font-bold text-gray-800">Championship Teams</h2>
          </div>

          {teamsError && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4 border border-red-200">
              {teamsError}
            </div>
          )}

          {teamsSuccess && (
            <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-4 border border-green-200">
              {teamsSuccess}
            </div>
          )}

          {teamsLoading ? (
            <div className="text-gray-600">Loading teams...</div>
          ) : availableTeams.length === 0 ? (
            <p className="text-sm text-gray-500">
              No teams available yet. Create teams on the home page first.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-56 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                {availableTeams.map((team) => {
                  const checked = selectedTeamIds.includes(team.id);
                  return (
                    <label key={team.id} className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                        checked={checked}
                        onChange={() => {
                          setSelectedTeamIds((prev) =>
                            checked ? prev.filter((x) => x !== team.id) : [...prev, team.id]
                          );
                        }}
                      />
                      <span>{team.name}</span>
                    </label>
                  );
                })}
              </div>

              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={saveTeams}
                  disabled={teamsSaving}
                  className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 font-semibold transition-all transform hover:scale-105"
                >
                  {teamsSaving ? 'Saving...' : 'Save Teams'}
                </button>
                <p className="text-sm text-gray-500">
                  Match team dropdowns update immediately after save.
                </p>
              </div>
            </>
          )}
        </div>

        <MatchesSection championshipId={parseInt(id)} teamsVersion={teamsVersion} />
      </div>
    </main>
  );
}
