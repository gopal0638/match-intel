'use client';

import { useState, useEffect } from 'react';

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
          <label className="block text-sm font-semibold text-gray-700 mb-2">Batsman (on strike)</label>
          <input value={batsmanOnStrike} onChange={(e) => setBatsmanOnStrike(e.target.value)} className="w-full px-3 py-2 border rounded" placeholder="Name or partial" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Batsman (non-strike)</label>
          <input value={batsmanNonStrike} onChange={(e) => setBatsmanNonStrike(e.target.value)} className="w-full px-3 py-2 border rounded" placeholder="Name or partial" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Bowler</label>
          <input value={bowler} onChange={(e) => setBowler(e.target.value)} className="w-full px-3 py-2 border rounded" placeholder="Name or partial" />
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
        <div className="flex items-end">
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>
      </form>

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
                  <div><strong>Final:</strong> {r.finalScore || '—'}</div>
                  {r.eventDescription && <div className="text-xs italic mt-2 text-gray-600">{r.eventDescription}</div>}
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
