import { chromium } from 'playwright';
import { renameSync, readdirSync, statSync, unlinkSync } from 'fs';
import { resolve, join } from 'path';
import { execSync, spawn } from 'child_process';

const PORT = 5173;
const URL = `http://localhost:${PORT}/#ep2?record`;
const OUTPUT_DIR = resolve('.');
const AUDIO_DIR = './client/public/audio/ep2-segwit';

// Scene durations in ms (must match SegWitVideoTemplate)
const SCENE_DURATIONS = [7000, 10000, 14000, 12000, 21000, 35000, 24000, 6000];
const AUDIO_DELAY = 400; // ms delay before audio plays in each scene
const TOTAL_DURATION = SCENE_DURATIONS.reduce((a, b) => a + b, 0) + 3000;

// Path to Node 20 via nvm (needed for Vite 7)
const NVM_DIR = process.env.NVM_DIR || join(process.env.HOME, '.nvm');
const NODE20_BIN = join(NVM_DIR, 'versions/node/v20.20.0/bin');

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
  // Step 0: Start the dev server (using Node 20 for Vite 7 compatibility)
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
    await waitForServer(URL);
    console.log('  ✓ Dev server is ready');
  } catch (e) {
    console.error('Dev server failed to start');
    devServer.kill();
    return;
  }

  // Step 1: Create combined audio track with proper timing
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

  const combinedAudio = join(OUTPUT_DIR, '_combined_audio.mp3');
  try {
    execSync(
      `ffmpeg -y ${inputArgs.join(' ')} -filter_complex "${filterComplex}" -map "[out]" -ac 2 -ar 44100 "${combinedAudio}"`,
      { stdio: 'pipe' }
    );
    console.log('  ✓ Combined audio created');
  } catch (e) {
    console.error('Failed to create combined audio:', e.stderr?.toString());
    devServer.kill();
    return;
  }

  // Step 2: Record video with Playwright
  console.log('Launching browser...');
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: OUTPUT_DIR,
      size: { width: 1920, height: 1080 },
    },
  });

  const page = await context.newPage();
  console.log(`Opening ${URL}...`);
  await page.goto(URL, { waitUntil: 'networkidle' });

  // Wait for React content to actually render
  console.log('Waiting for content to render...');
  await page.waitForSelector('div.w-full.h-screen', { timeout: 10000 });
  await page.waitForTimeout(1000); // extra buffer for animations to initialize

  const totalSec = Math.round(TOTAL_DURATION / 1000);
  console.log(`Recording video... (~${totalSec} seconds)`);
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

  // Step 4: Merge video + audio into final MP4
  console.log('Merging video + audio...');
  const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).replace(' ', '-');
  const time = new Date().toLocaleTimeString('en-US', { hour12: false }).replace(/:/g, '-');
  const finalName = `SegWit-Explainer-${date}-${time}.mp4`;
  const finalPath = join(OUTPUT_DIR, finalName);

  try {
    execSync(
      `ffmpeg -y -i "${rawVideo}" -i "${combinedAudio}" -c:v libx264 -preset fast -crf 18 -c:a aac -b:a 192k -shortest "${finalPath}"`,
      { stdio: 'pipe' }
    );
    console.log(`  ✓ Video with audio saved: ${finalPath}`);
  } catch (e) {
    console.error('Failed to merge:', e.stderr?.toString());
    const fallback = join(OUTPUT_DIR, finalName.replace('.mp4', '.webm'));
    renameSync(rawVideo, fallback);
    console.log(`  Fallback (no audio): ${fallback}`);
    devServer.kill();
    return;
  }

  // Cleanup temp files
  try { unlinkSync(rawVideo); } catch {}
  try { unlinkSync(combinedAudio); } catch {}

  // Stop dev server
  devServer.kill();

  console.log('\nDone!');
}

record().catch(console.error);
