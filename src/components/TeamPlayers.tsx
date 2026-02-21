'use client';

import { useState, useEffect } from 'react';

interface Player {
  id: number;
  teamId: number;
  name: string;
  playerType: string;
}

type PlayerType = 'batsman' | 'bowler' | 'all rounder' | 'extra player' | 'impact player';

interface TeamPlayersProps {
  teamId: number;
  teamName: string;
}

const PLAYER_TYPES: { value: PlayerType; label: string; emoji: string }[] = [
  { value: 'batsman', label: 'Batsman', emoji: '🏏' },
  { value: 'bowler', label: 'Bowler', emoji: '🎯' },
  { value: 'all rounder', label: 'All Rounder', emoji: '⭐' },
  { value: 'extra player', label: 'Extra Player', emoji: '👤' },
  { value: 'impact player', label: 'Impact Player', emoji: '💥' },
];

export default function TeamPlayers({ teamId, teamName }: TeamPlayersProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerType, setNewPlayerType] = useState<PlayerType>('all rounder');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchPlayers();
  }, [teamId]);

  const fetchPlayers = async () => {
    try {
      const res = await fetch(`/api/teams/${teamId}/players`);
      const data = await res.json();
      setPlayers(data);
    } catch (err) {
      setError('Failed to load players');
    }
  };

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPlayerName, playerType: newPlayerType }),
      });

      if (res.ok) {
        const newPlayer = await res.json();
        setPlayers([...players, newPlayer]);
        setNewPlayerName('');
        setNewPlayerType('all rounder');
        setShowForm(false);
        setError('');
      } else {
        const error = await res.json();
        setError(error.error || 'Failed to add player');
      }
    } catch (err) {
      setError('Failed to add player');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlayer = async (playerId: number) => {
    if (!confirm('Delete this player?')) return;

    try {
      const res = await fetch(`/api/teams/${teamId}/players/${playerId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setPlayers(players.filter((p) => p.id !== playerId));
      } else {
        setError('Failed to delete player');
      }
    } catch (err) {
      setError('Failed to delete player');
    }
  };

  const getPlayerTypeEmoji = (type: string) => {
    const playerType = PLAYER_TYPES.find((pt) => pt.value === type);
    return playerType?.emoji || '👤';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mt-4 border border-gray-100">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">👥</span>
          <h3 className="text-2xl font-bold text-gray-800">{teamName} - Players</h3>
          <span className="ml-auto bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold">
            {players.length}
          </span>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-all transform hover:scale-105 text-sm"
        >
          {showForm ? '✕ Cancel' : '+ Add Player'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 border border-red-200 flex items-start gap-3">
          <span className="text-lg">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleAddPlayer} className="mb-6 p-4 border border-green-200 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Player Name</label>
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Enter player name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Player Type</label>
              <select
                value={newPlayerType}
                onChange={(e) => setNewPlayerType(e.target.value as PlayerType)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {PLAYER_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.emoji} {type.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold transition-all transform hover:scale-105"
            >
              {loading ? '🔄 Adding...' : '✅ Add Player'}
            </button>
          </div>
        </form>
      )}

      {players.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {players.map((player) => (
            <div
              key={player.id}
              className="border border-gray-200 p-4 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="font-bold text-gray-800">{player.name}</span>
                <button
                  onClick={() => handleDeletePlayer(player.id)}
                  className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 font-semibold transition-colors"
                >
                  🗑️
                </button>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-lg">{getPlayerTypeEmoji(player.playerType)}</span>
                <span className="text-sm font-semibold text-gray-600 capitalize bg-gray-200 px-2 py-1 rounded">
                  {player.playerType}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-500 font-semibold">👥 No players added yet</p>
        </div>
      )}
    </div>
  );
}
