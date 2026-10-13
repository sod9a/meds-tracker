import { NextResponse } from 'next/server';
import { getDefaultUser, getAllMedications } from '@/lib/meds-service';
import { sendMedReminder, sendTelegramMessage } from '@/lib/telegram';

export async function POST() {
  try {
    const user = getDefaultUser();
    if (!user.telegram_chat_id) {
      return NextResponse.json({
        success: false,
        error: 'Telegram is not linked yet. Please link your Telegram account first using the code or bot link.',
      }, { status: 400 });
    }

    const meds = getAllMedications();
    if (meds.length === 0) {
      await sendTelegramMessage(
        user.telegram_chat_id,
        '🔔 *Test Notification!*\n\nYour Telegram connection with Meds Tracker is working perfectly! You currently have no medications listed.'
      );
    } else {
      // Pick first active med as sample
      const sampleMed = meds[0];
      await sendMedReminder(user.telegram_chat_id, sampleMed);
    }

    return NextResponse.json({
      success: true,
      message: 'Test reminder sent to your Telegram chat!',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
