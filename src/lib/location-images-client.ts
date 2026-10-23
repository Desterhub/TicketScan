import { TransportMode } from '@/types/database';

/**
 * Curated high-resolution static images stored in /public/images/
 */
export const HERO_IMAGES: Record<TransportMode, string> = {
  flight: '/images/heroes/flight.jpg',
  train: '/images/heroes/train.jpg',
  bus: '/images/heroes/bus.jpg',
  unknown: '/images/heroes/flight.jpg',
};

/**
 * Pre-seeded stock registry of curated Indian hubs matching target mockups and major destinations.
 */
export const CURATED_LOCATION_REGISTRY: Record<
  string,
  { displayName: string; imagePath: string; prompt: string }
> = {
  // Target Mockup 4: Train route Bandra Terminus -> Surat
  'bandra-terminus': {
    displayName: 'Bandra Terminus (BDTS)',
    imagePath: '/images/locations/bandra-terminus.jpg',
    prompt:
      'A realistic photograph of Bandra Terminus railway station in India at dusk/dawn, showing the station signage/platform, warm ambient lighting, travel-photography style, no readable text beyond the station name sign, no close-up faces.',
  },
  'surat': {
    displayName: 'Surat (ST)',
    imagePath: '/images/locations/surat.jpg',
    prompt:
      'A realistic photograph of Surat railway station in India at dusk/dawn, showing the station signage/platform, warm ambient lighting, travel-photography style, no readable text beyond the station name sign, no close-up faces.',
  },
  // Target Mockup 3: Flight route Delhi -> Mumbai
  'delhi': {
    displayName: 'Delhi (DEL)',
    imagePath: '/images/locations/delhi.jpg',
    prompt:
      'A beautiful, warm golden-hour photograph representing Delhi, India — featuring a well-known landmark or skyline view of the city, cinematic lighting, travel-photography style, no text or watermarks, no people in close-up, wide atmospheric shot.',
  },
  'mumbai': {
    displayName: 'Mumbai (BOM)',
    imagePath: '/images/locations/mumbai.jpg',
    prompt:
      'A beautiful, warm golden-hour photograph representing Mumbai, India — featuring a well-known landmark or skyline view of the city, cinematic lighting, travel-photography style, no text or watermarks, no people in close-up, wide atmospheric shot.',
  },
  'bengaluru': {
    displayName: 'Bengaluru (BLR)',
    imagePath: '/images/locations/bengaluru.jpg',
    prompt:
      'A beautiful, warm golden-hour photograph representing Bengaluru, India — featuring Vidhana Soudha, cinematic lighting, travel-photography style, no text or watermarks, wide atmospheric shot.',
  },
  'bangalore': {
    displayName: 'Bangalore (BLR)',
    imagePath: '/images/locations/bengaluru.jpg',
    prompt:
      'A beautiful, warm golden-hour photograph representing Bengaluru, India — featuring Vidhana Soudha, cinematic lighting, travel-photography style, no text or watermarks, wide atmospheric shot.',
  },
  'hyderabad': {
    displayName: 'Hyderabad (HYD)',
    imagePath: '/images/locations/hyderabad.jpg',
    prompt:
      'A beautiful, warm golden-hour photograph representing Hyderabad, India — featuring Charminar at twilight, cinematic warm lighting, travel-photography style, wide atmospheric shot.',
  },
  'goa': {
    displayName: 'Goa (GOI)',
    imagePath: '/images/locations/goa.jpg',
    prompt:
      'A beautiful, warm golden-hour photograph representing Goa, India — featuring palm-fringed tropical beach coastline at sunset, cinematic lighting, travel-photography style, wide atmospheric shot.',
  },
  'pune': {
    displayName: 'Pune (PNQ)',
    imagePath: '/images/locations/pune.jpg',
    prompt:
      'A beautiful, warm golden-hour photograph representing Pune, India — featuring historical stone architecture at sunset, travel-photography style, atmospheric wide shot.',
  },
  'default': {
    displayName: 'Travel Destination',
    imagePath: '/images/locations/default.jpg',
    prompt:
      'A beautiful, warm golden-hour travel photograph of scenic Indian travel landscape with distant misty hills, sunset glow, cinematic lighting, travel-photography style, wide atmospheric shot.',
  },
};

/**
 * Code / Alias mappings to canonical location keys
 */
