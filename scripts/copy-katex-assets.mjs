#!/usr/bin/env node
// Copies KaTeX runtime assets into addon/content/vendor for offline usage.
// - Requires `katex` to be installed in node_modules
// - Safe to run multiple times; overwrites existing files

import fs from "fs";
import fsp from "fs/promises";
import path from "path";

const root = process.cwd();
const srcDir = path.join(root, "node_modules", "katex", "dist");
const destDir = path.join(root, "addon", "content", "vendor");

async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true }).catch(() => {});
}

async function copyFile(src, dest) {
  await ensureDir(path.dirname(dest));
  await fsp.copyFile(src, dest);
}

async function copyDir(src, dest) {
  await ensureDir(dest);
  const entries = await fsp.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(s, d);
    } else if (entry.isFile()) {
      await copyFile(s, d);
    }
  }
}

async function main() {
  const exists = fs.existsSync(srcDir);
  if (!exists) {
    console.log(
      "[ai-chat] skip copying KaTeX assets: node_modules/katex/dist not found",
    );
    return;
  }

  const jsSrc = path.join(srcDir, "katex.min.js");
  const cssSrc = path.join(srcDir, "katex.min.css");
  const fontsSrc = path.join(srcDir, "fonts");

  const jsDest = path.join(destDir, "katex.min.js");
  const cssDest = path.join(destDir, "katex.min.css");
  const fontsDest = path.join(destDir, "fonts");

  await ensureDir(destDir);

  const ops = [];
  if (fs.existsSync(jsSrc)) ops.push(copyFile(jsSrc, jsDest));
  if (fs.existsSync(cssSrc)) ops.push(copyFile(cssSrc, cssDest));
  if (fs.existsSync(fontsSrc)) ops.push(copyDir(fontsSrc, fontsDest));

  if (ops.length === 0) {
    console.log(
      "[ai-chat] KaTeX assets missing in node_modules; please run `npm i katex@^0.16.11`",
    );
    return;
  }

  await Promise.all(ops);
  console.log(
    "[ai-chat] KaTeX assets copied to addon/content/vendor (katex.min.js, katex.min.css, fonts/)",
  );
}

main().catch((err) => {
  console.error("[ai-chat] failed to copy KaTeX assets", err);
  process.exitCode = 0; // keep build going
});

