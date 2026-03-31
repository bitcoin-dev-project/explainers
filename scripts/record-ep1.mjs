import { chromium } from 'playwright';
import { readdirSync, statSync, unlinkSync } from 'fs';
import { resolve, join } from 'path';
import { execSync, spawn } from 'child_process';

const PORT = 5173;
const URL = `http://localhost:${PORT}/#ep1?record`;
const OUTPUT_DIR = resolve('.');
const FULL_AUDIO = './client/public/audio/ep1-off-by-one/full.mp3';

// Total video duration in ms (sum of all SCENE_DURATIONS + buffer)
const TOTAL_DURATION = 7660+14710+12560+12730+12220+6710+12900+9080+14140+20800+16110+16770+13530+13240+9194 + 3000;

// Render at 2x resolution for sharper output — Playwright downscales to recordVideo.size
const RENDER_SCALE = 2;
const WIDTH = 1920;
const HEIGHT = 1080;

// Path to Node 20 via nvm (needed for Vite 7)
const NVM_DIR = process.env.NVM_DIR || join(process.env.HOME, '.nvm');
const NODE20_BIN = (() => {
  const v = readdirSync(join(NVM_DIR, 'versions/node'))
    .filter(d => d.startsWith('v20.'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .pop();
  if (!v) { console.error('No Node 20.x found in nvm. Install with: nvm install 20'); process.exit(1); }
  return join(NVM_DIR, 'versions/node', v, 'bin');
})();

async function waitForServer(url, timeout = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {}
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error(`Server did not start within ${timeout}ms`);
}

async function record() {
  // Step 0: Start the dev server
  console.log(`Starting dev server on port ${PORT}...`);
  const devServer = spawn(join(NODE20_BIN, 'npx'), ['vite', 'dev', '--port', String(PORT)], {
    cwd: resolve('.'),
    stdio: 'pipe',
    env: { ...process.env, PATH: `${NODE20_BIN}:${process.env.PATH}` },
  });

  devServer.stderr.on('data', (d) => {
    const msg = d.toString();
    if (msg.includes('error') || msg.includes('Error')) console.error('  Dev server:', msg.trim());
  });

  try {
    await waitForServer(`http://localhost:${PORT}`);
    console.log('  Dev server is ready');
  } catch (e) {
    console.error('Dev server failed to start');
    devServer.kill();
    return;
  }

  // Step 1: Record video with Playwright at high resolution
  console.log(`Launching browser (${WIDTH * RENDER_SCALE}x${HEIGHT * RENDER_SCALE} render → ${WIDTH}x${HEIGHT} capture)...`);
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: WIDTH * RENDER_SCALE, height: HEIGHT * RENDER_SCALE },
    deviceScaleFactor: 1,
    recordVideo: {
      dir: OUTPUT_DIR,
      size: { width: WIDTH * RENDER_SCALE, height: HEIGHT * RENDER_SCALE },
    },
  });

  const page = await context.newPage();

  // Mute browser audio + detect exact component mount time
  await page.addInitScript(() => {
    // Mute audio (we merge separately via FFmpeg)
    const origAudio = window.Audio;
    window.Audio = class extends origAudio {
      constructor(src) {
        super(src);
        this.volume = 0;
      }
    };

    // Detect exact moment the video component mounts (= when scenes start advancing)
    window.__mountTime = 0;
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeType === 1) {
            const el = node.getAttribute?.('data-video') ? node : node.querySelector?.('[data-video]');
            if (el) {
              window.__mountTime = performance.now();
              observer.disconnect();
              return;
            }
          }
        }
      }
    });
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        observer.observe(document.body, { childList: true, subtree: true });
      });
    }
  });

  console.log(`Opening ${URL}...`);
  await page.goto(URL, { waitUntil: 'networkidle' });

  console.log('Waiting for content to render...');
  await page.waitForSelector('[data-video="ep1"]', { timeout: 15000 });

  // Get exact mount time from inside the browser
  const mountTimeMs = await page.evaluate(() => window.__mountTime);
  const audioOffset = mountTimeMs / 1000;
  console.log(`  Component mounted at ${mountTimeMs.toFixed(0)}ms (trim offset: ${audioOffset.toFixed(2)}s)`);

  await page.waitForTimeout(2000);

  const totalSec = Math.round(TOTAL_DURATION / 1000);
  console.log(`Recording video... (~${totalSec} seconds / ~${(totalSec / 60).toFixed(1)} minutes)`);
  await page.waitForTimeout(TOTAL_DURATION);

  console.log('Stopping recording...');
  await page.close();
  await context.close();
  await browser.close();

  // Step 2: Find the recorded webm
  const webmFiles = readdirSync(OUTPUT_DIR)
    .filter(f => f.endsWith('.webm'))
    .map(f => ({ name: f, time: statSync(join(OUTPUT_DIR, f)).mtimeMs }))
    .sort((a, b) => b.time - a.time);

  if (webmFiles.length === 0) {
    console.log('Warning: Could not find output video file');
    devServer.kill();
    return;
  }

  const rawVideo = join(OUTPUT_DIR, webmFiles[0].name);

  // Step 3: Trim page-load dead time + downscale + merge audio → final 1080p MP4
  console.log('Trimming + downscaling + merging audio → 1080p MP4...');
  const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).replace(' ', '-');
  const time = new Date().toLocaleTimeString('en-US', { hour12: false }).replace(/:/g, '-');
  const finalName = `OffByOne-Explainer-${date}-${time}.mp4`;
  const finalPath = join(OUTPUT_DIR, finalName);

  try {
    execSync(
      `ffmpeg -y -ss ${audioOffset.toFixed(2)} -i "${rawVideo}" -i "${FULL_AUDIO}" ` +
      `-vf "scale=${WIDTH}:${HEIGHT}:flags=lanczos" ` +
      `-c:v libx264 -preset slow -crf 14 -pix_fmt yuv420p ` +
      `-c:a aac -b:a 192k -shortest "${finalPath}"`,
      { stdio: 'pipe', maxBuffer: 50 * 1024 * 1024 }
    );
    console.log(`\n  ✓ Video saved: ${finalPath}`);
  } catch (e) {
    console.error('Failed to merge:', e.stderr?.toString().slice(-500));
    const fallback = join(OUTPUT_DIR, finalName.replace('.mp4', '.webm'));
    try { execSync(`mv "${rawVideo}" "${fallback}"`); } catch {}
    console.log(`  Fallback (no audio): ${fallback}`);
    devServer.kill();
    return;
  }

  // Cleanup
  try { unlinkSync(rawVideo); } catch {}

  // Stop dev server
  devServer.kill();

  console.log('\nDone!');
}

record().catch(console.error);
