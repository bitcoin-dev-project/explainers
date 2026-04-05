#!/usr/bin/env node
/**
 * record.mjs — Export any episode to MP4
 *
 * Usage:
 *   node scripts/record.mjs <episode_hash> [flags]
 *
 * Modes:
 *   (default)    Final quality — high-quality FFmpeg encode
 *   --draft      Draft quality — fast encode, quick review
 *
 * Flags:
 *   --scenes <from>-<to>   Only export a range of scenes (e.g. --scenes 5-10)
 *   --with-audio           Mux voiceover audio into the MP4
 *   --fps <N>              Framerate (default: 30 draft, 60 final)
 *
 * Examples:
 *   node scripts/record.mjs ep7                          # final quality
 *   node scripts/record.mjs ep7 --draft                  # quick draft
 *   node scripts/record.mjs ep7 --draft --scenes 5-10    # draft, scenes 5-10 only
 *   node scripts/record.mjs ep7 --with-audio             # final with voiceover
 *
 * Requires: Dev server running (or starts one), FFmpeg, Playwright
 *
 * How it works:
 *   hooks.ts exposes window.__episodeInfo (state) and window.__episodeControls
 *   (togglePause, goToScene, next, prev). The recorder uses these to drive
 *   playback without depending on DevControls keyboard shortcuts.
 */

import { chromium } from 'playwright';
import { resolve, join, basename } from 'path';
import { mkdirSync, existsSync, readdirSync, readFileSync, rmSync, writeFileSync, statSync } from 'fs';
import { spawn, execSync } from 'child_process';

// ─── Parse Args ────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const EP_HASH = args.find(a => !a.startsWith('-'));

if (!EP_HASH) {
  console.error('Usage: node scripts/record.mjs <episode_hash> [--draft] [--scenes <from>-<to>] [--with-audio] [--fps <N>]');
  process.exit(1);
}

const isDraft = args.includes('--draft');
const withAudio = args.includes('--with-audio');

let sceneFrom = null;
let sceneTo = null;
const scenesIdx = args.indexOf('--scenes');
if (scenesIdx !== -1 && args[scenesIdx + 1]) {
  const match = args[scenesIdx + 1].match(/^(\d+)-(\d+)$/);
  if (match) {
    sceneFrom = parseInt(match[1], 10);
    sceneTo = parseInt(match[2], 10);
  } else {
    console.error('Invalid --scenes format. Use: --scenes 5-10');
    process.exit(1);
  }
}

const fpsIdx = args.indexOf('--fps');
const fps = fpsIdx !== -1 ? parseInt(args[fpsIdx + 1], 10) : (isDraft ? 30 : 60);

const PORT = 5173;
const MODE = isDraft ? 'draft' : 'final';
const OUTPUT_FILE = resolve(`./${EP_HASH}-${MODE}.mp4`);
const TMP_DIR = resolve(`./.record-tmp-${EP_HASH}-${Date.now()}`);

console.log('');
console.log('  ┌─────────────────────────────────────────┐');
console.log(`  │  RECORD: ${EP_HASH.padEnd(32)}│`);
console.log(`  │  Mode:   ${MODE.padEnd(32)}│`);
console.log(`  │  FPS:    ${String(fps).padEnd(32)}│`);
if (sceneFrom !== null) {
  console.log(`  │  Scenes: ${(sceneFrom + '-' + sceneTo).padEnd(32)}│`);
}
if (withAudio) {
  console.log(`  │  Audio:  yes${' '.repeat(29)}│`);
}
console.log(`  │  Output: ${basename(OUTPUT_FILE).padEnd(32)}│`);
console.log('  └─────────────────────────────────────────┘');
console.log('');

// ─── Dev Server ────────────────────────────────────────────────────────────

