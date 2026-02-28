'use client';

import { useState, useEffect } from 'react';
import TeamPlayers from './TeamPlayers';
import ConfirmDialog from './ConfirmDialog';

interface Team {
  id: number;
  name: string;
}

export default function TeamsSection() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedTeamId, setExpandedTeamId] = useState<number | null>(null);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const res = await fetch('/api/teams');
      const data = await res.json();
      setTeams(data);
    } catch (err) {
      setError('Failed to load teams');
    }
  };

  const handleDeleteTeam = async (team: Team) => {
    try {
      const res = await fetch(`/api/teams/${team.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmName: team.name }),
      });

      if (res.ok) {
        setTeams(teams.filter((t) => t.id !== team.id));
        if (expandedTeamId === team.id) setExpandedTeamId(null);
        setError('');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete team');
      }
    } catch (err) {
      setError('Failed to delete team');
    } finally {
      setTeamToDelete(null);
    }
  };

  const requestDeleteTeam = (team: Team) => {
    setTeamToDelete(team);
  };

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTeamName }),
      });

      if (res.ok) {
        const newTeam = await res.json();
        setTeams([...teams, newTeam]);
        setNewTeamName('');
        setError('');
      } else {
        const error = await res.json();
        setError(error.error || 'Failed to add team');
      }
    } catch (err) {
      setError('Failed to add team');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="text-3xl">👥</div>
        <h2 className="text-3xl font-bold text-gray-800">Teams</h2>
        <span className="ml-auto bg-blue-100 text-blue-800 px-4 py-1 rounded-full font-semibold">
          {teams.length} teams
        </span>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 border border-red-200 flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleAddTeam} className="mb-8">
        <div className="flex gap-3">
          <input
            type="text"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            placeholder="Enter team name (e.g., India, Australia)"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all transform hover:scale-105"
          >
            {loading ? '⏳ Adding...' : '➕ Add Team'}
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {teams.map((team) => (
          <div key={team.id} className="relative">
            <button
              onClick={() => setExpandedTeamId(expandedTeamId === team.id ? null : team.id)}
              className="w-full text-left border border-gray-200 p-4 pr-12 rounded-lg hover:shadow-md transition-all bg-gradient-to-r hover:from-blue-50 hover:to-transparent font-semibold text-lg text-gray-800 flex items-center justify-between"
            >
              <span className="flex items-center gap-3">
                <span className="text-2xl">🏟️</span>
                {team.name}
              </span>
              <span className="text-2xl">{expandedTeamId === team.id ? '▼' : '▶'}</span>
            </button>
            <a
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                requestDeleteTeam(team);
              }}
              className="deleteTeam absolute top-3 right-3 text-red-600 hover:text-red-800 text-lg bg-white p-1 rounded-full shadow hover:bg-red-50 cursor-pointer"
              title="Delete team"
            >
              🗑️
            </a>
            {expandedTeamId === team.id && <TeamPlayers teamId={team.id} teamName={team.name} />}
          </div>
        ))}
      </div>

      {teams.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏏</div>
          <p className="text-gray-500 text-lg">No teams created yet. Start by adding your first team!</p>
        </div>
      )}

      {teamToDelete && (
        <ConfirmDialog
          title="Delete Team"
          message={`Type the team name to confirm deletion: "${teamToDelete.name}"`}
          placeholder="Team name"
          defaultValue=""
          onConfirm={(val) => {
            if (val === teamToDelete.name) {
              handleDeleteTeam(teamToDelete);
            } else {
              alert('Name mismatch, deletion cancelled');
              setTeamToDelete(null);
            }
          }}
          onCancel={() => setTeamToDelete(null)}
        />
      )}
    </div>
  );
}
