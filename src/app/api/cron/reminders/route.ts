import { NextResponse } from 'next/server';
import { getDefaultUser, getTodaySchedule } from '@/lib/meds-service';
import { sendMedReminder } from '@/lib/telegram';

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

    const sentReminders: string[] = [];

    for (const item of schedule) {
      let shouldRemind = force;

      if (!shouldRemind) {
        const [itemH, itemM] = item.time.split(':').map(Number);
        const itemTotalMinutes = itemH * 60 + itemM;
        const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

        const diff = currentTotalMinutes - itemTotalMinutes;
        if (diff >= 0 && diff <= 5) {
          shouldRemind = true;
        }
      }

      if (shouldRemind && item.status !== 'taken') {
        await sendMedReminder(user.telegram_chat_id, item.medication);
        sentReminders.push(item.medication.name);
      }
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
