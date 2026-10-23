import { TransportMode, LocationImage } from '@/types/database';
import { getServiceRoleClient, isSupabaseConfigured } from '@/lib/db';
import { localDb } from '@/lib/local-store';

export * from '@/lib/location-images-client';
import {
  CURATED_LOCATION_REGISTRY,
  normalizeLocationKey,
  buildLocationPrompt,
} from '@/lib/location-images-client';

/**
 * In-memory fast cache to ensure zero latency and strict cache consistency
 */
const memoryCache = new Map<string, LocationImage>();

/**
 * Retrieves cached location image from memory, database (Supabase/localDb), or curated stock.
 * Guarantees that the same location always returns the same image!
 */
export async function getOrResolveLocationImage(
  locationStr: string | null | undefined,
  mode: TransportMode = 'unknown'
): Promise<LocationImage> {
  const { locationKey, displayName } = normalizeLocationKey(locationStr, mode);

  // 1. Check in-memory cache
  if (memoryCache.has(locationKey)) {
    return memoryCache.get(locationKey)!;
  }

  // 2. Check Supabase (if configured)
  if (isSupabaseConfigured()) {
    try {
      const supabase = getServiceRoleClient();
      const { data, error } = await supabase
        .from('location_images')
        .select('*')
        .eq('location_key', locationKey)
        .maybeSingle();

      if (!error && data) {
        const item: LocationImage = {
          id: data.id,
          location_key: data.location_key,
          display_name: data.display_name,
          image_path: data.image_path,
          generation_prompt: data.generation_prompt,
          source: data.source,
          created_at: data.created_at,
        };
        memoryCache.set(locationKey, item);
        return item;
      }
    } catch (err) {
      console.warn('Supabase location_images check error:', err);
    }
  }

  // 3. Check local database file
  try {
    const localImages = localDb.getLocationImages();
    const existing = localImages.find((img) => img.location_key === locationKey);
    if (existing) {
      memoryCache.set(locationKey, existing);
      return existing;
    }
  } catch {}

  // 4. Resolve from Curated Stock Registry or Default Fallback
  const stock = CURATED_LOCATION_REGISTRY[locationKey] || CURATED_LOCATION_REGISTRY['default'];
  const newPrompt = buildLocationPrompt(displayName, mode);

  const newLocationImage: LocationImage = {
    id: `loc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    location_key: locationKey,
    display_name: displayName,
    image_path: stock.imagePath,
    generation_prompt: stock.prompt || newPrompt,
    source: 'curated_stock',
    created_at: new Date().toISOString(),
  };

  // 5. Persist to cache and database so future tickets reuse this identical image
  memoryCache.set(locationKey, newLocationImage);

  try {
    // Persist locally
    const currentList = localDb.getLocationImages();
    if (!currentList.some((img) => img.location_key === locationKey)) {
      currentList.push(newLocationImage);
      localDb.saveLocationImages(currentList);
    }

    // Persist to Supabase if configured
    if (isSupabaseConfigured()) {
      const supabase = getServiceRoleClient();
      await supabase.from('location_images').upsert(
        {
          location_key: newLocationImage.location_key,
          display_name: newLocationImage.display_name,
          image_path: newLocationImage.image_path,
          generation_prompt: newLocationImage.generation_prompt,
          source: newLocationImage.source,
        },
        { onConflict: 'location_key' }
      );
    }
  } catch (err) {
    console.warn('Failed to persist location image record:', err);
  }

  return newLocationImage;
}
