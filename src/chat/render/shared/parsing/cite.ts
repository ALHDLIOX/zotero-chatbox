/**
 * Citation parser and marker utilities.
 */
export interface CitationTarget { attachmentID: number; page: number; quote?: string; locate?: string }
export interface ParsedCitations { cites: CitationTarget[]; rawObjects?: Array<Record<string, unknown>> }

export function getCiteMarkerRegex(): RegExp { return /\[-\[\s*cite\s*:\s*([\s\S]*?)\s*\]-\]/gi }

export function looksLikeCitationsJson(text: string): boolean {
  if (!text || text.length < 10) return false;
  const trimmed = text.trim();
  if (trimmed.indexOf("{") === -1 || trimmed.lastIndexOf("}") === -1) return false;
  const jsonSlice = trimmed.slice(trimmed.indexOf("{"), trimmed.lastIndexOf("}") + 1);
  try { const data = JSON.parse(jsonSlice); const arr = (data as any)?.paragraphs; return Array.isArray(arr); } catch { return false; }
}

export function parseCitationPayload(text: string): ParsedCitations | undefined {
  if (!text) return undefined;
  const trimmed = text.trim();
  let jsonSlice = trimmed;
  const l = trimmed.indexOf("{") !== -1 ? trimmed.indexOf("{") : trimmed.indexOf("[");
  const r = Math.max(trimmed.lastIndexOf("}"), trimmed.lastIndexOf("]"));
  if (l !== -1 && r !== -1 && r > l) jsonSlice = trimmed.slice(l, r + 1);
  const normalized = jsonSlice
    .replace(/[\u201C\u201D\u201E\u201F\u2033]/g, '"')
    .replace(/[\u2018\u2019\u201A\u2032]/g, "'")
    .replace(/\s+/g, (m) => (m.indexOf("\n") >= 0 ? "\n" : " "));
  try {
    const data = JSON.parse(normalized); const arr = Array.isArray(data) ? data : [data];
    const cites: CitationTarget[] = [];
    for (const c of arr) {
      const a = Number((c as any)?.attachmentID ?? (c as any)?.attachmentId);
      const p = Number((c as any)?.page);
      if (Number.isFinite(a) && Number.isFinite(p)) {
        cites.push({ attachmentID: a, page: p, quote: typeof (c as any)?.quote === "string" ? (c as any).quote : undefined, locate: typeof (c as any)?.locate === "string" ? (c as any).locate as string : undefined });
      }
    }
    if (cites.length > 0) return { cites, rawObjects: arr as Array<Record<string, unknown>> };
  } catch {}
  const candidates: CitationTarget[] = []; const rawObjects: Array<Record<string, unknown>> = [];
  const objectLike = normalized.match(/{[^{}]*}/g);
  const scanTargets = objectLike && objectLike.length > 0 ? objectLike : [normalized];
  for (const chunk of scanTargets) {
    const idMatch = chunk.match(/attachment\s*id|attachmentID|attachmentId/i) ? chunk.match(/(?:attachment\s*id|attachmentID|attachmentId)\s*[:=]\s*(\d+)/i) : null;
    const pageMatch = chunk.match(/page\s*[:=]\s*(\d+)/i);
    if (!idMatch || !pageMatch) continue;
    const attachmentID = Number(idMatch[1]); const page = Number(pageMatch[1]);
    if (!Number.isFinite(attachmentID) || !Number.isFinite(page)) continue;
    const quoteMatch = chunk.match(/quote\s*[:=]\s*(["'`\u201C\u201D\u2018\u2019])([\s\S]*?)\1/);
    const locateMatch = chunk.match(/locate\s*[:=]\s*(["'`\u201C\u201D\u2018\u2019])([\s\S]*?)\1/i);
    const target: CitationTarget = { attachmentID, page, quote: quoteMatch ? quoteMatch[2] : undefined, locate: locateMatch ? locateMatch[2] : undefined };
    candidates.push(target); rawObjects.push({ ...target });
  }
  return candidates.length > 0 ? { cites: candidates, rawObjects } : undefined;
}

