import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    const result = await db.query('SELECT * FROM teams ORDER BY name');
    return NextResponse.json(result.rows);
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
