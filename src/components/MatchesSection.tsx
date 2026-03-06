'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ConfirmDialog from './ConfirmDialog';

interface Match {
  id: number;
  championshipId: number;
  team1Id: number;
  team2Id: number;
  matchDate: string;
  groundName: string;
  matchType: string;
  team1Name: string;
  team2Name: string;
}

interface Team {
  id: number;
  name: string;
}

interface MatchesSectionProps {
  championshipId: number;
  teamsVersion?: number;
}

export default function MatchesSection({ championshipId, teamsVersion }: MatchesSectionProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    team1Id: '',
    team2Id: '',
    matchDate: '',
    groundName: '',
    matchType: '',
    tossWinnerTeamId: '',
    tossDecision: '',
  });
  const [matchToDelete, setMatchToDelete] = useState<Match | null>(null);

  useEffect(() => {
    fetchTeams();
    fetchMatches();
  }, [championshipId, teamsVersion]);

  const fetchTeams = async () => {
    try {
      const res = await fetch(`/api/championships/${championshipId}/teams`);
      const data = await res.json();
      setTeams(data);
    } catch (err) {
      setError('Failed to load teams for this championship');
    }
  };

  const fetchMatches = async () => {
    try {
      const res = await fetch(`/api/championships/${championshipId}/matches`);
      const data = await res.json();
      setMatches(data);
    } catch (err) {
      setError('Failed to load matches');
    }
  };

  const handleAddMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (teams.length === 0) {
      setError('This championship has no teams. Create a championship with teams before adding matches.');
      return;
    }
    if (
      !formData.team1Id ||
      !formData.team2Id ||
      !formData.matchDate ||
      !formData.groundName ||
      !formData.matchType
    ) {
      setError('All fields are required');
      return;
    }

    if (formData.team1Id === formData.team2Id) {
      setError('Team 1 and Team 2 must be different');
      return;
    }

    const hasTossWinner = !!formData.tossWinnerTeamId;
    const hasTossDecision = !!formData.tossDecision;

    // Toss information is optional when creating a match.
    // Only require and validate toss fields when the user has started filling them.
    if (hasTossWinner || hasTossDecision) {
      if (!hasTossWinner || !hasTossDecision) {
        setError('If you provide toss info, please select both the winner and the decision');
        return;
      }

      if (
        formData.tossWinnerTeamId !== formData.team1Id &&
        formData.tossWinnerTeamId !== formData.team2Id
      ) {
        setError('Toss winner must be one of the two teams');
        return;
      }
    }

    setLoading(true);
    try {
      const body: any = {
        team1Id: parseInt(formData.team1Id),
        team2Id: parseInt(formData.team2Id),
        matchDate: formData.matchDate,
        groundName: formData.groundName,
        matchType: formData.matchType,
      };

      if (hasTossWinner && hasTossDecision) {
        body.tossWinnerTeamId = parseInt(formData.tossWinnerTeamId);
        body.tossDecision = formData.tossDecision;
      }

      const res = await fetch(`/api/championships/${championshipId}/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setFormData({
          team1Id: '',
          team2Id: '',
          matchDate: '',
          groundName: '',
          matchType: '',
          tossWinnerTeamId: '',
          tossDecision: '',
        });
        setShowForm(false);
        fetchMatches();
      } else {
        const error = await res.json();
        setError(error.error || 'Failed to add match');
      }
    } catch (err) {
      setError('Failed to add match');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMatch = async (match: Match) => {
    const matchName = `${match.team1Name} vs ${match.team2Name}`;
    try {
      const res = await fetch(`/api/matches/${match.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmName: matchName }),
      });

      if (res.ok) {
        setMatches(matches.filter((m) => m.id !== match.id));
        setError('');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete match');
      }
    } catch (err) {
      setError('Failed to delete match');
    } finally {
      setMatchToDelete(null);
    }
  };

  const requestDeleteMatch = (match: Match) => {
    setMatchToDelete(match);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 mb-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🏟️</span>
          <h2 className="text-3xl font-bold text-gray-800">Matches</h2>
          <span className="ml-auto bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold">
            {matches.length}
          </span>
        </div>
        <button
          onClick={() => {
            if (teams.length === 0) {
              setError('This championship has no teams. Create a championship with teams before adding matches.');
              setShowForm(false);
            } else {
              setError('');
              setShowForm(!showForm);
            }
          }}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-all transform hover:scale-105 disabled:opacity-50"
        >
          {showForm ? '✕ Cancel' : '+ Add Match'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 border border-red-200 flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleAddMatch} className="mb-6 p-6 border border-blue-200 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Team 1</label>
              <select
                value={formData.team1Id}
                onChange={(e) => setFormData({ ...formData, team1Id: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Team 1</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Team 2</label>
              <select
                value={formData.team2Id}
                onChange={(e) => setFormData({ ...formData, team2Id: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Team 2</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Match Date & Time</label>
              <input
                type="datetime-local"
                value={formData.matchDate}
                onChange={(e) => setFormData({ ...formData, matchDate: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Ground Name</label>
              <input
                type="text"
                value={formData.groundName}
                onChange={(e) => setFormData({ ...formData, groundName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Match Type</label>
              <select
                value={formData.matchType}
                onChange={(e) => setFormData({ ...formData, matchType: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Type</option>
                <option value="Test">Test</option>
                <option value="One Day">One Day</option>
                <option value="T20">T20</option>
              </select>
            </div>

            {/* Toss selection */}
            {formData.team1Id && formData.team2Id && (
              <div className="border-t border-blue-200 pt-4 mt-2">
                <p className="text-sm font-semibold text-gray-800 mb-2">
                  Toss
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                      Who won the toss?
                    </label>
                    <select
                      value={formData.tossWinnerTeamId}
                      onChange={(e) =>
                        setFormData({ ...formData, tossWinnerTeamId: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="">Select toss winner</option>
                      {teams
                        .filter(
                          (t) =>
                            t.id.toString() === formData.team1Id ||
                            t.id.toString() === formData.team2Id
                        )
                        .map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                      What did they choose?
                    </label>
                    <select
                      value={formData.tossDecision}
                      onChange={(e) =>
                        setFormData({ ...formData, tossDecision: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      disabled={!formData.tossWinnerTeamId}
                    >
                      <option value="">Select decision</option>
                      <option value="bat">Bat</option>
                      <option value="bowl">Bowl</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold transition-all transform hover:scale-105"
          >
            {loading ? '🔄 Creating...' : '✅ Create Match'}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {matches.map((match) => (
          <div key={match.id} className="relative">
            <Link
              href={`/matches/${match.id}`}
              className="border border-blue-200 p-5 pr-12 rounded-lg hover:shadow-lg transition-all transform hover:scale-102 block hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 cursor-pointer"
            >
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">🏏</span>
                    <p className="font-bold text-lg text-gray-800">
                      {match.team1Name}
                    </p>
                    <span className="text-gray-400 font-semibold">vs</span>
                    <p className="font-bold text-lg text-gray-800">
                      {match.team2Name}
                    </p>
                  </div>
                  <p className="text-gray-600 text-sm ml-7">
                    📅 {new Date(match.matchDate).toLocaleString()}
                  </p>
                  <p className="text-gray-600 text-sm ml-7">
                    🏟️ {match.groundName} • {match.matchType}
                  </p>
                </div>
                <span className="text-blue-600 text-sm font-semibold bg-blue-100 px-3 py-1 rounded-full">
                  Enter Data →
                </span>
              </div>
            </Link>
            <a
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                requestDeleteMatch(match);
              }}
              className="deleteMatch absolute top-3 right-3 text-red-600 hover:text-red-800 text-lg bg-white p-1 rounded-full shadow hover:bg-red-50 cursor-pointer"
              title="Delete match"
            >
              🗑️
            </a>
          </div>
        ))}
      </div>

      {matches.length === 0 && (
        <div className="text-center py-12 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-blue-700 text-lg font-semibold">🏟️ No matches created yet</p>
          <p className="text-blue-600 text-sm mt-1">Create your first match to get started</p>
        </div>
      )}

      {matchToDelete && (
        <ConfirmDialog
          title="Delete Match"
          message={`Type the match name to confirm deletion: "${matchToDelete.team1Name} vs ${matchToDelete.team2Name}"`}
          placeholder="Team1 vs Team2"
          defaultValue=""
          onConfirm={(val) => {
            const expected = `${matchToDelete.team1Name} vs ${matchToDelete.team2Name}`;
            if (val === expected) {
              handleDeleteMatch(matchToDelete);
            } else {
              alert('Name mismatch, deletion cancelled');
              setMatchToDelete(null);
            }
          }}
          onCancel={() => setMatchToDelete(null)}
        />
      )}
    </div>
  );
}
