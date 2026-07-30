import type { ParsedBulkResult, QuoteData, ServiceType } from "./types";

const FIELD_ALIASES: Record<keyof QuoteData, RegExp[]> = {
  name: [/^(?:ad\s*soyad|ad\s*soyadi|isim|ad)\s*[:：]?\s*(.+)$/iu],
  service: [/^(?:hizmet(?:\s*türü|\s*turu)?)\s*[:：]?\s*(.+)$/iu],
  from: [/^(?:çıkış|cikis|nereden|alış|alis|çıkış\s*adresi|cikis\s*adresi)\s*[:：]?\s*(.+)$/iu],
  to: [/^(?:varış|varis|nereye|teslim|varış\s*adresi|varis\s*adresi)\s*[:：]?\s*(.+)$/iu],
  date: [/^(?:taşınma\s*tarihi|tasinma\s*tarihi|tarih)\s*[:：]?\s*(.+)$/iu],
  floorElevator: [/^(?:kat(?:\/\s*asansör|\s*asansor)?|asansör|asansor|kat\s*\/\s*asansör)\s*[:：]?\s*(.+)$/iu],
  rooms: [/^(?:oda(?:\s*sayısı|\s*sayisi)?|oda)\s*[:：]?\s*(.+)$/iu],
  items: [/^(?:eşya(?:\s*listesi)?|esya(?:\s*listesi)?|parça(?:\s*eşya)?|parca(?:\s*esya)?)\s*[:：]?\s*(.+)$/iu],
  notes: [/^(?:ek\s*not(?:lar)?|not(?:lar)?)\s*[:：]?\s*(.+)$/iu],
};

const NUMBERED_LINE = /^\s*(?:\d+[\.\)\]:：]|[\u{1F1E6}-\u{1F51F}]|[\u2460-\u2473])\s*(.+)$/u;

function normalizeService(raw: string): ServiceType | undefined {
  const value = raw.toLowerCase();
  if (/parça|parca|tek\s*eşya|tek\s*esya/.test(value)) return "parca";
  if (/evden|eşyalı|esyali|ev\s*taşı|ev\s*tasi/.test(value)) return "evden-eve";
  return undefined;
}

function cleanValue(value: string): string {
  return value.replace(/^[\s\-–—]+|[\s\-–—]+$/g, "").trim();
}

export function looksLikeBulkMessage(text: string): boolean {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return false;

  let matches = 0;
  for (const line of lines) {
    for (const patterns of Object.values(FIELD_ALIASES)) {
      if (patterns.some((p) => p.test(line))) {
        matches++;
        break;
      }
    }
  }
  return matches >= 2;
}

export function parseBulkMessage(text: string): ParsedBulkResult {
  const data: QuoteData = {};
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    let handled = false;

    for (const [field, patterns] of Object.entries(FIELD_ALIASES) as Array<
      [keyof QuoteData, RegExp[]]
    >) {
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match?.[1]) {
          const value = cleanValue(match[1]);
          if (field === "service") {
            data.service = normalizeService(value) ?? data.service;
          } else {
            data[field] = value;
          }
          handled = true;
          break;
        }
      }
      if (handled) break;
    }

    if (!handled) {
      const numbered = line.match(NUMBERED_LINE);
      if (numbered?.[1]) {
        const inner = numbered[1];
        const colonIdx = inner.search(/[:：]/);
        if (colonIdx > 0) {
          const key = inner.slice(0, colonIdx).trim();
          const value = cleanValue(inner.slice(colonIdx + 1));
          const synthetic = `${key}: ${value}`;
          for (const [field, patterns] of Object.entries(FIELD_ALIASES) as Array<
            [keyof QuoteData, RegExp[]]
          >) {
            for (const pattern of patterns) {
              const match = synthetic.match(pattern);
              if (match?.[1]) {
                if (field === "service") {
                  data.service = normalizeService(match[1]) ?? data.service;
                } else {
                  data[field] = cleanValue(match[1]);
                }
                handled = true;
                break;
              }
            }
            if (handled) break;
          }
        }
      }
    }
  }

  const filledCount = Object.values(data).filter((v) => v && String(v).trim()).length;
  return { data, filledCount };
}

export function detectServiceFromText(text: string): ServiceType | undefined {
  const lower = text.toLowerCase();
  if (/parça\s*eşya|parca\s*esya|tek\s*parça|tek\s*parca/.test(lower)) return "parca";
  if (/evden\s*eve|ev\s*taşıma|ev\s*tasima/.test(lower)) return "evden-eve";
  return undefined;
}
