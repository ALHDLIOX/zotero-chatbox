#!/usr/bin/env node
// Copies Water.css into addon/content/vendor/ui for offline usage.
// - Requires `water.css` to be installed in node_modules
// - Safe to run multiple times; overwrites existing files

import fs from "fs";
import fsp from "fs/promises";
import path from "path";

const root = process.cwd();
const srcDir = path.join(root, "node_modules", "water.css", "out");
const destDir = path.join(root, "addon", "content", "vendor", "ui");
const scopedOut = path.join(destDir, "water-scoped.css");

async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true }).catch(() => {});
}

async function copyFile(src, dest) {
  await ensureDir(path.dirname(dest));
  await fsp.copyFile(src, dest);
}

async function main() {
  if (!fs.existsSync(srcDir)) {
    console.log(
      "[ai-chat] skip copying Water.css: node_modules/water.css/out not found",
    );
    return;
  }

  const candidateMin = path.join(srcDir, "water.min.css");
  const candidate = path.join(srcDir, "water.css");
  const existing = fs.existsSync(candidateMin)
    ? candidateMin
    : fs.existsSync(candidate)
    ? candidate
    : undefined;

  if (!existing) {
    console.log(
      "[ai-chat] Water.css files missing in node_modules; expected out/water(.min).css",
    );
    return;
  }

  const dest = path.join(destDir, "water.min.css");
  await copyFile(existing, dest);
  console.log("[ai-chat] Water.css copied", dest);

  // Optionally generate prefixed version if postcss toolchain is available
  try {
    const { default: postcss } = await import("postcss");
    const { default: prefixer } = await import("postcss-prefix-selector");
    const css = await fsp.readFile(dest, "utf8");
    const result = await postcss([
      prefixer({
        prefix: ".ai-chat-pane",
        transform: (prefix, selector, prefixedSelector) => {
          // Don't prefix root-level or html/body selectors
          if (/^(:root|html|body)\b/.test(selector)) return selector;
          return prefixedSelector;
        },
      }),
    ]).process(css, { from: undefined });
    await fsp.writeFile(scopedOut, result.css, "utf8");
    // Overwrite dest with scoped CSS so runtime can link to water.min.css safely
    await fsp.writeFile(dest, result.css, "utf8");
    console.log("[ai-chat] Water.css prefixed and written to", scopedOut, "and", dest);
  } catch (e) {
    console.log(
      "[ai-chat] postcss not installed; skipping Water.css prefix step",
    );
  }
}

main().catch((err) => {
  console.error("[ai-chat] failed to copy Water.css", err);
  process.exitCode = 0; // keep build going
});
