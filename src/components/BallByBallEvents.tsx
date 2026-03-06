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
  tossWinnerTeamId?: number | null;
  tossDecision?: string | null;
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
  eventOccurred: number;
  eventDescription: string | null;
  hasComment: number;
  eventComment: string | null;
  inningsNumber?: number;
  runsScored?: number;
  extraRuns?: number;
  isWide?: number;
  isNoBall?: number;
  isBye?: number;
  isLegBye?: number;
  isWicket?: number;
  isInningsComplete?: number;
}

interface BallByBallEventsProps {
  matchId: number;
}

function computeRunningTotals(events: MatchEvent[]) {
  const totalsByEvent = new Map<number, number>();
  const totalsByInnings = new Map<number, number>();

  const sorted = [...events].sort((a, b) => {
    const inningsA = a.inningsNumber || 1;
    const inningsB = b.inningsNumber || 1;
    if (inningsA !== inningsB) return inningsA - inningsB;

    const [overA, ballA] = a.ballNumber.split('.').map(Number);
    const [overB, ballB] = b.ballNumber.split('.').map(Number);

    if (overA !== overB) return overA - overB;
    return ballA - ballB;
  });

  for (const ev of sorted) {
    const innings = ev.inningsNumber || 1;
    const prevTotal = totalsByInnings.get(innings) ?? 0;
    const runsThisBall = (ev.runsScored ?? 0) + (ev.extraRuns ?? 0);
    const totalForEvent = prevTotal + runsThisBall;
    totalsByInnings.set(innings, totalForEvent);
    totalsByEvent.set(ev.id, totalForEvent);
  }

  return totalsByEvent;
}

