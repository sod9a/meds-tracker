import { NextResponse } from 'next/server';
import { logMedicationDose, getHistoryLogs } from '@/lib/meds-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const logs = getHistoryLogs('default-user', 14);
    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { medication_id, status, date } = body;

    if (!medication_id || !status) {
      return NextResponse.json({ success: false, error: 'medication_id and status are required' }, { status: 400 });
    }

    const log = logMedicationDose(medication_id, 'default-user', status, date);
    return NextResponse.json({ success: true, log });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