const NVM_DIR = process.env.NVM_DIR || join(process.env.HOME, '.nvm');
const NODE20_BIN = (() => {
  try {
    const versions = readdirSync(join(NVM_DIR, 'versions/node'));
    const v = versions
      .filter(d => d.startsWith('v20.'))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .pop();
    return v ? join(NVM_DIR, 'versions/node', v, 'bin') : null;
  } catch {
    return null;
  }
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
  const npxPath = NODE20_BIN ? join(NODE20_BIN, 'npx') : 'npx';
  const envPath = NODE20_BIN ? `${NODE20_BIN}:${process.env.PATH}` : process.env.PATH;

  const server = spawn(npxPath, ['vite', 'dev', '--port', String(PORT)], {
    cwd: resolve('.'),
    env: { ...process.env, PATH: envPath },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const start = Date.now();
  while (Date.now() - start < 30000) {
    if (await isServerRunning()) {
      console.log('Dev server ready');
      return server;
    }
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error('Dev server failed to start within 30s');
}

function checkFfmpeg() {
  try {
    execSync('ffmpeg -version', { stdio: 'pipe' });
  } catch {
    console.error('FFmpeg not found. Install with: brew install ffmpeg');
    process.exit(1);
  }
}

// ─── Audio ─────────────────────────────────────────────────────────────────

function findAudioDir() {
  const audioBase = resolve('./client/public/audio');
  if (!existsSync(audioBase)) return null;

  const dirs = readdirSync(audioBase);
  const exact = dirs.find(d => d === EP_HASH);
  if (exact) return join(audioBase, exact);

  const epNum = EP_HASH.replace(/^ep/, '');
  const prefix = dirs.find(d => d.startsWith(`ep${epNum}-`));
  return prefix ? join(audioBase, prefix) : null;
}

/**
 * Sort scene audio files naturally: scene1, scene2, ..., scene7, scene7b, scene10, scene14c
 * Handles numeric + optional alpha suffix (e.g. scene7b.mp3).
 */
function sortAudioFiles(files) {
  return files
    .filter(f => f.endsWith('.mp3') && /scene\d+/.test(f))
    .sort((a, b) => {
      const parseKey = (name) => {
        const m = name.match(/scene(\d+)([a-z]?)\.mp3$/i);
        if (!m) return [Infinity, ''];
        return [parseInt(m[1], 10), m[2].toLowerCase()];
      };
      const [numA, suffA] = parseKey(a);
      const [numB, suffB] = parseKey(b);
      if (numA !== numB) return numA - numB;
      return suffA.localeCompare(suffB);
    });
}

function findContinuousAudio(audioDir) {
  const fullPath = join(audioDir, 'full.mp3');
  const timestampsPath = join(audioDir, 'timestamps.json');

  if (!existsSync(fullPath) || !existsSync(timestampsPath)) {
    return null;
  }

  try {
    const raw = JSON.parse(readFileSync(timestampsPath, 'utf8'));
    if (!raw?.continuous || !Array.isArray(raw.sceneStartTimes)) {
      return null;
    }

    return {
      fullPath,
      sceneStartTimes: raw.sceneStartTimes.map(Number),
      totalDuration: Number(raw.totalDuration || 0),
    };
  } catch {
    return null;
  }
}

function getMediaDurationSeconds(filePath) {
  try {
    const out = execSync(
      `ffprobe -v error -show_entries format=duration -of default=nk=1:nw=1 "${filePath}"`,
      { stdio: 'pipe' },
    ).toString().trim();
    const duration = Number(out);
    return Number.isFinite(duration) ? duration : 0;
  } catch {
    return 0;
  }
}

function resolvePublicPath(assetPath) {
  const relative = assetPath.startsWith('/') ? assetPath.slice(1) : assetPath;
  return resolve('./client/public', relative);
}

function buildSceneAudioMixCommand({
  scenePaths,
  durationsArray,
  effectiveFrom,
  offsetMs = 0,
  totalDurationMs,
  outputPath,
}) {
  const safeOffsetMs = Math.max(0, offsetMs);
  const durationSec = Math.max(0, totalDurationMs) / 1000;

  const inputArgs = scenePaths
    .map(p => `-i "${resolvePublicPath(p)}"`)
    .join(' ');

  let accumulatedMs = 0;
  const filterParts = [];
  const mixInputs = ['[0:a]'];

  scenePaths.forEach((_, index) => {
    const delayMs = accumulatedMs + safeOffsetMs;
    filterParts.push(`[${index + 1}:a]adelay=${delayMs}|${delayMs}[a${index + 1}]`);
    mixInputs.push(`[a${index + 1}]`);
    accumulatedMs += durationsArray[effectiveFrom + index] ?? 0;
  });

  filterParts.push(`${mixInputs.join('')}amix=inputs=${mixInputs.length}:normalize=0[aout]`);

  return `ffmpeg -y -f lavfi -i "anullsrc=r=44100:cl=stereo:d=${durationSec.toFixed(3)}" ${inputArgs} -filter_complex "${filterParts.join(';')}" -map "[aout]" -c:a libmp3lame -q:a 2 "${outputPath}"`;
}

// ─── Page Helpers ──────────────────────────────────────────────────────────

async function waitForEpisodeInfo(page, timeoutMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const info = await page.evaluate(() => window.__episodeInfo).catch(() => null);
    if (info && info.totalScenes > 0) return info;
    await page.waitForTimeout(300);
  }
  return null;
}

async function waitForEpisodeAudio(page, timeoutMs = 3000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const audio = await page.evaluate(() => window.__episodeAudio ?? null).catch(() => null);
    if (audio) return audio;
    await page.waitForTimeout(100);
  }
  return null;
}

async function waitForControls(page, timeoutMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const has = await page.evaluate(() => !!window.__episodeControls).catch(() => false);
    if (has) return true;
    await page.waitForTimeout(300);
  }
  return false;
}

async function waitForRecordingHarness(page, timeoutMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const has = await page.evaluate(() => !!window.__recordingHarness).catch(() => false);
    if (has) return true;
    await page.waitForTimeout(100);
  }
  return false;
}

