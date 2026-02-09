import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    ok: true,
    data: {
      version: '1.0.0',
      time: new Date().toISOString(),
      status: 'healthy',
    },
  });
}
