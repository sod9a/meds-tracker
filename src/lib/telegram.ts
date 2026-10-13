import {
  getAppSetting,
  getDefaultUser,
  linkTelegramUser,
  logMedicationDose,
  getAllMedications,
  createSnooze,
  getMedicationById,
  getTodaySchedule,
} from './meds-service';
import { Medication } from './types';

let lastUpdateOffset = 0;

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

export async function setTelegramWebhook(webhookUrl: string): Promise<boolean> {
  const token = getBotToken();
  if (!token) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`);
    const data = await res.json();
    return Boolean(data.ok);
  } catch {
    return false;
  }
}

export async function sendTelegramMessage(chatId: string, text: string, replyMarkup?: any) {
  const token = getBotToken();
  if (!token) throw new Error('Telegram bot token is not set');

  const body: any = {
    chat_id: chatId,
    text,
    parse_mode: 'Markdown',
    disable_notification: false,
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

export async function sendMedReminder(chatId: string, med: Medication, isSnooze: boolean = false) {
  let text = isSnooze
    ? `⏰ *Snooze Follow-Up Reminder*\n\nTime to take *${med.name}*\n• Dosage: \`${med.dosage}\``
    : `💊 *Medication Reminder*\n\nTime to take *${med.name}*\n• Dosage: \`${med.dosage}\``;

  if (med.instructions) {
    text += `\n• Notes: _${med.instructions}_`;
  }
  text += `\n• Scheduled for: *${med.scheduled_time}*`;

  if (med.track_stock === 1) {
    text += `\n• 📦 In stock: *${med.stock_quantity} remaining*`;
    if (med.stock_quantity <= med.refill_threshold) {
      text += ` _(Low stock!)_`;
    }
  }

  const replyMarkup = {
    inline_keyboard: [
      [
        { text: '✅ Mark as Taken', callback_data: `take_${med.id}` },
        { text: '💤 Snooze 15m', callback_data: `snooze_${med.id}_15` },
      ],
      [{ text: '⏭️ Skip', callback_data: `skip_${med.id}` }],
    ],
  };

  return await sendTelegramMessage(chatId, text, replyMarkup);
}

export async function handleTelegramUpdate(update: any) {
  const token = getBotToken();
  if (!token) return { ok: false, message: 'No token' };

  // 1. Handle commands (/start, /today, /stock)
  if (update.message && update.message.text) {
    const chatId = String(update.message.chat.id);
    const text = update.message.text.trim();
    const username = update.message.chat.username || update.message.chat.first_name || '';

    if (text.startsWith('/start')) {
      const parts = text.split(/\s+/);
      const code = parts[1];

      if (code) {
        const linked = linkTelegramUser(code, chatId, username);
        if (linked) {
          await sendTelegramMessage(
            chatId,
            `🎉 *Successfully Connected!*\n\nYour Telegram is now linked to your *Med Tracker* account. You will automatically receive reminders when it's time for your medication!\n\nCommands you can use:\n• /today - View today's schedule\n• /stock - View current pill stock`
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

    if (text === '/today') {
      const schedule = getTodaySchedule('default-user');
      if (schedule.length === 0) {
        await sendTelegramMessage(chatId, `📅 No medications scheduled for today.`);
      } else {
        let report = `📅 *Today's Medication Schedule*\n\n`;
        for (const item of schedule) {
          const statusIcon = item.status === 'taken' ? '✅' : item.status === 'skipped' ? '⏭️' : '⏳';
          report += `${statusIcon} *${item.medication.name}* (${item.medication.dosage})\n   ⏰ ${item.time} — *${item.status.toUpperCase()}*\n`;
        }
        await sendTelegramMessage(chatId, report);
      }
      return { ok: true, action: 'today_report' };
    }

    if (text === '/stock') {
      const meds = getAllMedications('default-user');
      let report = `📦 *Medicine Cabinet Inventory*\n\n`;
      for (const m of meds) {
        if (m.track_stock === 1) {
          const warning = m.stock_quantity <= m.refill_threshold ? ' ⚠️ Low stock!' : '';
          report += `• *${m.name}*: ${m.stock_quantity} left${warning}\n`;
        } else {
          report += `• *${m.name}*: (Inventory tracking disabled)\n`;
        }
      }
      await sendTelegramMessage(chatId, report);
      return { ok: true, action: 'stock_report' };
    }
  }

  // 2. Handle button clicks (Callback Queries)
  if (update.callback_query) {
    const query = update.callback_query;
    const data = query.data || '';
    const chatId = String(query.message.chat.id);
    const messageId = query.message.message_id;

    // A. Take dose
    if (data.startsWith('take_')) {
      const medId = data.replace('take_', '');
      const med = getMedicationById(medId);
      const medName = med ? med.name : 'Medication';

      const { remainingStock, lowStockWarning } = logMedicationDose(medId, 'default-user', 'taken');

      // Answer callback query toast
      await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: query.id,
          text: `Great job! Logged ${medName} as taken ✅`,
        }),
      });

      // Edit message to reflect taken state & stock
      const nowStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      let messageText = `✅ *Completed!*\n\n*${medName}* was marked as *Taken* at *${nowStr}*. Great job staying on track!`;

      if (remainingStock !== undefined) {
        messageText += `\n📦 *Remaining stock*: ${remainingStock} pills left`;
      }
      if (lowStockWarning) {
        messageText += `\n\n⚠️ *Low Stock Warning!* You only have *${remainingStock}* remaining. Please refill soon!`;
      }

      await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          text: messageText,
          parse_mode: 'Markdown',
        }),
      });

      return { ok: true, action: 'taken' };
    }

    // B. Snooze reminder (e.g. snooze_med-1_15)
    if (data.startsWith('snooze_')) {
      const parts = data.split('_');
      const medId = parts[1];
      const mins = Number(parts[2]) || 15;

      const med = getMedicationById(medId);
      const medName = med ? med.name : 'Medication';

      const snoozeUntil = createSnooze(medId, mins, 'default-user');
      const targetTimeStr = new Date(snoozeUntil).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });

      await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: query.id,
          text: `Snoozed for ${mins} minutes! Reminder set for ${targetTimeStr} 💤`,
        }),
      });

      await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          text: `💤 *Snoozed for ${mins} minutes*\n\nReminder for *${medName}* will alert you again at *${targetTimeStr}*.`,
          parse_mode: 'Markdown',
        }),
      });

      return { ok: true, action: 'snoozed' };
    }

    // C. Skip dose
    if (data.startsWith('skip_')) {
      const medId = data.replace('skip_', '');
      const med = getMedicationById(medId);
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

// Automatically pulls pending updates when running on localhost
export async function pollTelegramUpdates() {
  const token = getBotToken();
  if (!token) return [];

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=${lastUpdateOffset + 1}&timeout=0`);
    const data = await res.json();
    if (data.ok && Array.isArray(data.result)) {
      for (const update of data.result) {
        lastUpdateOffset = Math.max(lastUpdateOffset, update.update_id);
        await handleTelegramUpdate(update);
      }
      return data.result;
    }
  } catch (err) {
    console.error('Error polling Telegram updates:', err);
  }
  return [];
}
