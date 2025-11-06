/** Markdown + math tokenizer (no DOM side effects). */
export type MathDelimiter =
  | "inline-$"
  | "block-$$"
  | "inline-\\(\\)"
  | "block-\\[\\]";

export interface MathSegment {
  type: "math";
  delimiter: MathDelimiter;
  content: string;
  inline: boolean;
  startIndex: number;
  endIndex: number;
}

export interface TextSegment {
  type: "text";
  content: string;
  startIndex: number;
  endIndex: number;
}

export interface InlineCodeSegment {
  type: "code";
  content: string;
  startIndex: number;
  endIndex: number;
}

export type InlineToken = TextSegment | InlineCodeSegment | MathSegment;

export interface ParagraphBlock {
  type: "paragraph";
  tokens: InlineToken[];
  startIndex: number;
  endIndex: number;
}

export interface HeadingBlock {
  type: "heading";
  level: number;
  tokens: InlineToken[];
  startIndex: number;
  endIndex: number;
}

export interface ListBlock {
  type: "list";
  ordered: boolean;
  items: InlineToken[][];
  startIndex: number;
  endIndex: number;
}

export interface CodeBlock {
  type: "code";
  content: string;
  info?: string;
  startIndex: number;
  endIndex: number;
}

export interface MathBlock {
  type: "math";
  token: MathSegment;
  startIndex: number;
  endIndex: number;
}

export interface TableBlock {
  type: "table";
  header: InlineToken[][]; // per-cell tokens
  aligns: Array<"left" | "center" | "right">;
  rows: InlineToken[][][]; // rows -> cells -> tokens
  startIndex: number;
  endIndex: number;
}

export type MarkdownBlock =
  | ParagraphBlock
  | HeadingBlock
  | ListBlock
  | CodeBlock
  | MathBlock
  | TableBlock;

export interface ParseResult {
  blocks: MarkdownBlock[];
  mathSegments: MathSegment[];
}

interface LineInfo {
  line: string;
  startIndex: number;
  lineEnd: number;
  nextIndex: number;
}

export function parseMarkdownWithMath(source: string): ParseResult {
  const normalized = source.replace(/\r\n?/g, "\n");
  const mathSegments: MathSegment[] = [];
  const blocks: MarkdownBlock[] = [];

  let index = 0;
  const length = normalized.length;

  while (index < length) {
    const lineInfo = getLine(normalized, index);
    const trimmed = lineInfo.line.trim();

    if (trimmed.length === 0) {
      index = lineInfo.nextIndex;
      continue;
    }

    const mathBlock = tryParseDelimitedMathBlock(
      normalized,
      lineInfo,
      "$$",
      "block-$$",
      false,
    );
    if (mathBlock) {
      mathSegments.push(mathBlock.token);
      blocks.push(mathBlock);
      index = mathBlock.endIndex;
      continue;
    }

    const latexMathBlock = tryParseDelimitedMathBlock(
      normalized,
      lineInfo,
      "\\[",
      "block-\\[\\]",
      false,
    );
    if (latexMathBlock) {
      mathSegments.push(latexMathBlock.token);
      blocks.push(latexMathBlock);
      index = latexMathBlock.endIndex;
      continue;
    }

    const fence = matchCodeFence(lineInfo.line);
    if (fence) {
      const codeBlock = consumeCodeBlock(normalized, lineInfo, fence);
      blocks.push(codeBlock);
      index = codeBlock.endIndex;
      continue;
    }

    const heading = matchHeading(lineInfo.line);
    if (heading) {
      const headingBlock = consumeHeading(
        normalized,
        lineInfo,
        heading,
        mathSegments,
      );
      blocks.push(headingBlock);
      index = headingBlock.endIndex;
      continue;
    }

    const list = matchList(lineInfo.line);
    if (list) {
      const listBlock = consumeList(normalized, lineInfo, list, mathSegments);
      blocks.push(listBlock);
      index = listBlock.endIndex;
      continue;
    }

    // GitHub-style pipe table
    const table = tryParsePipeTable(normalized, lineInfo, mathSegments);
    if (table) {
      blocks.push(table);
      index = table.endIndex;
      continue;
    }

    const paragraph = consumeParagraph(normalized, lineInfo, mathSegments);
    blocks.push(paragraph);
    index = paragraph.endIndex;
  }

  return { blocks, mathSegments };
}

function getLine(source: string, start: number): LineInfo {
  let lineEnd = source.indexOf("\n", start);
  if (lineEnd === -1) {
    lineEnd = source.length;
  }
  const line = source.slice(start, lineEnd);
  const nextIndex = lineEnd === source.length ? lineEnd : lineEnd + 1;
  return {
    line,
    startIndex: start,
    lineEnd,
    nextIndex,
  };
}

interface FenceMatch {
  marker: "`" | "~";
  length: number;
  info: string;
}

