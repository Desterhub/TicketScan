import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { extractTicketData } from '@/lib/ai-extraction';

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

    const result = await extractTicketData({
      fileBuffer,
      mimeType,
      fileName: file.name,
    });

    return NextResponse.json({
      success: true,
      extractedData: result.data,
      rawResponse: result.rawResponse,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Extraction failed' }, { status: 500 });
  }
}
