import { NextResponse } from 'next/server';
import { getDefaultUser, setAppSetting, unlinkTelegram } from '@/lib/meds-service';
import { getBotInfo, getBotToken, pollTelegramUpdates, setTelegramWebhook } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const token = getBotToken();
    let botInfo: { ok: boolean; username?: string; first_name?: string; error?: string } = {
      ok: false,
      username: undefined,
      error: 'No token set',
    };

    if (token) {
      const host = req.headers.get('host');
      if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
        // In production cloud (Vercel), ensure Telegram webhook is registered
        await setTelegramWebhook(`https://${host}/api/bot`);
      } else {
        // In local dev, sync any pending Telegram updates
        await pollTelegramUpdates();
      }
      botInfo = await getBotInfo();
    }

    const user = getDefaultUser();

    return NextResponse.json({
      success: true,
      has_token: !!token,
      bot_username: botInfo.username,
      bot_connected: botInfo.ok,
      user_linked: !!user.telegram_chat_id,
      user_chat_id: user.telegram_chat_id,
      telegram_username: user.telegram_username,
      link_code: user.telegram_link_code,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.action === 'unlink') {
      unlinkTelegram('default-user');
      return NextResponse.json({ success: true, message: 'Unlinked Telegram' });
    }

    if (body.bot_token !== undefined) {
      setAppSetting('TELEGRAM_BOT_TOKEN', body.bot_token.trim());
      const botInfo = await getBotInfo();
      return NextResponse.json({
        success: true,
        bot_connected: botInfo.ok,
        bot_username: botInfo.username,
        error: botInfo.error,
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