// ─── Record ────────────────────────────────────────────────────────────────

async function record() {
  checkFfmpeg();
  const server = await startDevServer();
  mkdirSync(TMP_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  try {
    // ── Step 1: Read episode metadata ────────────────────────────────────
    console.log('Reading episode metadata...');
    const metaCtx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const metaPage = await metaCtx.newPage();
    await metaPage.goto(`http://localhost:${PORT}/#${EP_HASH}`, { waitUntil: 'networkidle' });

    const info = await waitForEpisodeInfo(metaPage);
    if (!info) {
      console.error('Could not read episode info. Is the episode loaded at #' + EP_HASH + '?');
      process.exit(1);
    }

    const episodeAudio = withAudio ? await waitForEpisodeAudio(metaPage) : null;
    const { totalScenes, durationsArray, totalDuration } = info;
    await metaCtx.close();

    const effectiveFrom = sceneFrom ?? 0;
    const effectiveTo = Math.min(sceneTo ?? (totalScenes - 1), totalScenes - 1);
    const scenesToRecord = effectiveTo - effectiveFrom + 1;

    // Exact duration for the requested scene range
    let partialDurationMs = 0;
    for (let i = effectiveFrom; i <= effectiveTo; i++) {
      partialDurationMs += durationsArray[i];
    }

    console.log(`  ${totalScenes} scenes, ${Math.round(totalDuration / 1000)}s total`);
    console.log(`  Recording scenes ${effectiveFrom}-${effectiveTo} (${scenesToRecord} scenes, ~${Math.round(partialDurationMs / 1000)}s)`);

    // ── Step 2: Capture ──────────────────────────────────────────────────
    console.log('\nCapturing...');

    const recordCtx = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      recordVideo: {
        dir: TMP_DIR,
        size: { width: 1920, height: 1080 },
      },
    });

    const captureStart = Date.now();
    const page = await recordCtx.newPage();
    await page.goto(`http://localhost:${PORT}/#${EP_HASH}?record&arm=1`, { waitUntil: 'networkidle' });

    const hasHarness = await waitForRecordingHarness(page);
    if (!hasHarness) {
      console.error('Recording harness failed to initialize');
      process.exit(1);
    }

    // Use a deterministic timer based on exact scene durations rather than
    // polling currentScene. The stop timer is scheduled in-page from the same
    // start moment that mounts the episode, which keeps it aligned with the
    // player's own scene timers.
    const isPartial = sceneTo !== null;
    const waitDurationMs = isPartial ? partialDurationMs : totalDuration;
    // Safety margin: 5s extra to account for JS timer drift, then we hard-stop
    const safetyMs = 5000;

    await page.evaluate((startScene) => {
      window.__recordingHarness.start(startScene);
    }, effectiveFrom);

    const recInfo = await waitForEpisodeInfo(page);
    const hasControls = await waitForControls(page);
    if (!recInfo || !hasControls) {
      console.error('Episode failed to mount after recording start');
      process.exit(1);
    }

    await page.evaluate(
      () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve(true)))),
    );

    const playbackStart = Date.now();
    await page.evaluate((stopAfterMs) => {
      window.__recordStopFired = false;
      window.__episodeControls?.play?.();
      window.setTimeout(() => {
        window.__episodeControls?.pause?.();
        window.__recordStopFired = true;
      }, stopAfterMs);
    }, waitDurationMs);

    console.log('  Playing...');
    const trimLeadInSec = Math.max(0, playbackStart - captureStart) / 1000;

    // For full episodes, also watch hasEnded as a backup signal
    let done = false;
    while (!done) {
      await page.waitForTimeout(100);
      const elapsed = Date.now() - playbackStart;
      const elapsedSec = Math.round(elapsed / 1000);
      process.stdout.write(`\r  ● Recording... ${elapsedSec}s / ~${Math.round(waitDurationMs / 1000)}s `);

      const state = await page.evaluate(() => ({
        stopFired: !!window.__recordStopFired,
        info: window.__episodeInfo ?? null,
      })).catch(() => ({ stopFired: false, info: null }));

      // Primary stop: in-page timer already paused on the correct boundary
      if (state.stopFired) {
        process.stdout.write(`\r  ● Recording... ${elapsedSec}s — complete\n`);
        done = true;
        break;
      }

      // Backup stop for full episodes: hasEnded signal from the player
      if (!isPartial && state.info?.hasEnded) {
          process.stdout.write(`\r  ● Recording... ${elapsedSec}s — episode ended\n`);
          done = true;
          break;
      }

      // Hard timeout safety
      if (elapsed > waitDurationMs + safetyMs) {
        await page.evaluate(() => window.__episodeControls?.pause?.()).catch(() => {});
        console.log(`\n  Safety timeout — stopping`);
        done = true;
        break;
      }
    }

    // Brief hold so Playwright's video encoder flushes the last frames
    await page.waitForTimeout(500);

    // ── Step 3: Save and encode ──────────────────────────────────────────
    console.log('  Stopping capture...');
    const videoObj = page.video();
    await page.close();
    const rawPath = videoObj ? await videoObj.path() : null;
    await recordCtx.close();

    let videoFile;
    if (rawPath && existsSync(rawPath)) {
      videoFile = rawPath;
    } else {
      const webmFiles = readdirSync(TMP_DIR).filter(f => f.endsWith('.webm'));
      if (webmFiles.length === 0) {
        console.error('No video file captured');
        process.exit(1);
      }
      const sorted = webmFiles
        .map(f => ({ name: f, mtime: statSync(join(TMP_DIR, f)).mtimeMs }))
        .sort((a, b) => b.mtime - a.mtime);
      videoFile = join(TMP_DIR, sorted[0].name);
    }

    console.log(`  Raw: ${basename(videoFile)}`);
    console.log(`Encoding to MP4 (${MODE})...`);

    const ffmpegEncode = isDraft
      ? `-c:v libx264 -preset ultrafast -crf 28 -r ${fps} -pix_fmt yuv420p`
      : `-c:v libx264 -preset medium -crf 18 -r ${fps} -pix_fmt yuv420p`;

    try {
      execSync(
        `ffmpeg -y -i "${videoFile}" -ss ${trimLeadInSec.toFixed(3)} ${ffmpegEncode} "${OUTPUT_FILE}"`,
        { stdio: 'pipe' },
      );
      console.log(`  ✓ Video: ${OUTPUT_FILE}`);
    } catch (err) {
      console.error('FFmpeg failed:', err.stderr?.toString().slice(0, 500));
      process.exit(1);
    }

    // ── Step 4: Audio mux (optional) ─────────────────────────────────────
    if (withAudio) {
      const audioDir = findAudioDir();
      if (!audioDir && !episodeAudio) {
        console.log('  ⚠ No audio found — skipping mux');
      } else {
        console.log(`Muxing audio...`);

        try {
          let audioInputPath = null;

          if (episodeAudio?.kind === 'continuous') {
            const fullPath = resolvePublicPath(episodeAudio.src);
            if (!existsSync(fullPath)) {
              throw new Error('Continuous audio source not found');
            }

            if (sceneFrom !== null) {
              const startSec = Number(episodeAudio.sceneStartTimes[effectiveFrom] ?? 0);
              const endSec = Number(
                episodeAudio.sceneStartTimes[effectiveTo + 1]
                ?? getMediaDurationSeconds(fullPath),
              );
              const trimSec = Math.max(0, endSec - startSec);
              const trimmedAudio = join(TMP_DIR, 'trimmed.mp3');

              execSync(
                `ffmpeg -y -ss ${startSec.toFixed(3)} -t ${trimSec.toFixed(3)} -i "${fullPath}" -c:a libmp3lame -q:a 2 "${trimmedAudio}"`,
                { stdio: 'pipe' },
              );
              audioInputPath = trimmedAudio;
            } else {
              audioInputPath = fullPath;
            }
          } else if (episodeAudio?.kind === 'scenes') {
            const scenePaths = sceneFrom !== null
              ? episodeAudio.scenePaths.slice(effectiveFrom, effectiveTo + 1)
              : episodeAudio.scenePaths;

            if (scenePaths.length === 0) {
              console.log('  ⚠ No matching audio files — skipping mux');
            } else {
              const combinedAudio = join(TMP_DIR, 'combined.mp3');
              execSync(
                buildSceneAudioMixCommand({
                  scenePaths,
                  durationsArray,
                  effectiveFrom,
                  offsetMs: episodeAudio.offsetMs ?? 0,
                  totalDurationMs: waitDurationMs,
                  outputPath: combinedAudio,
                }),
                { stdio: 'pipe' },
              );
              audioInputPath = combinedAudio;
            }
          } else {
            const continuousAudio = audioDir ? findContinuousAudio(audioDir) : null;

            if (continuousAudio) {
              if (sceneFrom !== null) {
                const startSec = continuousAudio.sceneStartTimes[effectiveFrom] ?? 0;
                const endSec = continuousAudio.sceneStartTimes[effectiveTo + 1]
                  ?? continuousAudio.totalDuration
                  ?? getMediaDurationSeconds(continuousAudio.fullPath);
                const trimSec = Math.max(0, endSec - startSec);
                const trimmedAudio = join(TMP_DIR, 'trimmed.mp3');

                execSync(
                  `ffmpeg -y -ss ${startSec.toFixed(3)} -t ${trimSec.toFixed(3)} -i "${continuousAudio.fullPath}" -c:a libmp3lame -q:a 2 "${trimmedAudio}"`,
                  { stdio: 'pipe' },
                );
                audioInputPath = trimmedAudio;
              } else {
                audioInputPath = continuousAudio.fullPath;
              }
            } else if (!audioDir) {
              console.log('  ⚠ No audio found — skipping mux');
            } else {
            const allMp3s = sortAudioFiles(readdirSync(audioDir));

            // Use positional index: the Nth file in sorted order = scene index N.
            // This correctly handles suffixed names (scene7.mp3=idx 6, scene7b.mp3=idx 7).
            let mp3Files;
            if (sceneFrom !== null) {
              mp3Files = allMp3s.slice(effectiveFrom, effectiveTo + 1);
            } else {
              mp3Files = allMp3s;
            }

            if (mp3Files.length === 0) {
              console.log('  ⚠ No matching audio files — skipping mux');
            } else {
              const concatList = join(TMP_DIR, 'audio-list.txt');
              writeFileSync(concatList, mp3Files.map(f => `file '${join(audioDir, f)}'`).join('\n'));

              const combinedAudio = join(TMP_DIR, 'combined.mp3');
              execSync(`ffmpeg -y -f concat -safe 0 -i "${concatList}" -c:a libmp3lame -q:a 2 "${combinedAudio}"`, { stdio: 'pipe' });
              audioInputPath = combinedAudio;
            }
            }
          }

          if (audioInputPath) {
            const audioOut = OUTPUT_FILE.replace('.mp4', '-audio.mp4');
            execSync(`ffmpeg -y -i "${OUTPUT_FILE}" -i "${audioInputPath}" -c:v copy -c:a aac -b:a 320k -shortest "${audioOut}"`, { stdio: 'pipe' });
            rmSync(OUTPUT_FILE);
            execSync(`mv "${audioOut}" "${OUTPUT_FILE}"`);
            console.log(`  ✓ Audio muxed`);
          }
        } catch {
          console.log('  ⚠ Audio mux failed — video saved without audio');
        }
      }
    }

    // Cleanup
    rmSync(TMP_DIR, { recursive: true, force: true });

    console.log('');
    console.log(`  ✓ Done! ${OUTPUT_FILE}`);
    console.log('');

  } finally {
    await browser.close();
    if (server) server.kill();
  }
}

record().catch(err => {
  console.error('Recording failed:', err);
  if (existsSync(TMP_DIR)) rmSync(TMP_DIR, { recursive: true, force: true });
  process.exit(1);
});
