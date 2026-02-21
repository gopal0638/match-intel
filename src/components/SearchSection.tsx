'use client';

import { useState, useEffect } from 'react';

interface Record {
  id: number;
  matchId: number;
  name: string;
  runsScored?: number;
  ballsFaced?: number;
  wicketsTaken?: number;
  runsConceded?: number;
  reviewed: number;
  reviewComment: string | null;
}

interface Championship {
  id: number;
  name: string;
}

interface Match {
  id: number;
  team1: string;
  team2: string;
  championshipId: number;
}

export default function SearchSection() {
  const [playerName, setPlayerName] = useState('');
  const [scope, setScope] = useState<'global' | 'match' | 'championship'>('global');
  const [matchId, setMatchId] = useState('');
  const [championshipId, setChampionshipId] = useState('');
  const [results, setResults] = useState<{ batsmen: Record[]; bowlers: Record[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    fetchChampionships();
  }, []);

  const fetchChampionships = async () => {
    try {
      const res = await fetch('/api/championships');
      const data = await res.json();
      setChampionships(data || []);
    } catch (err) {
      console.error('Failed to fetch championships');
    }
  };

  const fetchMatches = async (selectedChampionshipId: string) => {
    if (!selectedChampionshipId) {
      setMatches([]);
      return;
    }
    setLoadingData(true);
    try {
      const res = await fetch(`/api/championships/${selectedChampionshipId}/matches`);
      const data = await res.json();
      setMatches(data || []);
    } catch (err) {
      console.error('Failed to fetch matches');
    } finally {
      setLoadingData(false);
    }
  };

  const handleChampionshipChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newChampionshipId = e.target.value;
    setChampionshipId(newChampionshipId);
    setMatchId('');
    fetchMatches(newChampionshipId);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setError('Please enter a player name');
      return;
    }

    if (scope === 'match' && !matchId) {
      setError('Please select a match');
      return;
    }

    if (scope === 'championship' && !championshipId) {
      setError('Please select a championship');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let url = `/api/search?name=${encodeURIComponent(playerName)}&scope=${scope}`;

      if (scope === 'match' && matchId) {
        url += `&matchId=${matchId}`;
      } else if (scope === 'championship' && championshipId) {
        url += `&championshipId=${championshipId}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      setResults(data);
    } catch (err) {
      setError('Failed to search records');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="text-3xl">🔍</div>
        <h2 className="text-3xl font-bold text-gray-800">Search Records</h2>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 border border-red-200 flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSearch} className="mb-8">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Player Name</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Search for a player (e.g., Virat, Rohit)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Search Scope</label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as any)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="global">🌍 Global Search</option>
              <option value="match">🎯 Search in Match</option>
              <option value="championship">🏆 Search in Championship</option>
            </select>
          </div>

          {scope === 'match' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Match</label>
              <select
                value={matchId}
                onChange={(e) => setMatchId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose a match...</option>
                {matches.map((match) => (
                  <option key={match.id} value={match.id}>
                    {match.team1} vs {match.team2}
                  </option>
                ))}
              </select>
              {loadingData && <p className="text-sm text-gray-500 mt-1">🔄 Loading matches...</p>}
            </div>
          )}

          {scope === 'championship' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Championship</label>
              <select
                value={championshipId}
                onChange={handleChampionshipChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose a championship...</option>
                {championships.map((champ) => (
                  <option key={champ.id} value={champ.id}>
                    {champ.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all transform hover:scale-105"
          >
            {loading ? '🔄 Searching...' : '🔍 Search'}
          </button>
        </div>
      </form>

      {results && (
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🏏</span>
              <h3 className="text-2xl font-bold text-gray-800">Batsman Records</h3>
              <span className="ml-auto bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">
                {results.batsmen.length}
              </span>
            </div>
            {results.batsmen.length > 0 ? (
              <div className="space-y-3">
                {results.batsmen.map((record) => (
                  <div
                    key={record.id}
                    className="border border-green-200 p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 hover:shadow-md transition-all transform hover:scale-102"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-bold text-gray-800 text-lg">{record.name}</p>
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${record.reviewed === 1 ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {record.reviewed === 1 ? '✅ Reviewed' : '⏳ Not Reviewed'}
                      </span>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <div className="flex-1">
                        <p className="text-gray-600">Runs Scored</p>
                        <p className="font-bold text-green-700 text-lg">{record.runsScored || 0}</p>
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-600">Balls Faced</p>
                        <p className="font-bold text-green-700 text-lg">{record.ballsFaced || 0}</p>
                      </div>
                      {record.runsScored && record.ballsFaced && (
                        <div className="flex-1">
                          <p className="text-gray-600">Strike Rate</p>
                          <p className="font-bold text-green-700 text-lg">
                            {((record.runsScored / record.ballsFaced) * 100).toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <p className="text-green-700 text-lg font-semibold">🔍 No batsman records found</p>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🎯</span>
              <h3 className="text-2xl font-bold text-gray-800">Bowler Records</h3>
              <span className="ml-auto bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-semibold">
                {results.bowlers.length}
              </span>
            </div>
            {results.bowlers.length > 0 ? (
              <div className="space-y-3">
                {results.bowlers.map((record) => (
                  <div
                    key={record.id}
                    className="border border-purple-200 p-4 rounded-lg bg-gradient-to-r from-purple-50 to-violet-50 hover:shadow-md transition-all transform hover:scale-102"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-bold text-gray-800 text-lg">{record.name}</p>
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${record.reviewed === 1 ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {record.reviewed === 1 ? '✅ Reviewed' : '⏳ Not Reviewed'}
                      </span>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <div className="flex-1">
                        <p className="text-gray-600">Wickets</p>
                        <p className="font-bold text-purple-700 text-lg">{record.wicketsTaken || 0}</p>
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-600">Runs Conceded</p>
                        <p className="font-bold text-purple-700 text-lg">{record.runsConceded || 0}</p>
                      </div>
                      {record.runsConceded && record.wicketsTaken && (
                        <div className="flex-1">
                          <p className="text-gray-600">Avg. Runs/Wicket</p>
                          <p className="font-bold text-purple-700 text-lg">
                            {(record.runsConceded / record.wicketsTaken).toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 text-center">
                <p className="text-purple-700 text-lg font-semibold">🔍 No bowler records found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
