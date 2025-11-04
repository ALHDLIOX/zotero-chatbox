#!/usr/bin/env node
import fs from "fs/promises";

const dist = ".scaffold/build";

async function main() {
  try {
    await fs.rm(dist, { recursive: true, force: true });
    // Recreate root folder to avoid race conditions in some builders
    await fs.mkdir(dist, { recursive: true });
    console.log("[zorecto] cleaned dist:", dist);
  } catch (e) {
    console.log("[zorecto] clean dist failed (non-fatal)", e?.message || e);
  }
}

main();