const CODE_TO_KEY: Record<string, string> = {
  // Airport IATA
  del: 'delhi',
  bom: 'mumbai',
  blr: 'bengaluru',
  hyd: 'hyderabad',
  goi: 'goa',
  gox: 'goa',
  pnq: 'pune',
  maa: 'chennai',
  ccu: 'kolkata',
  amd: 'ahmedabad',
  jmr: 'jamnagar',

  // Train Station codes
  bdts: 'bandra-terminus',
  st: 'surat',
  ndls: 'delhi',
  dli: 'delhi',
  nzm: 'delhi',
  bct: 'mumbai',
  mmct: 'mumbai',
  csmt: 'mumbai',
  cstm: 'mumbai',
  sbk: 'bengaluru',
  sbc: 'bengaluru',
  ksr: 'bengaluru',
  hyb: 'hyderabad',
  sec: 'hyderabad',
};

/**
 * Normalization function
 * Station-level specificity for trains (e.g. "Bandra Terminus (BDTS)" -> "bandra-terminus")
 * City-level for flight and bus (e.g. "Delhi (DEL)" -> "delhi")
 */
export function normalizeLocationKey(
  locationStr: string | null | undefined,
  mode: TransportMode = 'unknown'
): { locationKey: string; displayName: string } {
  if (!locationStr || !locationStr.trim()) {
    return { locationKey: 'default', displayName: 'Location TBD' };
  }

  const raw = locationStr.trim();
  const cleaned = raw.replace(/\s+/g, ' ');

  // 1. Look for station / airport code inside parentheses, e.g. "Bandra Terminus (BDTS)", "Delhi (DEL)"
  const codeMatch = cleaned.match(/\(([A-Za-z0-9]{2,5})\)/);
  const extractedCode = codeMatch ? codeMatch[1].toLowerCase() : '';

  if (extractedCode && CODE_TO_KEY[extractedCode]) {
    const canonicalKey = CODE_TO_KEY[extractedCode];
    if (mode === 'train' && (extractedCode === 'bdts' || extractedCode === 'st')) {
      return {
        locationKey: canonicalKey,
        displayName: cleaned,
      };
    }
    return {
      locationKey: canonicalKey,
      displayName: cleaned,
    };
  }

  // 2. Extract base name without parentheses or common suffixes
  let baseName = cleaned.replace(/\s*\([^)]*\)/g, '').trim();

  // Strip airport or bus terminal suffixes
  if (mode === 'flight' || mode === 'bus') {
    baseName = baseName
      .replace(
        /\s*(international|domestic)?\s*(airport|aerodrome|terminal\s*\d*|t\d+|air\s*port|isbt|bus\s*stand|bus\s*terminal)\s*$/i,
        ''
      )
      .trim();
  }

  // Generate slug
  let slug = baseName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

  // Handle train station suffixes if matching station-level specificity
  if (mode === 'train') {
    if (slug.includes('bandra')) {
      slug = 'bandra-terminus';
    } else if (slug.includes('surat')) {
      slug = 'surat';
    } else if (slug.includes('mumbai') || slug.includes('bombay') || slug.includes('csmt')) {
      slug = 'mumbai';
    } else if (slug.includes('delhi')) {
      slug = 'delhi';
    }
  } else {
    // Flight or bus - city level
    if (slug.includes('delhi')) slug = 'delhi';
    else if (slug.includes('mumbai') || slug.includes('bombay')) slug = 'mumbai';
    else if (slug.includes('bengaluru') || slug.includes('bangalore')) slug = 'bengaluru';
    else if (slug.includes('hyderabad')) slug = 'hyderabad';
    else if (slug.includes('goa')) slug = 'goa';
    else if (slug.includes('pune')) slug = 'pune';
    else if (slug.includes('surat')) slug = 'surat';
  }

  return {
    locationKey: slug || 'default',
    displayName: cleaned,
  };
}

/**
 * Builds standard generation prompt according to the specification
 */
export function buildLocationPrompt(displayName: string, mode: TransportMode): string {
  if (mode === 'train') {
    return `A realistic photograph of ${displayName} railway station in India at dusk/dawn, showing the station signage/platform, warm ambient lighting, travel-photography style, no readable text beyond the station name sign, no close-up faces.`;
  }
  return `A beautiful, warm golden-hour photograph representing ${displayName}, India — featuring a well-known landmark or skyline view of the city, cinematic lighting, travel-photography style, no text or watermarks, no people in close-up, wide atmospheric shot.`;
}