export default function BallByBallEvents({ matchId }: BallByBallEventsProps) {
  const [match, setMatch] = useState<Match | null>(null);
  const [team1Players, setTeam1Players] = useState<Player[]>([]);
  const [team2Players, setTeam2Players] = useState<Player[]>([]);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [inningsNumber, setInningsNumber] = useState<number>(1);
  const [scoreboard, setScoreboard] = useState<
    { inningsNumber: number; totalRuns: number; wickets: number; overs: string; extras: number; runRate: number }[]
  >([]);
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
    ballInfoNote: '',
    eventOccurred: false,
    eventDescription: '',
    hasComment: false,
    eventComment: '',
    runsScored: 0,
    extraRuns: 0,
    isWide: false,
    isNoBall: false,
    isLegBye: false,
    isWicket: false,
    isInningsComplete: false,
  });

  useEffect(() => {
    fetchMatchDetails();
    fetchEvents();
    fetchScoreboard();
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
      // default innings based on whether any second innings events exist later
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
        const nextBall = getNextBallNumber(data);
        setFormData(prev => ({
          ...prev,
          ballNumber: nextBall,
          ballInfo: '',
          ballInfoNote: '',
          eventOccurred: false,
          eventDescription: '',
          hasComment: false,
          eventComment: '',
          runsScored: 0,
          extraRuns: 0,
          isWide: false,
          isNoBall: false,
          isLegBye: false,
          isWicket: false,
          isInningsComplete: false,
        }));
        // set innings to the latest innings present
        const maxInnings = data.reduce(
          (max: number, ev: MatchEvent) =>
            Math.max(max, ev.inningsNumber || 1),
          1
        );
        setInningsNumber(maxInnings);
      }
    } catch (err) {
      setError('Failed to load match events');
    }
  };

  const getNextBallNumber = (eventList: MatchEvent[]) => {
    // Find last legal delivery (not wide or no-ball) for current innings
    const legalEvents = eventList.filter(
      (e) =>
        (e.inningsNumber || 1) === inningsNumber &&
        !(e.isWide === 1 || e.isNoBall === 1)
    );
    if (legalEvents.length === 0) return '0.1';
    const lastEvent = legalEvents[legalEvents.length - 1];
    const [over, ball] = lastEvent.ballNumber.split('.').map(Number);
    if (ball === 6) {
      return `${over + 1}.1`;
    }
    return `${over}.${ball + 1}`;
  };

  const fetchScoreboard = async () => {
    try {
      const res = await fetch(`/api/matches/${matchId}/scoreboard`);
      const data = await res.json();
      if (res.ok) {
        setScoreboard(data.innings || []);
      }
    } catch {
      // non-fatal
    }
  };

  const buildBallInfo = (
    note: string,
    isWide: boolean,
    isNoBall: boolean,
    isLegBye: boolean
  ) => {
    const parts: string[] = [];
    if (note.trim()) parts.push(note.trim());
    if (isWide) parts.push('Wide');
    if (isNoBall) parts.push('No Ball');
    if (isLegBye) parts.push('Leg Bye');
    return parts.join(' | ');
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
        body: JSON.stringify({
          ...formData,
          inningsNumber,
        }),
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

        // Determine next striker/non-striker based on runs and over completion
        let nextBatsman = formData.batsmanName;
        let nextNonStriker = formData.nonStrikerName;
        const isWide = resultEvent.isWide === 1;
        const isNoBall = resultEvent.isNoBall === 1;
        const runs = resultEvent.runsScored ?? 0;
        const [overStr, ballStr] = resultEvent.ballNumber.split('.');
        const ballNum = Number(ballStr) || 0;

        if (nextBatsman && nextNonStriker) {
          const shouldSwapForRuns =
            !isWide && !isNoBall && (runs === 1 || runs === 3);
          const isLegalDelivery = !isWide && !isNoBall;
          const isEndOfOver = isLegalDelivery && ballNum === 6;

          if (shouldSwapForRuns) {
            [nextBatsman, nextNonStriker] = [nextNonStriker, nextBatsman];
          }

          if (isEndOfOver) {
            [nextBatsman, nextNonStriker] = [nextNonStriker, nextBatsman];
          }
        }

        // Keep bowler and favourite team, compute next ball number based on legality
        let nextBall: string;
        if (resultEvent.isWide === 1 || resultEvent.isNoBall === 1) {
          // wide/no-ball: ball count does not advance
          nextBall = resultEvent.ballNumber;
        } else {
          nextBall = getNextBallNumber(updatedEvents);
        }
        setFormData({
          ballNumber: nextBall,
          bowlerName: formData.bowlerName,
          batsmanName: nextBatsman,
          nonStrikerName: nextNonStriker,
          bookmaker: '',
          favTeam: formData.favTeam,
          fancy1: '',
          fancy2: '',
          ballInfo: '',
          ballInfoNote: '',
          eventOccurred: false,
          eventDescription: '',
          hasComment: false,
          eventComment: '',
          runsScored: 0,
          extraRuns: 0,
          isWide: false,
          isNoBall: false,
          isLegBye: false,
          isWicket: false,
          isInningsComplete: false,
        });
        setError('');
        fetchScoreboard();
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
      ballInfoNote: event.ballInfo || '',
      eventOccurred: event.eventOccurred === 1,
      eventDescription: event.eventDescription || '',
      hasComment: event.hasComment === 1,
      eventComment: event.eventComment || '',
      runsScored: event.runsScored ?? 0,
      extraRuns: event.extraRuns ?? 0,
      isWide: event.isWide === 1,
      isNoBall: event.isNoBall === 1,
      isLegBye: event.isLegBye === 1,
      isWicket: event.isWicket === 1,
      isInningsComplete: event.isInningsComplete === 1,
    });
    setEditingEventId(event.id);
    setInningsNumber(event.inningsNumber || 1);
  };

  const handleCancelEdit = () => {
    setEditingEventId(null);
    setFormData({
      ballNumber: getNextBallNumber(events),
      bowlerName: formData.bowlerName,
      batsmanName: formData.batsmanName,
      nonStrikerName: formData.nonStrikerName,
      bookmaker: '',
      favTeam: formData.favTeam,
      fancy1: '',
      fancy2: '',
      ballInfo: '',
      ballInfoNote: '',
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

  const eventRunningTotals = computeRunningTotals(events);

  if (!match) {
    return <div className="text-center py-8">Loading match details...</div>;
  }

  const computeBattingAndBowling = () => {
    if (!match) {
      return { battingPlayers: team1Players, bowlingPlayers: team2Players };
    }
    const { team1Id, team2Id, tossWinnerTeamId, tossDecision } = match;
    const winner = tossWinnerTeamId || team1Id;
    const other = winner === team1Id ? team2Id : team1Id;
    const decision = (tossDecision || 'bat').toLowerCase();

    let battingTeamId: number;
    let bowlingTeamId: number;
    if (decision === 'bat') {
      battingTeamId = inningsNumber === 1 ? winner : other;
      bowlingTeamId = inningsNumber === 1 ? other : winner;
    } else {
      // bowl
      battingTeamId = inningsNumber === 1 ? other : winner;
      bowlingTeamId = inningsNumber === 1 ? winner : other;
    }

    const battingPlayers =
      battingTeamId === team1Id ? team1Players : team2Players;
    const bowlingPlayers =
      bowlingTeamId === team1Id ? team1Players : team2Players;

    return { battingPlayers, bowlingPlayers };
  };

  const { battingPlayers, bowlingPlayers } = computeBattingAndBowling();

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Scoreboard */}
      {scoreboard.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-4 border border-green-100">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">📋</span>
            <h3 className="text-lg font-bold text-gray-800">Scoreboard</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {scoreboard.map((inn) => (
              <div
                key={inn.inningsNumber}
                className="border border-green-200 rounded-lg p-3 bg-gradient-to-r from-green-50 to-emerald-50"
              >
                <div className="font-semibold text-gray-800 mb-1">
                  Innings {inn.inningsNumber}
                </div>
                <div className="flex flex-wrap gap-3 text-gray-700">
                  <span>
                    <strong>Runs:</strong> {inn.totalRuns}/{inn.wickets}
                  </span>
                  <span>
                    <strong>Overs:</strong> {inn.overs}
                  </span>
                  <span>
                    <strong>Extras:</strong> {inn.extras}
                  </span>
                  <span>
                    <strong>RR:</strong> {inn.runRate}
                  </span>
                </div>
              </div>
            ))}
          </div>
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
          {/* Toss & innings info */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2 text-xs text-gray-700">
            <div>
              <span className="font-semibold mr-2">Innings:</span>
              <span className="px-2 py-1 rounded-full bg-indigo-100 text-indigo-800 font-semibold">
                {inningsNumber}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span>
                Batting:{' '}
                <strong>
                  {battingPlayers === team1Players ? match.team1Name : match.team2Name}
                </strong>
              </span>
              <span>
                Bowling:{' '}
                <strong>
                  {battingPlayers === team1Players ? match.team2Name : match.team1Name}
                </strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setInningsNumber((prev) => (prev === 1 ? 2 : 1));
                  // reset ball number for new innings
                  const eventsForInnings = events.filter(
                    (e) => (e.inningsNumber || 1) === (inningsNumber === 1 ? 2 : 1)
                  );
                  const nextBall = getNextBallNumber(eventsForInnings);
                  setFormData((prev) => ({
                    ...prev,
                    ballNumber: nextBall,
                  }));
                }}
                className="px-2 py-1 rounded-lg border border-indigo-300 text-indigo-700 hover:bg-indigo-50"
              >
                Switch Innings
              </button>
            </div>
          </div>

          {/* Extras flags */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
              <input
                type="checkbox"
                checked={formData.isWide}
                onChange={(e) => {
                  const isWide = e.target.checked;
                  setFormData((prev) => ({
                    ...prev,
                    isWide,
                    ballInfo: buildBallInfo(
                      prev.ballInfoNote,
                      isWide,
                      prev.isNoBall,
                      prev.isLegBye
                    ),
                  }));
                }}
                className="w-4 h-4 accent-blue-600"
              />
              <span>Wide</span>
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
              <input
                type="checkbox"
                checked={formData.isNoBall}
                onChange={(e) => {
                  const isNoBall = e.target.checked;
                  setFormData((prev) => ({
                    ...prev,
                    isNoBall,
                    ballInfo: buildBallInfo(
                      prev.ballInfoNote,
                      prev.isWide,
                      isNoBall,
                      prev.isLegBye
                    ),
                  }));
                }}
                className="w-4 h-4 accent-blue-600"
              />
              <span>No Ball</span>
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
              <input
                type="checkbox"
                checked={formData.isLegBye}
                onChange={(e) => {
                  const isLegBye = e.target.checked;
                  setFormData((prev) => ({
                    ...prev,
                    isLegBye,
                    ballInfo: buildBallInfo(
                      prev.ballInfoNote,
                      prev.isWide,
                      prev.isNoBall,
                      isLegBye
                    ),
                  }));
                }}
                className="w-4 h-4 accent-blue-600"
              />
              <span>Leg Bye</span>
            </label>
          </div>

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
                {bowlingPlayers.map((player) => (
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
                {battingPlayers.map((player) => (
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
                {battingPlayers.map((player) => (
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
                value={formData.ballInfoNote}
                onChange={(e) => {
                  const note = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    ballInfoNote: note,
                    ballInfo: buildBallInfo(
                      note,
                      prev.isWide,
                      prev.isNoBall,
                      prev.isLegBye
                    ),
                  }));
                }}
                placeholder="Ball Info"
                className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Runs</label>
              <input
                type="number"
                min={0}
                value={formData.runsScored}
                onChange={(e) =>
                  setFormData({ ...formData, runsScored: Number(e.target.value) || 0 })
                }
                placeholder="Batsman runs"
                className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Extras</label>
              <input
                type="number"
                min={0}
                value={formData.extraRuns}
                onChange={(e) =>
                  setFormData({ ...formData, extraRuns: Number(e.target.value) || 0 })
                }
                placeholder="Extra runs"
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
            {[...filteredEvents].reverse().map((event) => (
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
                {(event.ballInfo ||
                  eventRunningTotals.get(event.id) !== undefined ||
                  event.eventOccurred === 1 ||
                  event.hasComment === 1) && (
                  <div className="mt-2 pt-2 border-t border-gray-300 space-y-1">
                    {event.ballInfo && (
                      <p className="text-xs text-gray-700">
                        <span className="font-semibold">BI:</span> {event.ballInfo}
                      </p>
                    )}
                    {eventRunningTotals.get(event.id) !== undefined && (
                      <p className="text-xs text-gray-700">
                        <span className="font-semibold">Score:</span>{' '}
                        {eventRunningTotals.get(event.id)}
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
