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

interface MatchDetailsProps {
  matchId: number;
}

export default function MatchDetails({ matchId }: MatchDetailsProps) {
  const [batsmen, setBatsmen] = useState<Record[]>([]);
  const [bowlers, setBowlers] = useState<Record[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showBatsmanForm, setShowBatsmanForm] = useState(false);
  const [showBowlerForm, setShowBowlerForm] = useState(false);
  const [batsmanForm, setBatsmanForm] = useState({ name: '', runsScored: '', ballsFaced: '' });
  const [bowlerForm, setBowlerForm] = useState({ name: '', wicketsTaken: '', runsConceded: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [reviewComment, setReviewComment] = useState('');

  useEffect(() => {
    fetchRecords();
  }, [matchId]);

  const fetchRecords = async () => {
    try {
      const res = await fetch(`/api/matches/${matchId}/records`);
      const data = await res.json();
      setBatsmen(data.batsmen || []);
      setBowlers(data.bowlers || []);
    } catch (err) {
      setError('Failed to load records');
    }
  };

  const handleAddBatsman = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batsmanForm.name || !batsmanForm.runsScored || !batsmanForm.ballsFaced) {
      setError('All batsman fields are required');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/matches/${matchId}/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'batsman',
          name: batsmanForm.name,
          runsScored: parseInt(batsmanForm.runsScored),
          ballsFaced: parseInt(batsmanForm.ballsFaced),
        }),
      });

      if (res.ok) {
        setBatsmanForm({ name: '', runsScored: '', ballsFaced: '' });
        setShowBatsmanForm(false);
        fetchRecords();
      } else {
        setError('Failed to add batsman');
      }
    } catch (err) {
      setError('Failed to add batsman');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBowler = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bowlerForm.name || !bowlerForm.wicketsTaken || !bowlerForm.runsConceded) {
      setError('All bowler fields are required');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/matches/${matchId}/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'bowler',
          name: bowlerForm.name,
          wicketsTaken: parseInt(bowlerForm.wicketsTaken),
          runsConceded: parseInt(bowlerForm.runsConceded),
        }),
      });

      if (res.ok) {
        setBowlerForm({ name: '', wicketsTaken: '', runsConceded: '' });
        setShowBowlerForm(false);
        fetchRecords();
      } else {
        setError('Failed to add bowler');
      }
    } catch (err) {
      setError('Failed to add bowler');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (recordId: number, isReviewed: boolean, type: 'batsman' | 'bowler') => {
    try {
      const res = await fetch(`/api/matches/${matchId}/records/${recordId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewed: !isReviewed,
          reviewComment: !isReviewed ? reviewComment : '',
        }),
      });

      if (res.ok) {
        fetchRecords();
        setEditingId(null);
        setReviewComment('');
      }
    } catch (err) {
      setError('Failed to update review status');
    }
  };

  const handleDelete = async (recordId: number) => {
    if (confirm('Are you sure you want to delete this record?')) {
      try {
        const res = await fetch(`/api/matches/${matchId}/records/${recordId}`, {
          method: 'DELETE',
        });

        if (res.ok) {
          fetchRecords();
        }
      } catch (err) {
        setError('Failed to delete record');
      }
    }
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Batsmen Section */}
      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏏</span>
            <h3 className="text-3xl font-bold text-gray-800">Batsmen</h3>
            <span className="ml-auto bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">
              {batsmen.length}
            </span>
          </div>
          <button
            onClick={() => setShowBatsmanForm(!showBatsmanForm)}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-all transform hover:scale-105"
          >
            {showBatsmanForm ? '✕ Cancel' : '+ Add Batsman'}
          </button>
        </div>

        {showBatsmanForm && (
          <form onSubmit={handleAddBatsman} className="mb-6 p-6 border border-green-200 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Player Name</label>
                <input
                  type="text"
                  placeholder="Enter player name"
                  value={batsmanForm.name}
                  onChange={(e) => setBatsmanForm({ ...batsmanForm, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Runs Scored</label>
                <input
                  type="number"
                  placeholder="0"
                  value={batsmanForm.runsScored}
                  onChange={(e) => setBatsmanForm({ ...batsmanForm, runsScored: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Balls Faced</label>
                <input
                  type="number"
                  placeholder="0"
                  value={batsmanForm.ballsFaced}
                  onChange={(e) => setBatsmanForm({ ...batsmanForm, ballsFaced: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold transition-all transform hover:scale-105"
            >
              {loading ? '🔄 Adding...' : '✅ Add Batsman'}
            </button>
          </form>
        )}

        <div className="space-y-3">
          {batsmen.map((record) => (
            <div key={record.id} className="border border-green-200 p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <p className="font-bold text-gray-800 text-lg">{record.name}</p>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <p className="text-xs text-gray-600 font-semibold">RUNS SCORED</p>
                      <p className="font-bold text-green-700 text-lg">{record.runsScored || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-semibold">BALLS FACED</p>
                      <p className="font-bold text-green-700 text-lg">{record.ballsFaced || 0}</p>
                    </div>
                    {record.runsScored && record.ballsFaced && (
                      <div>
                        <p className="text-xs text-gray-600 font-semibold">STRIKE RATE</p>
                        <p className="font-bold text-green-700 text-lg">
                          {((record.runsScored / record.ballsFaced) * 100).toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => handleDelete(record.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 font-semibold transition-colors"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-green-200">
                <input
                  type="checkbox"
                  checked={record.reviewed === 1}
                  onChange={() => handleReview(record.id, record.reviewed === 1, 'batsman')}
                  className="w-5 h-5 accent-green-600 cursor-pointer"
                />
                <span className={`text-sm font-semibold ${record.reviewed === 1 ? 'text-blue-700' : 'text-yellow-700'}`}>
                  {record.reviewed === 1 ? '✅ Reviewed' : '⏳ Not Reviewed'}
                </span>
              </div>

              {record.reviewComment && (
                <p className="text-sm text-gray-600 mt-2 p-2 bg-white rounded border-l-4 border-green-500 italic">
                  💬 {record.reviewComment}
                </p>
              )}
            </div>
          ))}
        </div>

        {batsmen.length === 0 && (
          <div className="text-center py-12 bg-green-50 rounded-lg border border-green-200">
            <p className="text-green-700 text-lg font-semibold">🏏 No batsman records yet</p>
            <p className="text-green-600 text-sm mt-1">Add your first batsman record above</p>
          </div>
        )}
      </div>

      {/* Bowlers Section */}
      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎯</span>
            <h3 className="text-3xl font-bold text-gray-800">Bowlers</h3>
            <span className="ml-auto bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-semibold">
              {bowlers.length}
            </span>
          </div>
          <button
            onClick={() => setShowBowlerForm(!showBowlerForm)}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold transition-all transform hover:scale-105"
          >
            {showBowlerForm ? '✕ Cancel' : '+ Add Bowler'}
          </button>
        </div>

        {showBowlerForm && (
          <form onSubmit={handleAddBowler} className="mb-6 p-6 border border-purple-200 rounded-lg bg-gradient-to-br from-purple-50 to-violet-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Player Name</label>
                <input
                  type="text"
                  placeholder="Enter player name"
                  value={bowlerForm.name}
                  onChange={(e) => setBowlerForm({ ...bowlerForm, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Wickets Taken</label>
                <input
                  type="number"
                  placeholder="0"
                  value={bowlerForm.wicketsTaken}
                  onChange={(e) => setBowlerForm({ ...bowlerForm, wicketsTaken: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Runs Conceded</label>
                <input
                  type="number"
                  placeholder="0"
                  value={bowlerForm.runsConceded}
                  onChange={(e) => setBowlerForm({ ...bowlerForm, runsConceded: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-semibold transition-all transform hover:scale-105"
            >
              {loading ? '🔄 Adding...' : '✅ Add Bowler'}
            </button>
          </form>
        )}

        <div className="space-y-3">
          {bowlers.map((record) => (
            <div key={record.id} className="border border-purple-200 p-4 rounded-lg bg-gradient-to-r from-purple-50 to-violet-50 hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <p className="font-bold text-gray-800 text-lg">{record.name}</p>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <p className="text-xs text-gray-600 font-semibold">WICKETS TAKEN</p>
                      <p className="font-bold text-purple-700 text-lg">{record.wicketsTaken || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-semibold">RUNS CONCEDED</p>
                      <p className="font-bold text-purple-700 text-lg">{record.runsConceded || 0}</p>
                    </div>
                    {record.runsConceded && record.wicketsTaken && (
                      <div>
                        <p className="text-xs text-gray-600 font-semibold">AVG. RUNS/WICKET</p>
                        <p className="font-bold text-purple-700 text-lg">
                          {(record.runsConceded / record.wicketsTaken).toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => handleDelete(record.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 font-semibold transition-colors"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-purple-200">
                <input
                  type="checkbox"
                  checked={record.reviewed === 1}
                  onChange={() => handleReview(record.id, record.reviewed === 1, 'bowler')}
                  className="w-5 h-5 accent-purple-600 cursor-pointer"
                />
                <span className={`text-sm font-semibold ${record.reviewed === 1 ? 'text-blue-700' : 'text-yellow-700'}`}>
                  {record.reviewed === 1 ? '✅ Reviewed' : '⏳ Not Reviewed'}
                </span>
              </div>

              {record.reviewComment && (
                <p className="text-sm text-gray-600 mt-2 p-2 bg-white rounded border-l-4 border-purple-500 italic">
                  💬 {record.reviewComment}
                </p>
              )}
            </div>
          ))}
        </div>

        {bowlers.length === 0 && (
          <div className="text-center py-12 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-purple-700 text-lg font-semibold">🎯 No bowler records yet</p>
            <p className="text-purple-600 text-sm mt-1">Add your first bowler record above</p>
          </div>
        )}
      </div>
    </div>
  );
}
