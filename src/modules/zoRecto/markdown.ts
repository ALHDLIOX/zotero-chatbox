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
  const cells = splitPipeRow(line);
  if (!cells || cells.length === 0) return false;
  return cells.every((c) => /^:?\s*-{3,}\s*:?$/.test(c));
}

function parseDividerAligns(
  line: string,
  count: number,
): Array<"left" | "center" | "right"> {
  const cells = splitPipeRow(line) || [];
  const aligns: Array<"left" | "center" | "right"> = [];
  for (let i = 0; i < count; i++) {
    const c = (cells[i] || "").trim();
    const left = c.startsWith(":");
    const right = c.endsWith(":");
    aligns.push(left && right ? "center" : right ? "right" : "left");
  }
  return aligns;
}

function normalizeRow(row: string[], size: number): string[] {
  const out = row.slice(0, size);
  while (out.length < size) out.push("");
  return out;
}

interface HeadingMatch {
  level: number;
  content: string;
  prefixLength: number;
}

function matchHeading(line: string): HeadingMatch | null {
  const match = line.match(/^(?: {0,3})(#{1,6})\s+(.*)$/);
  if (!match) {
    return null;
  }
  const level = match[1].length;
  const content = match[2];
  const prefixLength = line.length - content.length;
  return { level, content, prefixLength };
}

function consumeHeading(
  source: string,
  lineInfo: LineInfo,
  heading: HeadingMatch,
  mathSegments: MathSegment[],
): HeadingBlock {
  const baseIndex = lineInfo.startIndex + heading.prefixLength;
  const tokens = parseInline(
    heading.content,
    baseIndex,
    mathSegments,
    heading.content.length,
  );

  return {
    type: "heading",
    level: heading.level,
    tokens,
    startIndex: lineInfo.startIndex,
    endIndex: lineInfo.nextIndex,
  };
}

interface ListMatch {
  ordered: boolean;
  content: string;
  prefixLength: number;
}

function matchList(line: string): ListMatch | null {
  const unordered = line.match(/^ {0,3}([*+-])\s+(.*)$/);
  if (unordered) {
    const content = unordered[2];
    const prefixLength = line.length - content.length;
    return { ordered: false, content, prefixLength };
  }

  const ordered = line.match(/^ {0,3}(\d+)[.)]\s+(.*)$/);
  if (ordered) {
    const content = ordered[2];
    const prefixLength = line.length - content.length;
    return { ordered: true, content, prefixLength };
  }

  return null;
}

function consumeList(
  source: string,
  firstLine: LineInfo,
  initialMatch: ListMatch,
  mathSegments: MathSegment[],
): ListBlock {
  const items: InlineToken[][] = [];
  let endIndex = firstLine.nextIndex;
  let currentLine = firstLine;
  let expectedOrdered = initialMatch.ordered;

  while (true) {
    const match = matchList(currentLine.line);
    if (!match || match.ordered !== expectedOrdered) {
      break;
    }

    const contentStart =
      currentLine.startIndex + (currentLine.line.length - match.content.length);
    const tokens = parseInline(
      match.content,
      contentStart,
      mathSegments,
      match.content.length,
    );
    items.push(tokens);

    endIndex = currentLine.nextIndex;
    if (endIndex >= source.length) {
      break;
    }

    const probe = getLine(source, endIndex);
    if (probe.line.trim().length === 0) {
      endIndex = probe.nextIndex;
      break;
    }

    if (!matchList(probe.line)) {
      break;
    }
    currentLine = probe;
  }

  return {
    type: "list",
    ordered: expectedOrdered,
    items,
    startIndex: firstLine.startIndex,
    endIndex,
  };
}

function consumeParagraph(
  source: string,
  firstLine: LineInfo,
  mathSegments: MathSegment[],
): ParagraphBlock {
  const startIndex = firstLine.startIndex;
  let endIndex = firstLine.nextIndex;

  while (endIndex < source.length) {
    const probe = getLine(source, endIndex);
    const trimmed = probe.line.trim();
    if (trimmed.length === 0) {
      endIndex = probe.nextIndex;
      break;
    }
    if (
      matchCodeFence(probe.line) ||
      matchHeading(probe.line) ||
      matchList(probe.line) ||
      trimmed === "$$" ||
      trimmed === "\\["
    ) {
      break;
    }
    endIndex = probe.nextIndex;
  }

  const content = source.slice(startIndex, endIndex);
  const tokens = parseInline(
    content,
    startIndex,
    mathSegments,
    content.length,
  );

  return {
    type: "paragraph",
    tokens,
    startIndex,
    endIndex,
  };
}

interface MathBlockResult extends MathBlock {}

function tryParseDelimitedMathBlock(
  source: string,
  lineInfo: LineInfo,
  delimiter: string,
  kind: MathDelimiter,
  inline: boolean,
): MathBlockResult | null {
  const trimmed = lineInfo.line.trim();
  if (trimmed !== delimiter) {
    return null;
  }

  const contentStart = lineInfo.nextIndex;
  let searchIndex = contentStart;
  let closingLine: LineInfo | null = null;

  while (searchIndex <= source.length) {
    if (searchIndex === source.length) {
      break;
    }
    const probe = getLine(source, searchIndex);
    if (probe.line.trim() === delimiter) {
      closingLine = probe;
      break;
    }
    searchIndex = probe.nextIndex;
  }

  if (!closingLine) {
    return null;
  }

  const content = source
    .slice(contentStart, Math.max(contentStart, closingLine.startIndex))
    .replace(/\n+$/, "");

  const token: MathSegment = {
    type: "math",
    delimiter: kind,
    content,
    inline,
    startIndex: lineInfo.startIndex + lineInfo.line.indexOf(delimiter),
    endIndex: closingLine.startIndex + closingLine.line.indexOf(delimiter) + delimiter.length,
  };

  return {
    type: "math",
    token,
    startIndex: lineInfo.startIndex,
    endIndex: closingLine.nextIndex,
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
  const fence = fenceChar.repeat(length);
  let searchIndex = start;
  while (searchIndex < text.length) {
    const index = text.indexOf(fence, searchIndex);
    if (index === -1) {
      return -1;
    }
    if (!isEscaped(text, index)) {
      return index;
    }
    searchIndex = index + 1;
  }
  return -1;
}

interface MathMatch {
  contentStart: number;
  contentEnd: number;
  endIndex: number;
  delimiter: MathDelimiter;
  inline: boolean;
}

function matchMath(text: string, index: number): MathMatch | null {
  const char = text[index];

  if (char === "$") {
    if (isEscaped(text, index)) {
      return null;
    }
    const run = countRun(text, index, "$");
    if (run > 2) {
      return null;
    }
    const delimiter = run === 2 ? "block-$$" : "inline-$";
    const closeSeq = "$".repeat(run);
    const contentStart = index + run;
    const contentEnd = findClosingDelimiter(text, contentStart, closeSeq);
    if (contentEnd === -1 || contentEnd === contentStart) {
      return null;
    }
    return {
      contentStart,
      contentEnd,
      endIndex: contentEnd + run,
      delimiter,
      inline: run === 1,
    };
  }

  if (char === "\\" && index + 1 < text.length) {
    const next = text[index + 1];
    if (next === "(") {
      const closeIndex = text.indexOf("\\)", index + 2);
      if (closeIndex === -1 || closeIndex === index + 2) {
        return null;
      }
      return {
        contentStart: index + 2,
        contentEnd: closeIndex,
        endIndex: closeIndex + 2,
        delimiter: "inline-\\(\\)",
        inline: true,
      };
    }
    if (next === "[") {
      const closeIndex = text.indexOf("\\]", index + 2);
      if (closeIndex === -1 || closeIndex === index + 2) {
        return null;
      }
      return {
        contentStart: index + 2,
        contentEnd: closeIndex,
        endIndex: closeIndex + 2,
        delimiter: "block-\\[\\]",
        inline: false,
      };
    }
  }

  return null;
}

function findClosingDelimiter(
  text: string,
  start: number,
  delimiter: string,
): number {
  let searchIndex = start;
  while (searchIndex < text.length) {
    const index = text.indexOf(delimiter, searchIndex);
    if (index === -1) {
      return -1;
    }
    if (!isEscaped(text, index)) {
      return index;
    }
    searchIndex = index + 1;
  }
  return -1;
}

function isEscaped(text: string, index: number): boolean {
  let backslashCount = 0;
  let pointer = index - 1;
  while (pointer >= 0 && text[pointer] === "\\") {
    backslashCount += 1;
    pointer -= 1;
  }
  return backslashCount % 2 === 1;
}

function escapeRegex(char: string): string {
  return char.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
}
