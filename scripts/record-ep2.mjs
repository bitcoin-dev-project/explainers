import { chromium } from 'playwright';
import { readdirSync, statSync, unlinkSync } from 'fs';
import { resolve, join } from 'path';
import { execSync, spawn } from 'child_process';

const PORT = 5173;
const URL = `http://localhost:${PORT}/#ep2?record`;
const OUTPUT_DIR = resolve('.');
const AUDIO_DIR = './client/public/audio/ep2-segwit';

// Scene durations in ms (must match VideoTemplate)
const SCENE_DURATIONS = [7000, 10000, 14000, 12000, 21000, 35000, 24000, 6000];
const AUDIO_DELAY = 400; // ms delay before audio plays in each scene
const TOTAL_DURATION = SCENE_DURATIONS.reduce((a, b) => a + b, 0) + 3000;

// Render at 2x for sharper output
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
  // Step 0: Create combined audio track with proper timing
  console.log('Creating combined audio track...');
  let offset = 0;
  const filterParts = [];
  const inputArgs = [];

  for (let i = 0; i < SCENE_DURATIONS.length; i++) {
    const audioFile = join(AUDIO_DIR, `scene${i + 1}.mp3`);
    inputArgs.push(`-i "${audioFile}"`);
    const delayMs = offset + AUDIO_DELAY;
    filterParts.push(`[${i}]adelay=${delayMs}|${delayMs}[a${i}]`);
    offset += SCENE_DURATIONS[i];
  }

  const mixInputs = Array.from({ length: SCENE_DURATIONS.length }, (_, i) => `[a${i}]`).join('');
  const filterComplex = filterParts.join(';') + `;${mixInputs}amix=inputs=${SCENE_DURATIONS.length}:normalize=0[out]`;

  const combinedAudio = join(OUTPUT_DIR, '_combined_audio_ep2.mp3');
  try {
    execSync(
      `ffmpeg -y ${inputArgs.join(' ')} -filter_complex "${filterComplex}" -map "[out]" -ac 2 -ar 44100 "${combinedAudio}"`,
      { stdio: 'pipe' }
    );
    console.log('  ✓ Combined audio created');
  } catch (e) {
    console.error('Failed to create combined audio:', e.stderr?.toString());
    return;
  }

  // Step 1: Start the dev server
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
    console.log('  ✓ Dev server is ready');
  } catch (e) {
    console.error('Dev server failed to start');
    devServer.kill();
    return;
  }

  // Step 2: Record video with Playwright at high resolution
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

  // Mute browser audio (we merge separately via FFmpeg)
  await page.addInitScript(() => {
    const origAudio = window.Audio;
    window.Audio = class extends origAudio {
      constructor(src) {
        super(src);
        this.volume = 0;
      }
    };

    // Detect exact moment the video component mounts
    window.__mountTime = 0;
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeType === 1) {
            const el = node.querySelector?.('.w-full.h-screen') || (node.classList?.contains('w-full') && node.classList?.contains('h-screen') ? node : null);
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
  await page.waitForSelector('div.w-full.h-screen', { timeout: 15000 });

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

  // Step 3: Find the recorded webm
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

  // Step 4: Trim page-load dead time + downscale + merge audio → final 1080p MP4
  console.log('Trimming + downscaling + merging audio → 1080p MP4...');
  const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).replace(' ', '-');
  const time = new Date().toLocaleTimeString('en-US', { hour12: false }).replace(/:/g, '-');
  const finalName = `SegWit-Explainer-${date}-${time}.mp4`;
  const finalPath = join(OUTPUT_DIR, finalName);

  try {
    execSync(
      `ffmpeg -y -ss ${audioOffset.toFixed(2)} -i "${rawVideo}" -i "${combinedAudio}" ` +
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
  try { unlinkSync(combinedAudio); } catch {}

  // Stop dev server
  devServer.kill();

  console.log('\nDone!');
}

record().catch(console.error);
