import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const result = await db.query(
      'SELECT * FROM players WHERE "teamId" = $1 ORDER BY name',
      [id]
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name, playerType } = await request.json();

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Player name is required' }, { status: 400 });
    }

    const db = getDb();
    const result = await db.query(
      'INSERT INTO players ("teamId", name, "playerType") VALUES ($1, $2, $3) RETURNING id, "teamId", name, "playerType"',
      [id, name, playerType || 'all rounder']
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Player already exists in this team' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Failed to add player' }, { status: 500 });
  }
}
