import { NextRequest, NextResponse } from 'next/server';
import { evaluateGeofenceRadius } from '@/lib/tixsurance';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { address, venueCity } = body;
    const result = evaluateGeofenceRadius(address || {}, venueCity);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Geofence evaluation failed' }, { status: 500 });
  }
}
