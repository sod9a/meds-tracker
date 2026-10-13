import { NextResponse } from 'next/server';
import { getAllMedications, addMedication } from '@/lib/meds-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const meds = getAllMedications();
    return NextResponse.json({ success: true, medications: meds });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.name || !body.dosage || !body.scheduled_time) {
      return NextResponse.json({ success: false, error: 'Name, dosage, and scheduled time are required' }, { status: 400 });
    }

    const created = addMedication({
      user_id: 'default-user',
      name: body.name,
      dosage: body.dosage,
      instructions: body.instructions || '',
      scheduled_time: body.scheduled_time,
      color: body.color || 'emerald',
      icon: body.icon || 'pill',
      active: body.active !== undefined ? (body.active ? 1 : 0) : 1,
      stock_quantity: Number(body.stock_quantity) || 30,
      refill_threshold: Number(body.refill_threshold) || 5,
      track_stock: Number(body.track_stock) || 0,
    });

    return NextResponse.json({ success: true, medication: created });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
