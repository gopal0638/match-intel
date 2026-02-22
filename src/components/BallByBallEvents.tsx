'use client';

import { useState, useEffect } from 'react';

interface Player {
  id: number;
  name: string;
  playerType: string;
}

interface Match {
  id: number;
  team1Id: number;
  team2Id: number;
  team1Name: string;
  team2Name: string;
}

interface MatchEvent {
  id: number;
  matchId: number;
  ballNumber: string;
  bowlerName: string;
  batsmanName: string;
  nonStrikerName: string | null;
  bookmaker: string | null;
  favTeam: string | null;
  fancy1: string | null;
  fancy2: string | null;
  ballInfo: string | null;
  finalScore: string | null;
  eventOccurred: number;
  eventDescription: string | null;
  hasComment: number;
  eventComment: string | null;
}

interface BallByBallEventsProps {
  matchId: number;
}

export default function BallByBallEvents({ matchId }: BallByBallEventsProps) {
  const [match, setMatch] = useState<Match | null>(null);
  const [team1Players, setTeam1Players] = useState<Player[]>([]);
  const [team2Players, setTeam2Players] = useState<Player[]>([]);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    ballNumber: '',
    bowlerName: '',
    batsmanName: '',
    nonStrikerName: '',
    bookmaker: '',
    favTeam: '',
    fancy1: '',
    fancy2: '',
    ballInfo: '',
    finalScore: '',
    eventOccurred: false,
    eventDescription: '',
    hasComment: false,
    eventComment: '',
  });

  useEffect(() => {
    fetchMatchDetails();
    fetchEvents();
    // Initialize with first ball
        setFormData(prev => ({ ...prev, ballNumber: '0.1' }));
  }, [matchId]);

  const fetchMatchDetails = async () => {
    try {
      const res = await fetch(`/api/matches/${matchId}`);
      const data = await res.json();
      setMatch(data.match);
      setTeam1Players(data.team1Players);
      setTeam2Players(data.team2Players);
    } catch (err) {
      setError('Failed to load match details');
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await fetch(`/api/matches/${matchId}/events`);
      const data = await res.json();
      setEvents(data);
      // Update ball number to next ball after fetching
      if (data.length > 0) {
        const lastEvent = data[data.length - 1];
        const [over, ball] = lastEvent.ballNumber.split('.').map(Number);
        const nextBall = ball === 6 ? `${over + 1}.1` : `${over}.${ball + 1}`;
        setFormData(prev => ({
          ...prev,
          ballNumber: nextBall,
          eventOccurred: false,
          eventDescription: '',
          hasComment: false,
          eventComment: '',
        }));
      }
    } catch (err) {
      setError('Failed to load match events');
    }
  };

  const getNextBallNumber = (eventList: MatchEvent[]) => {
    if (eventList.length === 0) return '0.1';
    const lastEvent = eventList[eventList.length - 1];
    const [over, ball] = lastEvent.ballNumber.split('.').map(Number);
    if (ball === 6) {
      return `${over + 1}.1`;
    }
    return `${over}.${ball + 1}`;
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ballNumber || !formData.bowlerName || !formData.batsmanName) {
      setError('Ball number, bowler, and batsman are required');
      return;
    }

    setLoading(true);
    try {
      const url = editingEventId
        ? `/api/matches/${matchId}/events/${editingEventId}`
        : `/api/matches/${matchId}/events`;
      const method = editingEventId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const resultEvent = await res.json();
        let updatedEvents: MatchEvent[];

        if (editingEventId) {
          updatedEvents = events.map((e) => (e.id === editingEventId ? resultEvent : e));
          setEditingEventId(null);
        } else {
          updatedEvents = [...events, resultEvent];
        }
        setEvents(updatedEvents);

        // Keep bowler and batsman, auto-increment ball number
        const nextBall = getNextBallNumber(updatedEvents);
        setFormData({
          ballNumber: nextBall,
          bowlerName: formData.bowlerName,
          batsmanName: formData.batsmanName,
          nonStrikerName: '',
          bookmaker: '',
          favTeam: '',
          fancy1: '',
          fancy2: '',
          ballInfo: '',
          finalScore: '',
          eventOccurred: false,
          eventDescription: '',
          hasComment: false,
          eventComment: '',
        });
        setError('');
      } else {
        const error = await res.json();
        setError(error.error || 'Failed to add event');
      }
    } catch (err) {
      setError('Failed to add event');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (!confirm('Delete this event?')) return;

    try {
      const res = await fetch(`/api/matches/${matchId}/events/${eventId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setEvents(events.filter((e) => e.id !== eventId));
      } else {
        setError('Failed to delete event');
      }
    } catch (err) {
      setError('Failed to delete event');
    }
  };

  const handleEditEvent = (event: MatchEvent) => {
    setFormData({
      ballNumber: event.ballNumber,
      bowlerName: event.bowlerName,
      batsmanName: event.batsmanName,
      nonStrikerName: event.nonStrikerName || '',
      bookmaker: event.bookmaker || '',
      favTeam: event.favTeam || '',
      fancy1: event.fancy1 || '',
      fancy2: event.fancy2 || '',
      ballInfo: event.ballInfo || '',
      finalScore: event.finalScore || '',
      eventOccurred: event.eventOccurred === 1,
      eventDescription: event.eventDescription || '',
      hasComment: event.hasComment === 1,
      eventComment: event.eventComment || '',
    });
    setEditingEventId(event.id);
  };

  const handleCancelEdit = () => {
    setEditingEventId(null);
    setFormData({
      ballNumber: getNextBallNumber(events),
      bowlerName: formData.bowlerName,
      batsmanName: formData.batsmanName,
      nonStrikerName: '',
      bookmaker: '',
      favTeam: '',
      fancy1: '',
      fancy2: '',
      ballInfo: '',
      finalScore: '',
      eventOccurred: false,
      eventDescription: '',
      hasComment: false,
      eventComment: '',
    });
    setError('');
  };

  const filteredEvents = events.filter((event) => {
    if (!searchTerm.trim()) return true;
    const search = searchTerm.toLowerCase();
    const bowler = event.bowlerName.toLowerCase();
    const batsman = event.batsmanName.toLowerCase();
    const nonStriker = (event.nonStrikerName || '').toLowerCase();

    return (
      bowler.includes(search) ||
      batsman.includes(search) ||
      nonStriker.includes(search) ||
      `${bowler} ${batsman}`.includes(search) ||
      `${bowler} ${nonStriker}`.includes(search)
    );
  });

  if (!match) {
    return <div className="text-center py-8">Loading match details...</div>;
  }

  const allPlayers = [...team1Players, ...team2Players];

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Record Ball Event Form - Always Open */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🏏</span>
          <h3 className="text-2xl font-bold text-gray-800">Record Ball Event</h3>
          <span className="ml-auto text-sm text-gray-600">
            {match.team1Name} vs {match.team2Name}
          </span>
        </div>

        <form onSubmit={handleAddEvent} className="space-y-3">
          {/* Row 1: Ball, Bowler, Batsman, Bookmaker, Fav Team */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Ball</label>
              <input
                type="text"
                value={formData.ballNumber}
                onChange={(e) => setFormData({ ...formData, ballNumber: e.target.value })}
                placeholder="0.1"
                className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">🎯 Bowler</label>
              <select
                value={formData.bowlerName}
                onChange={(e) => setFormData({ ...formData, bowlerName: e.target.value })}
                className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">Select</option>
                {allPlayers.map((player) => (
                  <option key={`bowler-${player.id}`} value={player.name}>
                    {player.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">🏏 Batsman</label>
              <select
                value={formData.batsmanName}
                onChange={(e) => setFormData({ ...formData, batsmanName: e.target.value })}
                className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">Select</option>
                {allPlayers.map((player) => (
                  <option key={`batsman-${player.id}`} value={player.name}>
                    {player.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">👤 Non-Striker</label>
              <select
                value={formData.nonStrikerName}
                onChange={(e) => setFormData({ ...formData, nonStrikerName: e.target.value })}
                className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">Select</option>
                {allPlayers.map((player) => (
                  <option key={`nonstriker-${player.id}`} value={player.name}>
                    {player.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Bookmaker</label>
              <input
                type="text"
                value={formData.bookmaker}
                onChange={(e) => setFormData({ ...formData, bookmaker: e.target.value })}
                placeholder="Bookmaker"
                className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Fav Team</label>
              <select
                value={formData.favTeam}
                onChange={(e) => setFormData({ ...formData, favTeam: e.target.value })}
                className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">Select</option>
                <option value={match.team1Name}>{match.team1Name}</option>
                <option value={match.team2Name}>{match.team2Name}</option>
              </select>
            </div>
          </div>

          {/* Row 2: Fancy 1, Fancy 2, Ball Info, Final Score, Event, Comment */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">💰 Fancy 1</label>
              <input
                type="text"
                value={formData.fancy1}
                onChange={(e) => setFormData({ ...formData, fancy1: e.target.value })}
                placeholder="Fancy 1"
                className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">💰 Fancy 2</label>
              <input
                type="text"
                value={formData.fancy2}
                onChange={(e) => setFormData({ ...formData, fancy2: e.target.value })}
                placeholder="Fancy 2"
                className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Ball Info</label>
              <input
                type="text"
                value={formData.ballInfo}
                onChange={(e) => setFormData({ ...formData, ballInfo: e.target.value })}
                placeholder="Ball Info"
                className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Final Score</label>
              <input
                type="text"
                value={formData.finalScore}
                onChange={(e) => setFormData({ ...formData, finalScore: e.target.value })}
                placeholder="Score"
                className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer mb-0">
                <input
                  type="checkbox"
                  checked={formData.eventOccurred}
                  onChange={(e) => setFormData({ ...formData, eventOccurred: e.target.checked })}
                  className="w-4 h-4 accent-blue-600"
                />
                <span className="text-xs font-semibold text-gray-700">Event</span>
              </label>
            </div>

            <div className="flex items-end gap-1">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold text-sm"
              >
                {loading ? '🔄' : editingEventId ? '✏️ Update' : '✅ Add'}
              </button>
              {editingEventId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-3 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 font-semibold text-sm"
                >
                  ✕ Cancel
                </button>
              )}
            </div>
          </div>

          {formData.eventOccurred && (
            <input
              type="text"
              value={formData.eventDescription}
              onChange={(e) => setFormData({ ...formData, eventDescription: e.target.value })}
              placeholder="Event description (towel, drinks, etc.)"
              className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          )}
        </form>
      </div>

      {/* Events List */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">📊</span>
          <h3 className="text-2xl font-bold text-gray-800">Match Events</h3>
          <span className="ml-auto bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-semibold text-sm">
            {filteredEvents.length} {searchTerm && `/ ${events.length}`}
          </span>
        </div>

        {events.length > 0 && (
          <div className="mb-4">
            <input
              type="text"
              placeholder="🔍 Search by player, bowler, batsman, non-striker or combo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {filteredEvents.length > 0 ? (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className={`border p-3 rounded-lg transition-all text-sm ${
                  event.eventOccurred === 1 || event.hasComment === 1
                    ? 'border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50'
                    : 'border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50'
                }`}
              >
                <div className="flex items-start gap-2 flex-wrap justify-between">
                  <div className="flex items-center gap-2 flex-wrap flex-1">
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded whitespace-nowrap">
                      Ball {event.ballNumber}
                    </span>
                    <span className="text-xs font-semibold text-gray-600">
                      🎯 {event.bowlerName}
                    </span>
                    <span className="text-xs text-gray-500">vs</span>
                    <span className="text-xs font-semibold text-gray-600">
                      🏏 {event.batsmanName}
                    </span>
                    {event.nonStrikerName && (
                      <>
                        <span className="text-xs text-gray-500">/</span>
                        <span className="text-xs font-semibold text-gray-500">
                          🧑 {event.nonStrikerName}
                        </span>
                      </>
                    )}
                    {event.bookmaker && (
                      <span className="text-xs bg-gray-200 text-gray-800 px-1 py-0.5 rounded">
                        BM: {event.bookmaker}
                      </span>
                    )}
                    {event.favTeam && (
                      <span className="text-xs bg-green-200 text-green-800 px-1 py-0.5 rounded">
                        FAV: {event.favTeam}
                      </span>
                    )}
                    {event.fancy1 && (
                      <span className="text-xs bg-purple-200 text-purple-800 px-1 py-0.5 rounded">
                        💰 {event.fancy1}
                      </span>
                    )}
                    {event.fancy2 && (
                      <span className="text-xs bg-purple-200 text-purple-800 px-1 py-0.5 rounded">
                        💰 {event.fancy2}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditEvent(event)}
                      className="px-2 py-0.5 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 font-semibold"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="px-2 py-0.5 bg-red-500 text-white rounded text-xs hover:bg-red-600 font-semibold"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Additional details on separate lines if present */}
                {(event.ballInfo || event.finalScore || event.eventOccurred === 1 || event.hasComment === 1) && (
                  <div className="mt-2 pt-2 border-t border-gray-300 space-y-1">
                    {event.ballInfo && (
                      <p className="text-xs text-gray-700">
                        <span className="font-semibold">BI:</span> {event.ballInfo}
                      </p>
                    )}
                    {event.finalScore && (
                      <p className="text-xs text-gray-700">
                        <span className="font-semibold">Score:</span> {event.finalScore}
                      </p>
                    )}
                    {event.eventOccurred === 1 && (
                      <p className="text-xs text-yellow-800 font-semibold">
                        🚨 {event.eventDescription || 'Event'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-indigo-50 rounded-lg border border-indigo-200">
            {events.length === 0 ? (
              <>
                <p className="text-indigo-700 text-sm font-semibold">📊 No events recorded yet</p>
              </>
            ) : (
              <>
                <p className="text-indigo-700 text-sm font-semibold">🔍 No events match your search</p>
                <p className="text-indigo-600 text-xs mt-2">Try searching with different keywords</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
