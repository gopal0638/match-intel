'use client';

import { useState, useEffect } from 'react';
import PlayerAutocomplete from './PlayerAutocomplete';

interface Championship {
  id: number;
  name: string;
}

type EventRecord = Record<string, any>;

export default function SearchSection() {
  const [batsmanOnStrike, setBatsmanOnStrike] = useState('');
  const [batsmanNonStrike, setBatsmanNonStrike] = useState('');
  const [bowler, setBowler] = useState('');
  const [ground, setGround] = useState('');
  const [championshipId, setChampionshipId] = useState('');
  const [limit, setLimit] = useState<number>(50);
  const [offset, setOffset] = useState<number>(0);

  const [results, setResults] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [championships, setChampionships] = useState<Championship[]>([]);

  const [analyticsResult, setAnalyticsResult] = useState<{
    matchCount: number;
    totalRuns: number;
    wicketCount: number;
    ballCount: number;
    summarySentence: string;
    filters: Record<string, string | null>;
  } | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

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

  const buildQuery = () => {
    const params: string[] = [];
    if (batsmanOnStrike.trim()) params.push(`batsmanOnStrike=${encodeURIComponent(batsmanOnStrike.trim())}`);
    if (batsmanNonStrike.trim()) params.push(`batsmanNonStrike=${encodeURIComponent(batsmanNonStrike.trim())}`);
    if (bowler.trim()) params.push(`bowler=${encodeURIComponent(bowler.trim())}`);
    if (ground.trim()) params.push(`ground=${encodeURIComponent(ground.trim())}`);
    if (championshipId) params.push(`championship=${encodeURIComponent(championshipId)}`);
    params.push(`limit=${Math.max(1, Math.min(1000, Number(limit || 50)))}`);
    params.push(`offset=${Math.max(0, Number(offset || 0))}`);
    return params.length ? `?${params.join('&')}` : '';
  };

  /** Query string for analytics (filter params only; analytics API ignores limit/offset) */
  const buildAnalyticsQuery = () => {
    const params: string[] = [];
    if (batsmanOnStrike.trim()) params.push(`batsmanOnStrike=${encodeURIComponent(batsmanOnStrike.trim())}`);
    if (batsmanNonStrike.trim()) params.push(`batsmanNonStrike=${encodeURIComponent(batsmanNonStrike.trim())}`);
    if (bowler.trim()) params.push(`bowler=${encodeURIComponent(bowler.trim())}`);
    if (ground.trim()) params.push(`ground=${encodeURIComponent(ground.trim())}`);
    if (championshipId) params.push(`championship=${encodeURIComponent(championshipId)}`);
    return params.length ? `?${params.join('&')}` : '?';
  };

  const handleGetAnalytics = async () => {
    setError('');
    setAnalyticsResult(null);
    setAnalyticsLoading(true);
    try {
      const qs = buildAnalyticsQuery();
      const res = await fetch(`/api/search/analytics${qs}`);
      if (!res.ok) throw new Error(`Analytics failed: ${res.status}`);
      const data = await res.json();
      setAnalyticsResult(data);
    } catch (err) {
      setError('Failed to load analytics');
      console.error(err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');
    setLoading(true);
    try {
      const qs = buildQuery();
      const res = await fetch(`/api/search${qs}`);
      if (!res.ok) throw new Error(`Search failed: ${res.status}`);
      const data = await res.json();
      // Expect an array of event rows
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Failed to perform search');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrev = () => {
    setOffset((o) => Math.max(0, o - limit));
  };

  const handleNext = () => {
    setOffset((o) => o + limit);
  };

  const handleReset = async () => {
    setBatsmanOnStrike('');
    setBatsmanNonStrike('');
    setBowler('');
    setGround('');
    setChampionshipId('');
    setLimit(50);
    setOffset(0);
    setResults([]);
    setAnalyticsResult(null);
    setError('');
  };

  useEffect(() => {
    // refetch when offset/limit changes
    handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset, limit]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="text-3xl">🔎</div>
        <h2 className="text-3xl font-bold text-gray-800">Advanced Search</h2>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 border border-red-200 flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <PlayerAutocomplete
            value={batsmanOnStrike}
            onChange={setBatsmanOnStrike}
            placeholder="Name or partial"
            className="w-full px-3 py-2 border rounded"
            label="Batsman (on strike)"
          />
        </div>
        <div>
          <PlayerAutocomplete
            value={batsmanNonStrike}
            onChange={setBatsmanNonStrike}
            placeholder="Name or partial"
            className="w-full px-3 py-2 border rounded"
            label="Batsman (non-strike)"
          />
        </div>
        <div>
          <PlayerAutocomplete
            value={bowler}
            onChange={setBowler}
            placeholder="Name or partial"
            className="w-full px-3 py-2 border rounded"
            label="Bowler"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Ground</label>
          <input value={ground} onChange={(e) => setGround(e.target.value)} className="w-full px-3 py-2 border rounded" placeholder="Ground name" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Championship</label>
          <select value={championshipId} onChange={(e) => setChampionshipId(e.target.value)} className="w-full px-3 py-2 border rounded">
            <option value="">Any</option>
            {championships.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Limit</label>
          <input type="number" value={limit} onChange={(e) => setLimit(Math.max(1, Number(e.target.value || 50)))} className="w-full px-3 py-2 border rounded" />
        </div>
        <div className="flex items-end gap-2">
          <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            {loading ? 'Searching…' : 'Search'}
          </button>
          <button
            type="button"
            onClick={handleGetAnalytics}
            disabled={analyticsLoading}
            className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 disabled:opacity-50"
          >
            {analyticsLoading ? 'Loading…' : 'Get Analytics'}
          </button>
        </div>
      </form>

      {analyticsResult && (
        <div className="mb-6 p-5 rounded-xl border border-emerald-200 bg-emerald-50/80 shadow-sm">
          <h3 className="text-lg font-bold text-emerald-800 mb-2">Analytics</h3>
          <p className="text-gray-800 leading-relaxed mb-4">{analyticsResult.summarySentence}</p>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="font-semibold text-gray-700">Matches: <span className="text-emerald-700">{analyticsResult.matchCount}</span></span>
            <span className="font-semibold text-gray-700">Runs: <span className="text-emerald-700">{analyticsResult.totalRuns}</span></span>
            <span className="font-semibold text-gray-700">Wickets: <span className="text-emerald-700">{analyticsResult.wicketCount}</span></span>
            <span className="font-semibold text-gray-700">Balls: <span className="text-emerald-700">{analyticsResult.ballCount}</span></span>
          </div>
        </div>
      )}

      <div className="mb-4 flex items-center gap-3">
        <button onClick={handleReset} className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200">Reset</button>
        <div className="ml-auto text-sm text-gray-600">Showing {results.length} results • Offset {offset}</div>
      </div>

      <div className="space-y-3">
        {results.length === 0 && !loading && (
          <div className="bg-gray-50 border border-gray-200 rounded p-6 text-center text-gray-600">No results</div>
        )}

        {results.map((r, idx) => (
          <div key={r.id ?? idx} className="border rounded p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-gray-500 uppercase font-semibold">Match</div>
                <div className="text-sm font-semibold text-gray-800 mt-1">{r.team1Name} vs {r.team2Name}</div>
                <div className="text-xs text-gray-600 mt-1">{new Date(r.matchDate).toLocaleDateString()}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase font-semibold">Ball</div>
                <div className="text-sm font-mono text-gray-800 mt-1">{r.ballNumber}</div>
                <div className="text-xs text-gray-600 mt-1">{r.groundName || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase font-semibold">Players</div>
                <div className="text-xs text-gray-700 mt-1">
                  <div><strong>On Strike:</strong> {r.batsmanName}</div>
                  <div><strong>Non-Strike:</strong> {r.nonStrikerName || '—'}</div>
                  <div><strong>Bowler:</strong> {r.bowlerName}</div>
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase font-semibold">Details</div>
                <div className="text-xs text-gray-700 mt-1">
                  <div><strong>Championship:</strong> {r.championshipName}</div>
                  <div><strong>Score:</strong> {r.runningTotal ?? '—'}</div>
                  {r.eventDescription && (
                    <div className="text-xs mt-2 text-red-800 font-semibold border rounded p-4 bg-yellow shadow-sm hover:shadow-md transition-shadow border-orange-300 bg-gradient-to-r from-orange-50 to-orange-50">
                      🚨 {r.eventDescription}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-3">
        <button onClick={() => { handlePrev(); }} disabled={offset === 0} className="px-3 py-2 bg-gray-100 rounded disabled:opacity-50">Prev</button>
        <button onClick={() => { handleNext(); }} className="px-3 py-2 bg-gray-100 rounded">Next</button>
        <div className="ml-auto text-sm text-gray-600">Limit: {limit}</div>
      </div>
    </div>
  );
}
