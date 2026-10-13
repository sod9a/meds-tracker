import { NextResponse } from 'next/server';
import { refillMedication } from '@/lib/meds-service';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const amount = Number(body.amount) || 30;

    const newStock = refillMedication(id, amount);
    return NextResponse.json({ success: true, stock_quantity: newStock });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
