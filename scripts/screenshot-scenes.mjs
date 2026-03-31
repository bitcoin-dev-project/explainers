#!/usr/bin/env node
/**
 * screenshot-scenes.mjs — Capture a screenshot of every scene in an episode
 *
 * Usage:
 *   node scripts/screenshot-scenes.mjs <episode_hash> <scene_count> <output_dir>
 *
 * Example:
 *   node scripts/screenshot-scenes.mjs ep7 18 .auto-episode/ep7-merkle-trees/screenshots
 *
 * Starts the dev server if not already running, navigates to the episode,
 * and takes a 1920x1080 screenshot of each scene with a short delay for
 * animations to settle.
 */

import { chromium } from 'playwright';
import { resolve, join } from 'path';
import { mkdirSync, existsSync, readdirSync } from 'fs';
import { spawn } from 'child_process';

const EP_HASH = process.argv[2];
const SCENE_COUNT = parseInt(process.argv[3], 10);
const OUTPUT_DIR = resolve(process.argv[4] || './screenshots');
const PORT = 5173;
const URL = `http://localhost:${PORT}/#${EP_HASH}`;
const SETTLE_MS = 2000; // wait for animations to settle before screenshot

if (!EP_HASH || !SCENE_COUNT) {
  console.error('Usage: node screenshot-scenes.mjs <episode_hash> <scene_count> <output_dir>');
  process.exit(1);
}

mkdirSync(OUTPUT_DIR, { recursive: true });

// ─── Dev Server ─────────────────────────────────────────────────────────────

const NVM_DIR = process.env.NVM_DIR || join(process.env.HOME, '.nvm');
const NODE20_BIN = (() => {
  const v = readdirSync(join(NVM_DIR, 'versions/node'))
    .filter(d => d.startsWith('v20.'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .pop();
  if (!v) { console.error('No Node 20.x found in nvm. Install with: nvm install 20'); process.exit(1); }
  return join(NVM_DIR, 'versions/node', v, 'bin');
})();

async function isServerRunning() {
  try {
    const res = await fetch(`http://localhost:${PORT}`);
    return res.ok;
  } catch {
    return false;
  }
}

async function startDevServer() {
  if (await isServerRunning()) {
    console.log(`Dev server already running on port ${PORT}`);
    return null;
  }

  console.log('Starting dev server...');
  const server = spawn(join(NODE20_BIN, 'npx'), ['vite', 'dev', '--port', String(PORT)], {
    cwd: resolve('.'),
    env: { ...process.env, PATH: `${NODE20_BIN}:${process.env.PATH}` },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  // Wait for server to be ready
  const start = Date.now();
  while (Date.now() - start < 30000) {
    try {
      const res = await fetch(`http://localhost:${PORT}`);
      if (res.ok) {
        console.log('Dev server ready');
        return server;
      }
    } catch {}
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error('Dev server failed to start');
}

// ─── Screenshot ─────────────────────────────────────────────────────────────

async function screenshotScenes() {
  const server = await startDevServer();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  try {
    console.log(`Navigating to ${URL}`);
    await page.goto(URL, { waitUntil: 'networkidle' });

    // Wait for the episode component to mount
    await page.waitForTimeout(2000);

    for (let scene = 0; scene < SCENE_COUNT; scene++) {
      // Wait for animations to settle
      await page.waitForTimeout(SETTLE_MS);

      const filename = `scene-${String(scene).padStart(2, '0')}.png`;
      const filepath = join(OUTPUT_DIR, filename);

      await page.screenshot({ path: filepath, type: 'png' });
      console.log(`  ✓ Scene ${scene}: ${filename}`);

      // Advance to next scene using keyboard (DevControls listens for ArrowRight)
      if (scene < SCENE_COUNT - 1) {
        await page.keyboard.press('ArrowRight');
      }
    }

    console.log(`\nScreenshots saved to ${OUTPUT_DIR}`);
    console.log(`${SCENE_COUNT} scenes captured`);

  } finally {
    await browser.close();
    if (server) {
      server.kill();
      console.log('Dev server stopped');
    }
  }
}

screenshotScenes().catch(err => {
  console.error('Screenshot failed:', err);
  process.exit(1);
});