function matchCodeFence(line: string): FenceMatch | null {
  const match = line.match(/^(?: {0,3})(`{3,}|~{3,})(.*)$/);
  if (!match) {
    return null;
  }
  const marker = match[1][0] as "`" | "~";
  return {
    marker,
    length: match[1].length,
    info: match[2]?.trim() ?? "",
  };
}

function consumeCodeBlock(
  source: string,
  lineInfo: LineInfo,
  fence: FenceMatch,
): CodeBlock {
  const { marker, length } = fence;
  let nextIndex = lineInfo.nextIndex;
  let endIndex = source.length;

  while (nextIndex <= source.length) {
    if (nextIndex === source.length) {
      endIndex = nextIndex;
      break;
    }
    const probe = getLine(source, nextIndex);
    if (isClosingFence(probe.line, marker, length)) {
      endIndex = probe.nextIndex;
      break;
    }
    nextIndex = probe.nextIndex;
  }

  const contentStart = lineInfo.nextIndex;
  const contentEnd = Math.max(contentStart, endIndex - 1);
  const content = source
    .slice(contentStart, contentEnd)
    .replace(/\r?\n$/, "");

  return {
    type: "code",
    content,
    info: fence.info || undefined,
    startIndex: lineInfo.startIndex,
    endIndex,
  };
}

function isClosingFence(
  line: string,
  marker: "`" | "~",
  minLength: number,
): boolean {
  const pattern = new RegExp(
    `^(?: {0,3})${escapeRegex(marker)}{${minLength},}\\s*$`,
  );
  return pattern.test(line);
}

// ---------- Pipe Table Parsing ----------

function tryParsePipeTable(
  source: string,
  headerLine: LineInfo,
  mathSegments: MathSegment[],
): TableBlock | null {
  // Header row must contain at least one pipe
  if (headerLine.line.indexOf("|") === -1) return null;
  const next = getLine(source, headerLine.nextIndex);
  // Second line must be a divider like |---|:--:|--:|
  if (!isTableDivider(next.line)) return null;

  const headerCells = splitPipeRow(headerLine.line);
  if (!headerCells || headerCells.length < 1) return null;
  const aligns = parseDividerAligns(next.line, headerCells.length);

  const rows: string[][] = [];
  let endIndex = next.nextIndex;
  while (endIndex <= source.length) {
    if (endIndex === source.length) break;
    const probe = getLine(source, endIndex);
    const trimmed = probe.line.trim();
    if (trimmed.length === 0) {
      endIndex = probe.nextIndex;
      break;
    }
    const cells = splitPipeRow(probe.line);
    if (!cells) break;
    rows.push(cells);
    endIndex = probe.nextIndex;
  }

  // Tokenize cells
  const headerTokens: InlineToken[][] = headerCells.map((text, i) =>
    parseInline(text.trim(), headerLine.startIndex + headerLine.line.indexOf(text), mathSegments, text.length),
  );
  const rowTokens: InlineToken[][][] = rows.map((row, r) =>
    normalizeRow(row, headerCells.length).map((text, c) =>
      parseInline(
        text.trim(),
        headerLine.startIndex + (r + 2),
        mathSegments,
        text.length,
      ),
    ),
  );

  return {
    type: "table",
    header: headerTokens,
    aligns,
    rows: rowTokens,
    startIndex: headerLine.startIndex,
    endIndex,
  };
}

function splitPipeRow(line: string): string[] | null {
  // Strip leading/trailing pipes if present
  const raw = line.trim();
  if (raw.length === 0) return null;
  // require at least one unescaped pipe
  let hasPipe = false;
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === "|" && raw[i - 1] !== "\\") {
      hasPipe = true;
      break;
    }
  }
  if (!hasPipe) return null;

  let s = raw;
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|")) s = s.slice(0, -1);

  const cells: string[] = [];
  let current = "";
  let escaped = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (escaped) {
      current += ch;
      escaped = false;
    } else if (ch === "\\") {
      escaped = true;
    } else if (ch === "|") {
      cells.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells.map((c) => c.trim());
}

function isTableDivider(line: string): boolean {
  const raw = line.trim();
  if (raw.indexOf("|") === -1) return false;
  const cells = splitPipeRow(raw);
  if (!cells) return false;
  return (
    cells.length >= 1 &&
    cells.every((cell) => /:?-{3,}:?/.test(cell))
  );
}

function parseDividerAligns(line: string, count: number): Array<"left" | "center" | "right"> {
  const cells = splitPipeRow(line) || [];
  const aligns: Array<"left" | "center" | "right"> = [];
  for (let i = 0; i < count; i++) {
    const cell = (cells[i] || "").trim();
    const left = cell.startsWith(":");
    const right = cell.endsWith(":");
    aligns.push(left && right ? "center" : right ? "right" : "left");
  }
  return aligns;
}

function normalizeRow(row: string[], targetLength: number): string[] {
  const cells = row.slice(0, targetLength);
  while (cells.length < targetLength) cells.push("");
  return cells;
}

function consumeHeading(
  source: string,
  lineInfo: LineInfo,
  heading: { level: number; content: string },
  mathSegments: MathSegment[],
): HeadingBlock {
  const text = heading.content.trim();
  const tokens = parseInline(text, lineInfo.startIndex + lineInfo.line.indexOf(text), mathSegments, text.length);
  return {
    type: "heading",
    level: heading.level,
    tokens,
    startIndex: lineInfo.startIndex,
    endIndex: lineInfo.nextIndex,
  };
}

function matchHeading(line: string): { level: number; content: string } | null {
  const match = line.match(/^(?: {0,3})(#{1,6})\s+(.*)$/);
  if (!match) return null;
  return { level: match[1].length, content: match[2] ?? "" };
}

function matchList(line: string): { ordered: boolean; marker: string } | null {
  const bullet = /^(?: {0,3})([*+-])\s+/.exec(line);
  if (bullet) return { ordered: false, marker: bullet[1] };
  const ordered = /^(?: {0,3})(\d+)\.[\t| ]+/.exec(line);
  if (ordered) return { ordered: true, marker: ordered[1] };
  return null;
}

function consumeList(
  source: string,
  lineInfo: LineInfo,
  list: { ordered: boolean; marker: string },
  mathSegments: MathSegment[],
): ListBlock {
  const items: InlineToken[][] = [];
  let nextIndex = lineInfo.startIndex;
  let endIndex = lineInfo.nextIndex;
  const pattern = list.ordered
    ? new RegExp(`^(?: {0,3})${escapeRegex(list.marker)}\\.[\t| ]+(.*)$`)
    : /^(?: {0,3})([*+-])\s+(.*)$/;

  let i = 0;
  while (true) {
    const line = getLine(source, nextIndex);
    const m = pattern.exec(line.line);
    if (!m) {
      endIndex = line.startIndex;
      break;
    }
    const content = (m[2] ?? m[1] ?? "").trim();
    const tokens = parseInline(content, line.startIndex + line.line.indexOf(content), mathSegments, content.length);
    items.push(tokens);
    i += 1;
    nextIndex = line.nextIndex;
    if (nextIndex >= source.length) {
      endIndex = source.length;
      break;
    }
  }

  return {
    type: "list",
    ordered: list.ordered,
    items,
    startIndex: lineInfo.startIndex,
    endIndex,
  };
}

function consumeParagraph(
  source: string,
  lineInfo: LineInfo,
  mathSegments: MathSegment[],
): ParagraphBlock {
  let nextIndex = lineInfo.nextIndex;
  while (nextIndex <= source.length) {
    if (nextIndex === source.length) break;
    const probe = getLine(source, nextIndex);
    if (probe.line.trim().length === 0) {
      nextIndex = probe.nextIndex;
      break;
    }
    if (matchHeading(probe.line) || matchCodeFence(probe.line) || matchList(probe.line)) {
      break;
    }
    const maybeDivider = getLine(source, nextIndex);
    if (isTableDivider(maybeDivider.line)) {
      break;
    }
    nextIndex = probe.nextIndex;
  }
  const content = source.slice(lineInfo.startIndex, nextIndex);
  const text = content.replace(/\s+$/g, "");
  const tokens = parseInline(text, lineInfo.startIndex, mathSegments, text.length);
  return {
    type: "paragraph",
    tokens,
    startIndex: lineInfo.startIndex,
    endIndex: nextIndex,
  };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

interface MathMatchResult {
  delimiter: MathDelimiter;
  contentStart: number;
  contentEnd: number;
  endIndex: number;
  inline: boolean;
}

function matchMath(text: string, start: number): MathMatchResult | null {
  const char = text[start];

  if (char === "$") {
    const run = countRun(text, start, "$");
    if (run >= 2) {
      const closing = text.indexOf("$$", start + 2);
      if (closing !== -1) {
        return {
          delimiter: "block-$$",
          contentStart: start + 2,
          contentEnd: closing,
          endIndex: closing + 2,
          inline: false,
        };
      }
    } else {
      const closing = findInlineFence(text, start + 1, "$", 1);
      if (closing !== -1) {
        return {
          delimiter: "inline-$",
          contentStart: start + 1,
          contentEnd: closing,
          endIndex: closing + 1,
          inline: true,
        };
      }
    }
  }

  if (char === "\\") {
    if (text.slice(start, start + 2) === "\\[") {
      const closing = text.indexOf("\\]", start + 2);
      if (closing !== -1) {
        return {
          delimiter: "block-\\[\\]",
          contentStart: start + 2,
          contentEnd: closing,
          endIndex: closing + 2,
          inline: false,
        };
      }
    }
    if (text.slice(start, start + 2) === "\\(") {
      const closing = text.indexOf("\\)", start + 2);
      if (closing !== -1) {
        return {
          delimiter: "inline-\\(\\)",
          contentStart: start + 2,
          contentEnd: closing,
          endIndex: closing + 2,
          inline: true,
        };
      }
    }
  }

  return null;
}

function tryParseDelimitedMathBlock(
  source: string,
  lineInfo: LineInfo,
  delimiter: "$$" | "\\[",
  kind: MathDelimiter,
  inline: boolean,
): MathBlock | null {
  const trimmed = lineInfo.line.trim();
  if (!trimmed.startsWith(delimiter)) return null;
  const closing = findClosingLine(source, lineInfo.nextIndex, delimiter);
  if (!closing) return null;

  const content = source
    .slice(lineInfo.nextIndex, closing.startIndex)
    .replace(/\n$/, "");

  const token: MathSegment = {
    type: "math",
    delimiter: kind,
    content,
    inline,
    startIndex: lineInfo.startIndex + lineInfo.line.indexOf(delimiter),
    endIndex: closing.startIndex + closing.line.indexOf(delimiter) + delimiter.length,
  };

  return {
    type: "math",
    token,
    startIndex: lineInfo.startIndex,
    endIndex: closing.nextIndex,
  };
}

function parseInline(
  text: string,
  baseIndex: number,
  mathSegments: MathSegment[],
  length: number,
): InlineToken[] {
  const tokens: InlineToken[] = [];
  let index = 0;
  let bufferStart = 0;

  const flushBuffer = (end: number) => {
    if (end <= bufferStart) {
      return;
    }
    tokens.push({
      type: "text",
      content: text.slice(bufferStart, end),
      startIndex: baseIndex + bufferStart,
      endIndex: baseIndex + end,
    });
  };

  while (index < length) {
    const char = text[index];

    if (char === "`") {
      const runLength = countRun(text, index, "`");
      const closing = findInlineFence(text, index + runLength, "`", runLength);
      if (closing !== -1) {
        flushBuffer(index);
        const contentStart = index + runLength;
        const contentEnd = closing;
        tokens.push({
          type: "code",
          content: text.slice(contentStart, contentEnd),
          startIndex: baseIndex + index,
          endIndex: baseIndex + closing + runLength,
        });
        index = closing + runLength;
        bufferStart = index;
        continue;
      }
    }

    const mathMatch = matchMath(text, index);
    if (mathMatch) {
      flushBuffer(index);
      const segment: MathSegment = {
        type: "math",
        delimiter: mathMatch.delimiter,
        content: text.slice(mathMatch.contentStart, mathMatch.contentEnd),
        inline: mathMatch.inline,
        startIndex: baseIndex + index,
        endIndex: baseIndex + mathMatch.endIndex,
      };
      if (segment.content.trim().length > 0) {
        tokens.push(segment);
        mathSegments.push(segment);
      } else {
        tokens.push({
          type: "text",
          content: text.slice(index, mathMatch.endIndex),
          startIndex: baseIndex + index,
          endIndex: baseIndex + mathMatch.endIndex,
        });
      }
      index = mathMatch.endIndex;
      bufferStart = index;
      continue;
    }

    index += 1;
  }

  flushBuffer(length);
  mergeAdjacentText(tokens);
  return tokens;
}

function mergeAdjacentText(tokens: InlineToken[]): void {
  if (tokens.length === 0) {
    return;
  }

  let i = 0;
  while (i < tokens.length - 1) {
    const current = tokens[i];
    const next = tokens[i + 1];
    if (current.type === "text" && next.type === "text") {
      current.content += next.content;
      current.endIndex = next.endIndex;
      tokens.splice(i + 1, 1);
      continue;
    }
    i += 1;
  }
}

function countRun(text: string, start: number, char: string): number {
  let count = 0;
  while (text[start + count] === char) {
    count += 1;
  }
  return count;
}

function findInlineFence(
  text: string,
  start: number,
  fenceChar: string,
  length: number,
): number {
  const end = text.length;
  for (let i = start; i < end; i++) {
    if (text[i] !== fenceChar) continue;
    const runLength = countRun(text, i, fenceChar);
    if (runLength >= length) return i;
  }
  return -1;
}

function findClosingLine(
  source: string,
  start: number,
  delimiter: string,
): LineInfo | null {
  let nextIndex = start;
  while (nextIndex <= source.length) {
    if (nextIndex === source.length) return null;
    const probe = getLine(source, nextIndex);
    if (probe.line.trim().endsWith(delimiter)) {
      return probe;
    }
    nextIndex = probe.nextIndex;
  }
  return null;
}
