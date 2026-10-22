import zlib from 'zlib';

/**
 * Universal PDF Text & Glyphs Extractor
 * Supports 1-byte and 2-byte CID fonts, custom ToUnicode CMaps, literal escape sequences,
 * and positional matrix tracking (Tm, Td, TJ) for accurate word/line segmentation.
 */
export function extractTextFromPdf(pdfBuffer: Buffer): string {
  const str = pdfBuffer.toString('latin1');

  // 1. Map font object IDs to their ToUnicode CMap object IDs (strict single-object scope)
  const fontToCmap: Record<string, string> = {};
  const fontRegex = /(?:^|\r?\n)(\d+)\s+0\s+obj(?:(?!endobj)[\s\S])*?\/ToUnicode\s+(\d+)\s+0\s+R/g;
  let m: RegExpExecArray | null;
  while ((m = fontRegex.exec(str)) !== null) {
    fontToCmap[m[1]] = m[2];
  }

  // 2. Map page font identifiers (/F1, /F2, etc.) to CMap object IDs
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

  // 3. Parse CMaps (bfchar and bfrange sections)
  const cmaps: Record<string, Record<number, string>> = {};
  const isTwoByteFont: Record<string, boolean> = {};

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
    let maxSrc = 0;

    // bfchar sections
    const bfcharSections = inflated.matchAll(/beginbfchar([\s\S]*?)endbfchar/g);
    for (const section of bfcharSections) {
      const charRegex = /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g;
      let cm: RegExpExecArray | null;
      while ((cm = charRegex.exec(section[1])) !== null) {
        const src = parseInt(cm[1], 16);
        if (src > maxSrc) maxSrc = src;
        map[src] = String.fromCharCode(parseInt(cm[2], 16));
      }
    }

    // bfrange sections (handles single/multi range with optional spaces between tags)
    const bfrangeSections = inflated.matchAll(/beginbfrange([\s\S]*?)endbfrange/g);
    for (const section of bfrangeSections) {
      const rangeRegex = /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g;
      let cm: RegExpExecArray | null;
      while ((cm = rangeRegex.exec(section[1])) !== null) {
        const start = parseInt(cm[1], 16);
        const end = parseInt(cm[2], 16);
        if (end > maxSrc) maxSrc = end;
        let destStart = parseInt(cm[3], 16);
        for (let c = start; c <= end; c++) {
          map[c] = String.fromCharCode(destStart++);
        }
      }
    }

    cmaps[cmapObjId] = map;
    isTwoByteFont[cmapObjId] = maxSrc > 255;
  }

  // Helper to decode PDF literal escape sequences
  function unescapePdf(s: string): string {
    return s
      .replace(/\\\\/g, '\\')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\\(/g, '(')
      .replace(/\\\)/g, ')')
      .replace(/\\([0-7]{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)));
  }

  // Helper to decode string with font's CMap
  function decodeString(rawStr: string, cmap: Record<number, string>, isTwoByte: boolean): string {
    if (!cmap || Object.keys(cmap).length === 0) return rawStr;
    let res = '';
    if (isTwoByte) {
      for (let i = 0; i < rawStr.length; i += 2) {
        const b1 = rawStr.charCodeAt(i);
        const b2 = i + 1 < rawStr.length ? rawStr.charCodeAt(i + 1) : 0;
        const cid = (b1 << 8) | b2;
        res += cmap[cid] !== undefined ? cmap[cid] : cid < 128 ? String.fromCharCode(cid) : '';
      }
    } else {
      for (let i = 0; i < rawStr.length; i++) {
        const cid = rawStr.charCodeAt(i);
        res += cmap[cid] !== undefined ? cmap[cid] : rawStr[i];
      }
    }
    return res;
  }

  // 4. Decode content streams with layout awareness
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

      const cmapId = pageFonts[currentFont] || '';
      const cmap = cmaps[cmapId] || {};
      const isTwoByte = isTwoByteFont[cmapId] || false;

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

      // Hex Tj: <00120018> Tj
      const tjHexMatch = line.match(/<([0-9A-Fa-f]+)>\s*Tj/);
      if (tjHexMatch) {
        const hex = tjHexMatch[1];
        const step = isTwoByte || (hex.length % 4 === 0 && hex.length >= 4 && cmap[parseInt(hex.substr(0, 4), 16)] !== undefined) ? 4 : 2;
        for (let j = 0; j < hex.length; j += step) {
          const code = parseInt(hex.substr(j, step), 16);
          fullDecoded += cmap[code] || '';
          curX += 7;
        }
      }

      // Literal Tj: (Electronic...) Tj
      const tjLiteralMatch = line.match(/\((.*?)\)\s*Tj/);
      if (tjLiteralMatch) {
        const unescaped = unescapePdf(tjLiteralMatch[1]);
        const dec = decodeString(unescaped, cmap, isTwoByte);
        fullDecoded += dec;
        curX += dec.length * 7;
      }

      // TJ Array: [(...) -250 (...)] TJ
      const tjArrayMatch = line.match(/\[(.*)\]\s*TJ/);
      if (tjArrayMatch) {
        const parts = tjArrayMatch[1].match(/\((?:[^\\)]|\\.)*\)|<([0-9A-Fa-f]+)>|([-\d\.]+)/g) || [];
        for (const p of parts) {
          if (p.startsWith('(') && p.endsWith(')')) {
            const inner = unescapePdf(p.slice(1, -1));
            const dec = decodeString(inner, cmap, isTwoByte);
            fullDecoded += dec;
            curX += dec.length * 7;
          } else if (p.startsWith('<') && p.endsWith('>')) {
            const hex = p.slice(1, -1);
            const step = isTwoByte ? 4 : 2;
            for (let j = 0; j < hex.length; j += step) {
              const code = parseInt(hex.substr(j, step), 16);
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

  // 5. Clean text: normalize spaces, strip unprintable binary control codes
  return fullDecoded
    .replace(/@+/g, ' ')
    .replace(/\u00A0/g, ' ')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();
}
