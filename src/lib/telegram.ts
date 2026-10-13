import { getAppSetting, getDefaultUser, linkTelegramUser, logMedicationDose, getAllMedications } from './meds-service';
import { Medication } from './types';

export function getBotToken(): string | null {
  return process.env.TELEGRAM_BOT_TOKEN || getAppSetting('TELEGRAM_BOT_TOKEN') || null;
}

export async function getBotInfo(): Promise<{ ok: boolean; username?: string; first_name?: string; error?: string }> {
  const token = getBotToken();
  if (!token) {
    return { ok: false, error: 'Bot token is not configured.' };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const data = await res.json();
    if (data.ok) {
      return { ok: true, username: data.result.username, first_name: data.result.first_name };
    }
    return { ok: false, error: data.description || 'Invalid Telegram Bot Token' };
  } catch (err: any) {
    return { ok: false, error: err.message || 'Failed to reach Telegram API' };
  }
}

export async function sendTelegramMessage(chatId: string, text: string, replyMarkup?: any) {
  const token = getBotToken();
  if (!token) throw new Error('Telegram bot token is not set');

  const body: any = {
    chat_id: chatId,
    text,
    parse_mode: 'Markdown',
  };

  if (replyMarkup) {
    body.reply_markup = replyMarkup;
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  return await res.json();
}

export async function sendMedReminder(chatId: string, med: Medication) {
  const text = `💊 *Medication Reminder*\n\nTime to take *${med.name}*\n• Dosage: \`${med.dosage}\`${
    med.instructions ? `\n• Notes: _${med.instructions}_` : ''
  }\n• Scheduled for: *${med.scheduled_time}*`;

  const replyMarkup = {
    inline_keyboard: [
      [
        { text: '✅ Mark as Taken', callback_data: `take_${med.id}` },
        { text: '⏭️ Skip', callback_data: `skip_${med.id}` },
      ],
    ],
  };

  return await sendTelegramMessage(chatId, text, replyMarkup);
}

export async function handleTelegramUpdate(update: any) {
  const token = getBotToken();
  if (!token) return { ok: false, message: 'No token' };

  // 1. Handle /start command
  if (update.message && update.message.text) {
    const chatId = String(update.message.chat.id);
    const text = update.message.text.trim();
    const username = update.message.chat.username || update.message.chat.first_name || '';

    if (text.startsWith('/start')) {
      const parts = text.split(' ');
      const code = parts[1];

      if (code) {
        const linked = linkTelegramUser(code, chatId, username);
        if (linked) {
          await sendTelegramMessage(
            chatId,
            `🎉 *Successfully Connected!*\n\nYour Telegram is now linked to your *Med Tracker* account. You will automatically receive reminders when it's time for your medication!`
          );
          return { ok: true, action: 'linked' };
        } else {
          await sendTelegramMessage(
            chatId,
            `⚠️ *Invalid Link Code*\n\nThe code \`${code}\` was not found. Please check your web dashboard settings and try again.`
          );
          return { ok: true, action: 'invalid_code' };
        }
      } else {
        const defaultUser = getDefaultUser();
        await sendTelegramMessage(
          chatId,
          `👋 *Welcome to Meds Tracker Bot!*\n\nTo link your account, use the link button on your web dashboard or send:\n\`/start ${defaultUser.telegram_link_code}\``
        );
        return { ok: true, action: 'welcome' };
      }
    }
  }

  // 2. Handle button clicks (Callback Queries)
  if (update.callback_query) {
    const query = update.callback_query;
    const data = query.data || '';
    const chatId = String(query.message.chat.id);
    const messageId = query.message.message_id;

    if (data.startsWith('take_')) {
      const medId = data.replace('take_', '');
      const meds = getAllMedications();
      const med = meds.find((m) => m.id === medId);
      const medName = med ? med.name : 'Medication';

      logMedicationDose(medId, 'default-user', 'taken');

      // Answer callback query toast
      await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: query.id,
          text: `Great job! Logged ${medName} as taken ✅`,
        }),
      });

      // Edit message to reflect taken state
      const nowStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          text: `✅ *Completed!*\n\n*${medName}* was marked as *Taken* at *${nowStr}*. Great job staying on track!`,
          parse_mode: 'Markdown',
        }),
      });

      return { ok: true, action: 'taken' };
    }

    if (data.startsWith('skip_')) {
      const medId = data.replace('skip_', '');
      const meds = getAllMedications();
      const med = meds.find((m) => m.id === medId);
      const medName = med ? med.name : 'Medication';

      logMedicationDose(medId, 'default-user', 'skipped');

      await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: query.id,
          text: `Marked ${medName} as skipped`,
        }),
      });

      await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          text: `⏭️ *Skipped*\n\n*${medName}* was marked as *Skipped* for today.`,
          parse_mode: 'Markdown',
        }),
      });

      return { ok: true, action: 'skipped' };
    }
  }

  return { ok: true, action: 'ignored' };
}
