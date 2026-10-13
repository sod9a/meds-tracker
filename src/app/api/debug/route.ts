import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  return NextResponse.json({
    has_token: !!token,
    token_len: token ? token.length : 0,
    has_chat_id: !!chatId,
    chat_id_preview: chatId ? `${chatId.slice(0, 3)}***` : null,
    telegram_env_keys: Object.keys(process.env).filter((k) => k.toUpperCase().includes('TELEGRAM')),
    vercel_env: process.env.VERCEL_ENV || 'local',
  });
}
