import zlib from 'zlib';

/**
 * High-performance PDF text extractor with glyph-position aware CMap decoding.
 * Distinguishes intra-word kerning (small dx) from word boundaries (large dx / dy).
 */
export function extractTextFromPdf(pdfBuffer: Buffer): string {
  const str = pdfBuffer.toString('latin1');

  // 1. Map all font objects to their ToUnicode CMap object IDs
  const fontToCmap: Record<string, string> = {};
  const fontRegex = /(\d+)\s+0\s+obj[\s\S]*?\/ToUnicode\s+(\d+)\s+0\s+R[\s\S]*?endobj/g;
  let m: RegExpExecArray | null;
  while ((m = fontRegex.exec(str)) !== null) {
    fontToCmap[m[1]] = m[2];
  }

  // 2. Map font names (/F1, /F4, etc.) to CMap object IDs
  const fontObjRegex = /\/Font\s*<<([^>]*)>>/g;
  const pageFonts: Record<string, string> = {};
  while ((m = fontObjRegex.exec(str)) !== null) {
    const fontEntries = m[1].match(/\/([A-Za-z0-9]+)\s+(\d+)\s+0\s+R/g) || [];
    fontEntries.forEach((entry) => {
      const match = entry.match(/\/([A-Za-z0-9]+)\s+(\d+)\s+0\s+R/);
      if (match && fontToCmap[match[2]]) {
        pageFonts[match[1]] = fontToCmap[match[2]];
      }
    });
  }

  // 3. Parse CMaps (bfchar & bfrange)
  const cmaps: Record<string, Record<number, string>> = {};
  for (const cmapObjId of Object.values(pageFonts)) {
    if (cmaps[cmapObjId]) continue;
    const objRegex = new RegExp(
      cmapObjId + '\\s+0\\s+obj[\\s\\S]*?stream\\r?\\n([\\s\\S]*?)\\r?\\nendstream'
    );
    const match = str.match(objRegex);
    if (!match) continue;

    let inflated = '';
    try {
      inflated = zlib.inflateSync(Buffer.from(match[1], 'latin1')).toString('utf-8');
    } catch {
      continue;
    }

    const map: Record<number, string> = {};
    // bfchar
    const charRegex = /<([0-9A-Fa-f]+)>\s+<([0-9A-Fa-f]+)>/g;
    let cm: RegExpExecArray | null;
    while ((cm = charRegex.exec(inflated)) !== null) {
      map[parseInt(cm[1], 16)] = String.fromCharCode(parseInt(cm[2], 16));
    }

    // bfrange
    const rangeRegex = /<([0-9A-Fa-f]+)>\s+<([0-9A-Fa-f]+)>\s+<([0-9A-Fa-f]+)>/g;
    while ((cm = rangeRegex.exec(inflated)) !== null) {
      const start = parseInt(cm[1], 16);
      const end = parseInt(cm[2], 16);
      let destStart = parseInt(cm[3], 16);
      for (let c = start; c <= end; c++) {
        map[c] = String.fromCharCode(destStart++);
      }
    }
    cmaps[cmapObjId] = map;
  }

  // 4. Decode content streams with position sensitivity
  const contentMatches = str.match(/stream\r?\n([\s\S]*?)\r?\nendstream/g) || [];
  let fullDecoded = '';

  for (const streamMatch of contentMatches) {
    const rawData = streamMatch.replace(/^stream\r?\n/, '').replace(/\r?\nendstream$/, '');
    let content = '';
    try {
      content = zlib.inflateSync(Buffer.from(rawData, 'latin1')).toString('latin1');
    } catch {
      continue;
    }

    if (!content.includes('Tj') && !content.includes('TJ')) continue;

    let currentFont = '';
    let curX = 0;
    let curY = 0;
    const lines = content.split('\n');

    for (const line of lines) {
      const fontMatch = line.match(/\/([A-Za-z0-9]+)\s+[\d\.]+\s+Tf/);
      if (fontMatch) {
        currentFont = fontMatch[1];
      }

      // Tm matrix: a b c d e f Tm (e = x, f = y)
      const tmM = line.match(
        /([-\d\.]+)\s+([-\d\.]+)\s+([-\d\.]+)\s+([-\d\.]+)\s+([-\d\.]+)\s+([-\d\.]+)\s+Tm/
      );
      if (tmM) {
        const x = parseFloat(tmM[5]);
        const y = parseFloat(tmM[6]);
        if (curY !== 0 && Math.abs(y - curY) > 3) {
          fullDecoded += '\n';
        } else if (curX !== 0 && x - curX > 6) {
          fullDecoded += ' ';
        }
        curX = x;
        curY = y;
      }

      // Td offset: dx dy Td
      const tdM = line.match(/([-\d\.]+)\s+([-\d\.]+)\s+Td/);
      if (tdM) {
        const dx = parseFloat(tdM[1]);
        const dy = parseFloat(tdM[2]);
        curX += dx;
        curY += dy;
        if (Math.abs(dy) > 3) {
          fullDecoded += '\n';
        } else if (dx > 12) {
          fullDecoded += ' ';
        }
      }

      // Hex Tj
      const tjHexMatch = line.match(/<([0-9A-Fa-f]+)>\s*Tj/);
      if (tjHexMatch) {
        const hex = tjHexMatch[1];
        const cmap = cmaps[pageFonts[currentFont]] || {};
        for (let j = 0; j < hex.length; j += 2) {
          const code = parseInt(hex.substr(j, 2), 16);
          fullDecoded += cmap[code] || '';
          curX += 7;
        }
      }

      // Literal Tj
      const tjLiteralMatch = line.match(/\(([^)]+)\)\s*Tj/);
      if (tjLiteralMatch) {
        fullDecoded += tjLiteralMatch[1];
        curX += tjLiteralMatch[1].length * 7;
      }

      // TJ Array
      const tjArrayMatch = line.match(/\[(.*)\]\s*TJ/);
      if (tjArrayMatch) {
        const parts = tjArrayMatch[1].match(/\(([^)]*)\)|<([0-9A-Fa-f]+)>|([-\d\.]+)/g) || [];
        for (const p of parts) {
          if (p.startsWith('(') && p.endsWith(')')) {
            const txt = p.slice(1, -1);
            fullDecoded += txt;
            curX += txt.length * 7;
          } else if (p.startsWith('<') && p.endsWith('>')) {
            const hex = p.slice(1, -1);
            const cmap = cmaps[pageFonts[currentFont]] || {};
            for (let j = 0; j < hex.length; j += 2) {
              const code = parseInt(hex.substr(j, 2), 16);
              fullDecoded += cmap[code] || '';
              curX += 7;
            }
          } else {
            const kerning = parseFloat(p);
            if (kerning < -200) {
              fullDecoded += ' ';
              curX += 4;
            }
          }
        }
      }
    }
    fullDecoded += '\n';
  }

  // 5. Clean text: normalize whitespace, remove control codes
  return fullDecoded
    .replace(/@+/g, ' ')
    .replace(/\u00A0/g, ' ')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();
}
