import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filePath = searchParams.get('path');
    if (!filePath) {
      return NextResponse.json({ error: 'Missing path' }, { status: 400 });
    }

    const cleanPath = filePath.replace(/^local:\/\//, '');
    const userFolder = cleanPath.split('/')[0];

    // Check ownership unless admin
    if (userFolder !== session.userId && session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const localVaultDir = path.join(process.cwd(), 'public', 'vault');
    const fullPath = path.join(localVaultDir, cleanPath);

    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const buffer = fs.readFileSync(fullPath);
    const mime = fullPath.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': mime,
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error reading file' }, { status: 500 });
  }
}
