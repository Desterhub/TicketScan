import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { analyzeTamperSignals } from '@/lib/tamper-detection';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No ticket file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    const mimeType = file.type || 'application/octet-stream';

    const result = await analyzeTamperSignals({
      fileBuffer,
      mimeType,
      fileName: file.name,
    });

    return NextResponse.json({
      success: true,
      tamperRiskScore: result.tamperRiskScore,
      signals: result.signals,
      summary: result.summary,
      elaDetails: result.elaDetails,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Tamper analysis failed' }, { status: 500 });
  }
}
