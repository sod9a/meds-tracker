import { NextResponse } from 'next/server';
import { handleTelegramUpdate } from '@/lib/telegram';

export async function POST(req: Request) {
  try {
    const update = await req.json();
    const result = await handleTelegramUpdate(update);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error handling Telegram update:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

// Telegram can also send GET requests to verify webhook reachability
export async function GET() {
  return NextResponse.json({ status: 'Telegram Webhook Endpoint is running' });
}
