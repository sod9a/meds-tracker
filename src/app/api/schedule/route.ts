import { NextResponse } from 'next/server';
import { getTodaySchedule } from '@/lib/meds-service';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || undefined;
    const schedule = getTodaySchedule('default-user', date);
    return NextResponse.json({ success: true, schedule });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
