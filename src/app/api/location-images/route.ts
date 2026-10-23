import { NextRequest, NextResponse } from 'next/server';
import { getOrResolveLocationImage, HERO_IMAGES } from '@/lib/location-images';
import { TransportMode } from '@/types/database';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');
    const location = searchParams.get('location');
    const mode = (searchParams.get('mode') as TransportMode) || 'unknown';

    if (location) {
      const img = await getOrResolveLocationImage(location, mode);
      return NextResponse.json({
        success: true,
        image: img,
        hero: HERO_IMAGES[mode] || HERO_IMAGES.flight,
      });
    }

    const [originImg, destImg] = await Promise.all([
      origin ? getOrResolveLocationImage(origin, mode) : null,
      destination ? getOrResolveLocationImage(destination, mode) : null,
    ]);

    return NextResponse.json({
      success: true,
      origin: originImg,
      destination: destImg,
      hero: HERO_IMAGES[mode] || HERO_IMAGES.flight,
    });
  } catch (error: any) {
    console.error('Error fetching location images:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to resolve location images' },
      { status: 500 }
    );
  }
}
