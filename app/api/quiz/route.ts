import { NextResponse } from 'next/server';
import { client } from '@/lib/microcms';

export async function GET() {
  try {
    const response = await client.get({
      endpoint: 'questions',
      queries: {
        timestamp: new Date().getTime(), // Cache-busting query parameter
      },
    });

    return NextResponse.json(response.contents);
  } catch (error) {
    console.error('Error fetching quiz data:', error);
    return NextResponse.json({ error: 'Failed to fetch quiz data' }, { status: 500 });
  }
}