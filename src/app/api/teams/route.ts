import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const all = searchParams.get('all');

    const db = getDb();

    // Simple mode: return all teams as a flat array (used for dropdowns/multi-select)
    if (all && all.toLowerCase() === 'true') {
      const result = await db.query('SELECT id, name FROM teams ORDER BY name');
      return NextResponse.json(result.rows);
    }

    // Paginated mode
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');

    const page = Math.max(parseInt(pageParam || '1', 10) || 1, 1);
    const limitRaw = parseInt(limitParam || '10', 10) || 10;
    const limit = Math.min(Math.max(limitRaw, 1), 100);
    const offset = (page - 1) * limit;

    const [itemsResult, totalResult] = await Promise.all([
      db.query('SELECT id, name FROM teams ORDER BY name LIMIT $1 OFFSET $2', [
        limit,
        offset,
      ]),
      db.query('SELECT COUNT(*)::int AS total FROM teams'),
    ]);

    const total = totalResult.rows[0]?.total ?? 0;
    const totalPages = total === 0 ? 1 : Math.ceil(total / limit);

    return NextResponse.json({
      teams: itemsResult.rows,
      page,
      limit,
      total,
      totalPages,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Team name is required' }, { status: 400 });
    }

    const db = getDb();
    const result = await db.query(
      'INSERT INTO teams (name) VALUES ($1) RETURNING id, name',
      [name]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Team already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 });
  }
}
