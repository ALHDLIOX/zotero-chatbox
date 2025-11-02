#!/usr/bin/env node
// Build a minimal Tabler icons sprite for offline use.
// Copies selected SVGs from @tabler/icons-svg into a single sprite file.

import fs from "fs";
import fsp from "fs/promises";
import path from "path";

const root = process.cwd();
const pkgA = path.join(root, "node_modules", "@tabler", "icons-svg", "icons");
const pkgB = path.join(root, "node_modules", "@tabler", "icons", "icons");
const outDir = path.join(root, "addon", "content", "icons");
const outFile = path.join(outDir, "tabler-sprite.svg");

const candidates = [
  { name: "send", ids: ["send.svg", "send-2.svg"] },
  { name: "stop", ids: ["player-stop.svg", "square.svg"] },
  { name: "broom", ids: ["broom.svg"] },
];

function findPkgDir() {
  if (fs.existsSync(pkgA)) return pkgA;
  if (fs.existsSync(pkgB)) return pkgB;
  return undefined;
}

async function readIcon(dir, ids) {
  for (const id of ids) {
    const p = path.join(dir, id);
    if (fs.existsSync(p)) return await fsp.readFile(p, "utf8");
  }
  return undefined;
}

function toSymbol(svg, symbolId) {
  // Keep viewBox and stroke attributes from original, strip outer <svg>
  const viewBox = svg.match(/viewBox="([^"]+)"/i)?.[1] || "0 0 24 24";
  const body = svg.replace(/^[\s\S]*?<svg[^>]*>/i, "").replace(/<\/svg>[\s\S]*$/i, "");
  return `<symbol id="${symbolId}" viewBox="${viewBox}">${body}</symbol>`;
}

async function main() {
  const dir = findPkgDir();
  if (!dir) {
    console.log("[ai-chat] Tabler icons package not found; skip sprite build");
    return;
  }
  await fsp.mkdir(outDir, { recursive: true }).catch(() => {});

  const symbols = [];
  for (const c of candidates) {
    const svg = await readIcon(dir, c.ids);
    if (!svg) {
      console.log("[ai-chat] missing icon:", c);
      continue;
    }
    symbols.push(toSymbol(svg, `ti-${c.name}`));
  }

  const content = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">\n` +
    symbols.join("\n") +
    `\n</svg>\n`;

  await fsp.writeFile(outFile, content, "utf8");
  console.log("[ai-chat] Tabler sprite built:", outFile);
}

main().catch((e) => {
  console.error("[ai-chat] failed to build Tabler sprite", e);
  process.exitCode = 0;
});

