import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    const teams = db.prepare('SELECT * FROM teams ORDER BY name').all();
    return NextResponse.json(teams);
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
    const result = db.prepare('INSERT INTO teams (name) VALUES (?)').run(name);

    return NextResponse.json(
      { id: result.lastInsertRowid, name },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message.includes('UNIQUE')) {
      return NextResponse.json({ error: 'Team already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 });
  }
}
