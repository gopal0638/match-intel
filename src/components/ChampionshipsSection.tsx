'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ConfirmDialog from './ConfirmDialog';

interface Championship {
  id: number;
  name: string;
}

interface Team {
  id: number;
  name: string;
}

export default function ChampionshipsSection() {
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [newChampionshipName, setNewChampionshipName] = useState('');
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [champToDelete, setChampToDelete] = useState<Championship | null>(null);

  const handleDeleteChampionship = async (championship: Championship) => {
    try {
      const res = await fetch(`/api/championships/${championship.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmName: championship.name }),
      });

      if (res.ok) {
        setChampionships(championships.filter((c) => c.id !== championship.id));
        setError('');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete championship');
      }
    } catch (err) {
      setError('Failed to delete championship');
    } finally {
      setChampToDelete(null);
    }
  };

  const requestDeleteChampionship = (championship: Championship) => {
    setChampToDelete(championship);
  };

  useEffect(() => {
    fetchChampionships();
    fetchTeams();
  }, []);

  const fetchChampionships = async () => {
    try {
      const res = await fetch('/api/championships');
      const data = await res.json();
      setChampionships(data);
    } catch (err) {
      setError('Failed to load championships');
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await fetch('/api/teams');
      const data = await res.json();
      setAvailableTeams(data);
    } catch (err) {
      // teams are optional for championship creation; surface as warning in form
      console.error('Failed to load teams for championship creation');
    }
  };

  const handleAddChampionship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChampionshipName.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/championships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newChampionshipName, teamIds: selectedTeamIds }),
      });

      if (res.ok) {
        const newChampionship = await res.json();
        setChampionships([...championships, newChampionship]);
        setNewChampionshipName('');
        setSelectedTeamIds([]);
      } else {
        const error = await res.json();
        setError(error.error || 'Failed to add championship');
      }
    } catch (err) {
      setError('Failed to add championship');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="text-3xl">🏆</div>
        <h2 className="text-3xl font-bold text-gray-800">Championships</h2>
        <span className="ml-auto bg-amber-100 text-amber-800 px-4 py-1 rounded-full font-semibold">
          {championships.length} tournaments
        </span>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 border border-red-200 flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleAddChampionship} className="mb-8">
        <div className="flex gap-3">
          <input
            type="text"
            value={newChampionshipName}
            onChange={(e) => setNewChampionshipName(e.target.value)}
            placeholder="Enter championship name (e.g., IPL 2024, World Cup)"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all transform hover:scale-105"
          >
            {loading ? '⏳ Adding...' : '➕ Add Championship'}
          </button>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select teams participating in this championship
          </label>
          {availableTeams.length === 0 ? (
            <p className="text-sm text-gray-500">
              No teams available yet. Create teams first in the Teams section, then create a championship.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
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
                          checked
                            ? prev.filter((id) => id !== team.id)
                            : [...prev, team.id]
                        );
                      }}
                    />
                    <span>{team.name}</span>
                  </label>
                );
              })}
            </div>
          )}
          <p className="mt-1 text-xs text-gray-500">
            You can only create matches between teams selected here.
          </p>
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {championships.map((championship) => (
          <Link
            key={championship.id}
            href={`/championships/${championship.id}`}
            className="border border-gray-200 p-6 rounded-lg hover:shadow-xl transition-all transform hover:scale-105 bg-gradient-to-br hover:from-amber-50 hover:to-transparent cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-lg text-gray-800 group-hover:text-amber-700">{championship.name}</p>
                <p className="text-sm text-gray-500 mt-2">Click to view matches →</p>
              </div>
              {/* <span className="text-3xl">🎯</span> */}
              <span
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                requestDeleteChampionship(championship);
              }}
              className="deleteChampionship top-3 right-3 text-red-600 hover:text-red-800 text-lg bg-white p-1 rounded-full shadow hover:bg-red-50 cursor-pointer"
              title="Delete championship"
            >
              🗑️
            </span>
            </div>
          </Link>
        ))}
      </div>

      {championships.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏏</div>
          <p className="text-gray-500 text-lg">No championships created yet. Start by adding your first tournament!</p>
        </div>
      )}

      {champToDelete && (
        <ConfirmDialog
          title="Delete Championship"
          message={`Type the championship name to confirm deletion: "${champToDelete.name}"`}
          placeholder="Championship name"
          defaultValue=""
          onConfirm={(val) => {
            if (val === champToDelete.name) {
              handleDeleteChampionship(champToDelete);
            } else {
              alert('Name mismatch, deletion cancelled');
              setChampToDelete(null);
            }
          }}
          onCancel={() => setChampToDelete(null)}
        />
      )}
    </div>
  );
}
