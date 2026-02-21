import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const championships = db
      .prepare('SELECT * FROM championships ORDER BY name')
      .all();
    return NextResponse.json(championships);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch championships' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Championship name is required' }, { status: 400 });
    }

    const db = getDb();
    const result = db
      .prepare('INSERT INTO championships (name) VALUES (?)')
      .run(name);

    return NextResponse.json(
      { id: result.lastInsertRowid, name },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message.includes('UNIQUE')) {
      return NextResponse.json(
        { error: 'Championship already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Failed to add championship' }, { status: 500 });
  }
}
