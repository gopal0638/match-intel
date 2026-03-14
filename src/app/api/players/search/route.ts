import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

/**
 * Player Search API: Search players by name with autocomplete support
 * GET /api/players/search?query=mic
 * Returns matching players sorted alphabetically
 */
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const query = (params.get('query') || '').trim();

    if (!query || query.length === 0) {
      return NextResponse.json({ players: [] });
    }

    const db = getDb();

    // Search players by name (case-insensitive, prefix match)
    // Using ILIKE for case-insensitive comparison in PostgreSQL
    const result = await db.query(
      `SELECT id, name
       FROM players
       WHERE name ILIKE $1
       ORDER BY name ASC
       LIMIT 20`,
      [`${query}%`]
    );

    const players = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
    }));

    return NextResponse.json({ players });
  } catch (error: any) {
    console.error('Error searching players:', error);
    return NextResponse.json(
      { error: 'Failed to search players', players: [] },
      { status: 500 }
    );
  }
}
