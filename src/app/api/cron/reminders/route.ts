import { NextResponse } from 'next/server';
import { getDefaultUser, getTodaySchedule, getDueSnoozes, getMedicationById, clearSnooze } from '@/lib/meds-service';
import { sendMedReminder } from '@/lib/telegram';
import { getDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const force = searchParams.get('force') === 'true';

    const user = getDefaultUser();
    if (!user.telegram_chat_id) {
      return NextResponse.json({
        success: false,
        message: 'No user with linked Telegram chat ID found',
      });
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const schedule = getTodaySchedule(user.id, todayStr);

    const now = new Date();
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHours}:${currentMinutes}`;

    const db = getDatabase();
    const sentReminders: string[] = [];

    // 1. Check standard scheduled doses
    for (const item of schedule) {
      let shouldRemind = force;

      if (!shouldRemind) {
        const [itemH, itemM] = item.time.split(':').map(Number);
        const itemTotalMinutes = itemH * 60 + itemM;
        const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

        const diff = currentTotalMinutes - itemTotalMinutes;
        // Remind if within 5 minutes of scheduled time
        if (diff >= 0 && diff <= 5) {
          shouldRemind = true;
        }
      }

      // Check if already reminded today for this medicine
      const alreadyReminded = db.prepare(`
        SELECT sent_at FROM reminder_logs 
        WHERE medication_id = ? AND scheduled_date = ?
      `).get(item.medication.id, todayStr);

      if ((shouldRemind && !alreadyReminded && item.status !== 'taken') || (force && item.status !== 'taken')) {
        await sendMedReminder(user.telegram_chat_id, item.medication);

        // Record reminder so we don't send multiple times
        db.prepare(`
          INSERT INTO reminder_logs (medication_id, scheduled_date, sent_at)
          VALUES (?, ?, ?)
          ON CONFLICT(medication_id, scheduled_date) DO UPDATE SET sent_at = excluded.sent_at
        `).run(item.medication.id, todayStr, now.toISOString());

        sentReminders.push(item.medication.name);
      }
    }

    // 2. Check due snoozes
    const dueSnoozes = getDueSnoozes();
    for (const snooze of dueSnoozes) {
      const med = getMedicationById(snooze.medication_id);
      if (med && med.active) {
        // Send follow-up reminder
        await sendMedReminder(user.telegram_chat_id, med, true);
        sentReminders.push(`${med.name} (Snooze)`);
      }
      clearSnooze(snooze.id);
    }

    return NextResponse.json({
      success: true,
      timestamp: currentTimeStr,
      reminders_sent: sentReminders.length,
      medications: sentReminders,
    });
  } catch (error: any) {
    console.error('Cron reminder error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
