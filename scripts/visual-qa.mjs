#!/usr/bin/env node
/**
 * visual-qa.mjs — Automated visual QA for episodes
 *
 * Opens an episode in Playwright, steps through every scene, and checks
 * that content is actually visible on screen using getBoundingClientRect().
 * No LLM math — deterministic, pixel-accurate verification.
 *
 * Usage:
 *   node scripts/visual-qa.mjs <episode_hash> [output_dir]
 *
 * Examples:
 *   node scripts/visual-qa.mjs ep11                    # quick check, prints report
 *   node scripts/visual-qa.mjs ep11 ./visual-qa-out    # save screenshots + report
 *
 * Issue severity:
 *   FAIL  — content that should be visible is off-screen or mostly clipped
 *   WARN  — minor clipping or low content coverage
 *   INFO  — elements from other zones off-screen (expected during camera pans)
 *
 * Exit codes:
 *   0 — no FAIL issues
 *   1 — FAIL issues found
 *   2 — script error
 */

import { chromium } from 'playwright';
import { resolve, join } from 'path';
import { mkdirSync, writeFileSync, readdirSync } from 'fs';
import { spawn } from 'child_process';

// ─── Config ─────────────────────────────────────────────────────────────

const EP_HASH = process.argv[2];
const OUTPUT_DIR = resolve(process.argv[3] || `./visual-qa-${EP_HASH}`);
const PORT = 5173;
const BASE_URL = `http://localhost:${PORT}`;
const EP_URL = `${BASE_URL}/#${EP_HASH}`;
const VIEWPORT = { width: 1920, height: 1080 };
const SETTLE_MS = 3000; // wait for camera spring to settle

// Distance thresholds (in px) for classifying off-screen severity
const NEAR_MISS_PX = 300;  // within 300px = likely a real positioning bug
const FAR_OFF_PX = 800;    // > 800px = probably another zone (expected)

if (!EP_HASH) {
  console.error('Usage: node scripts/visual-qa.mjs <episode_hash> [output_dir]');
  process.exit(2);
}

mkdirSync(OUTPUT_DIR, { recursive: true });

// ─── Dev Server ─────────────────────────────────────────────────────────

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
  try { return (await fetch(BASE_URL)).ok; } catch { return false; }
}

async function startDevServer() {
  if (await isServerRunning()) {
    console.log(`  Dev server already running on port ${PORT}`);
    return null;
  }
  console.log('  Starting dev server...');
  const server = spawn(join(NODE20_BIN, 'npx'), ['vite', 'dev', '--port', String(PORT)], {
    cwd: resolve('.'),
    env: { ...process.env, PATH: `${NODE20_BIN}:${process.env.PATH}` },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const start = Date.now();
  while (Date.now() - start < 30000) {
    try { if ((await fetch(BASE_URL)).ok) { console.log('  Dev server ready'); return server; } } catch {}
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error('Dev server failed to start within 30s');
}

// ─── Element Analysis (runs in browser) ─────────────────────────────────

function analyzeScene({ viewportW, viewportH, nearMissPx, farOffPx }) {
  const results = {
    visibleElements: [],    // on screen
    nearMissElements: [],   // off by < nearMissPx — REAL BUGS
    clippedElements: [],    // partially clipped with >40% hidden
    farOffElements: [],     // off by > farOffPx — probably other zone (INFO)
    contentCoverage: 0,
    error: null,
  };

  const videoRoot = document.querySelector('[data-video]');
  if (!videoRoot) { results.error = 'No [data-video] container found'; return results; }

  // Find content elements (not containers)
  const seen = new Set();
  const elements = [];

  // Priority: leaf elements first
  for (const el of videoRoot.querySelectorAll(
    'h1, h2, h3, h4, h5, h6, p, span, img, canvas, ' +
    'circle, rect, path, line, polyline, polygon, text, ' +
    '[data-visual]'
  )) {
    if (!seen.has(el)) { seen.add(el); elements.push(el); }
  }

  // SVGs as a unit (don't double-count children)
  for (const svg of videoRoot.querySelectorAll('svg')) {
    if (!seen.has(svg)) { seen.add(svg); elements.push(svg); }
  }

  // Divs with direct text or visual properties
  for (const el of videoRoot.querySelectorAll('div')) {
    if (seen.has(el)) continue;
    const hasDirectText = [...el.childNodes].some(
      n => n.nodeType === 3 && n.textContent.trim().length > 0
    );
    const style = getComputedStyle(el);
    const hasBg = style.backgroundColor !== 'rgba(0, 0, 0, 0)' &&
                  style.backgroundColor !== 'transparent';
    const hasBorder = parseFloat(style.borderWidth) > 0 && style.borderStyle !== 'none';
    if (hasDirectText || hasBg || hasBorder) {
      seen.add(el); elements.push(el);
    }
  }

  // Coverage tracking
  const coveredPixels = new Set();
  const SAMPLE_STEP = 20;

  for (const el of elements) {
    const style = getComputedStyle(el);

    // Skip invisible
    if (style.display === 'none' || style.visibility === 'hidden') continue;

    // Check effective opacity (walk up to 3 parents)
    let effectiveOpacity = parseFloat(style.opacity);
    let parent = el.parentElement;
    for (let depth = 0; depth < 3 && parent; depth++) {
      effectiveOpacity *= parseFloat(getComputedStyle(parent).opacity);
      parent = parent.parentElement;
    }
    if (effectiveOpacity < 0.03) continue;

    const rect = el.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) continue;

    // Skip DevControls (fixed bottom bar)
    if (rect.top > viewportH - 60 && rect.height < 50) continue;

    const text = (el.textContent || '').trim().slice(0, 80);

    // Skip trivial elements (no text, small, no visual weight)
    const isSignificant = text.length > 2 || rect.width > 40 || rect.height > 40;
    if (!isSignificant) continue;

    const info = {
      tag: el.tagName.toLowerCase(),
      text: text.slice(0, 60),
      rect: {
        left: Math.round(rect.left), top: Math.round(rect.top),
        right: Math.round(rect.right), bottom: Math.round(rect.bottom),
        width: Math.round(rect.width), height: Math.round(rect.height),
      },
    };

    // Calculate distance from viewport
    const distLeft = rect.right < 0 ? Math.abs(rect.right) : 0;
    const distRight = rect.left > viewportW ? rect.left - viewportW : 0;
    const distTop = rect.bottom < 0 ? Math.abs(rect.bottom) : 0;
    const distBottom = rect.top > viewportH ? rect.top - viewportH : 0;
    const maxDist = Math.max(distLeft, distRight, distTop, distBottom);

    const fullyOffScreen = maxDist > 0;
    const isNearMiss = fullyOffScreen && maxDist <= nearMissPx;
    const isFarOff = fullyOffScreen && maxDist > farOffPx;

    if (fullyOffScreen) {
      info.distanceFromViewport = Math.round(maxDist);
      info.direction =
        distLeft > 0 ? 'left' :
        distRight > 0 ? 'right' :
        distTop > 0 ? 'above' : 'below';

      if (isNearMiss) {
        results.nearMissElements.push(info);
      } else if (isFarOff) {
        results.farOffElements.push(info);
      } else {
        // Medium distance — still flag as near miss (better safe than sorry)
        results.nearMissElements.push(info);
      }
    } else {
      // On screen — check if significantly clipped
      const visibleLeft = Math.max(0, rect.left);
      const visibleTop = Math.max(0, rect.top);
      const visibleRight = Math.min(viewportW, rect.right);
      const visibleBottom = Math.min(viewportH, rect.bottom);
      const visibleArea = Math.max(0, visibleRight - visibleLeft) * Math.max(0, visibleBottom - visibleTop);
      const totalArea = rect.width * rect.height;
      const visiblePct = totalArea > 0 ? Math.round((visibleArea / totalArea) * 100) : 100;

      if (visiblePct < 60 && isSignificant) {
        results.clippedElements.push({ ...info, visiblePct });
      }

      results.visibleElements.push(info);

      // Coverage sampling
      const startX = Math.max(0, Math.floor(rect.left));
      const startY = Math.max(0, Math.floor(rect.top));
      const endX = Math.min(viewportW, Math.ceil(rect.right));
      const endY = Math.min(viewportH, Math.ceil(rect.bottom));
      for (let x = startX; x < endX; x += SAMPLE_STEP) {
        for (let y = startY; y < endY; y += SAMPLE_STEP) {
          coveredPixels.add(`${Math.floor(x / SAMPLE_STEP)},${Math.floor(y / SAMPLE_STEP)}`);
        }
      }
    }
  }

  const totalSamples = Math.floor(viewportW / SAMPLE_STEP) * Math.floor(viewportH / SAMPLE_STEP);
  results.contentCoverage = totalSamples > 0
    ? Math.round((coveredPixels.size / totalSamples) * 100) : 0;

  return results;
}

// ─── Scene Counter ──────────────────────────────────────────────────────

async function getTotalScenes(page) {
  const text = await page.evaluate(() => {
    for (const span of document.querySelectorAll('span')) {
      const m = span.textContent?.match(/^(\d+)\/(\d+)$/);
      if (m) return span.textContent;
    }
    return null;
  });
  if (!text) throw new Error('Could not find scene counter in DevControls');
  return parseInt(text.match(/^(\d+)\/(\d+)$/)[2], 10);
}

// ─── Helpers ────────────────────────────────────────────────────────────

function groupByRegion(elements) {
  // Group nearby off-screen elements to reduce noise
  // e.g. "72 PaddingAssembler cells" instead of listing each one
  const groups = [];
  const used = new Set();

  for (let i = 0; i < elements.length; i++) {
    if (used.has(i)) continue;
    const el = elements[i];
    const group = { representative: el, count: 1, elements: [el] };

    // Find nearby siblings (within 200px and similar direction)
    for (let j = i + 1; j < elements.length; j++) {
      if (used.has(j)) continue;
      const other = elements[j];
      if (other.direction === el.direction &&
          Math.abs((other.distanceFromViewport || 0) - (el.distanceFromViewport || 0)) < 500) {
        group.elements.push(other);
        group.count++;
        used.add(j);
      }
    }
    used.add(i);
    groups.push(group);
  }

  return groups;
}

function formatIssue(el, prefix) {
  const dir = el.direction ? ` (${el.distanceFromViewport}px ${el.direction})` : '';
  const clip = el.visiblePct != null ? ` (${el.visiblePct}% visible)` : '';
  return `${prefix}: <${el.tag}> "${el.text}"${dir}${clip} at (${el.rect.left}, ${el.rect.top})`;
}

// ─── Main ───────────────────────────────────────────────────────────────

async function runVisualQA() {
  console.log(`\n╔══════════════════════════════════════════════════╗`);
  console.log(`║  Visual QA — ${EP_HASH.padEnd(35)}║`);
  console.log(`╚══════════════════════════════════════════════════╝\n`);

  const server = await startDevServer();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 });
  const page = await context.newPage();

  const report = {
    episode: EP_HASH,
    viewport: VIEWPORT,
    timestamp: new Date().toISOString(),
    scenes: [],
    summary: { total: 0, pass: 0, warn: 0, fail: 0 },
  };

  try {
    console.log(`  Navigating to ${EP_URL}`);
    await page.goto(EP_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Pause playback
    await page.keyboard.press('Space');
    await page.waitForTimeout(300);

    const totalScenes = await getTotalScenes(page);
    report.summary.total = totalScenes;
    console.log(`  Found ${totalScenes} scenes\n`);

    // Reset to scene 0
    for (let i = 0; i < totalScenes; i++) {
      await page.keyboard.press('ArrowLeft');
      await page.waitForTimeout(50);
    }
    await page.waitForTimeout(SETTLE_MS);

    for (let scene = 0; scene < totalScenes; scene++) {
      await page.waitForTimeout(scene === 0 ? 500 : SETTLE_MS);

      // Screenshot
      const screenshotFile = `scene-${String(scene).padStart(2, '0')}.png`;
      await page.screenshot({ path: join(OUTPUT_DIR, screenshotFile), type: 'png' });

      // Analyze
      const analysis = await page.evaluate(analyzeScene, {
        viewportW: VIEWPORT.width, viewportH: VIEWPORT.height,
        nearMissPx: NEAR_MISS_PX, farOffPx: FAR_OFF_PX,
      });

      // ── Determine Status ──
      let status = 'PASS';
      const issues = [];

      if (analysis.error) {
        status = 'FAIL';
        issues.push({ severity: 'FAIL', msg: analysis.error });
      }

      // FAIL: near-miss off-screen elements (real positioning bugs)
      if (analysis.nearMissElements.length > 0) {
        status = 'FAIL';
        const groups = groupByRegion(analysis.nearMissElements);
        for (const g of groups) {
          if (g.count > 3) {
            issues.push({
              severity: 'FAIL',
              msg: `${g.count} elements off-screen ${g.representative.direction} (${g.representative.distanceFromViewport}px away), e.g. "${g.representative.text}"`,
            });
          } else {
            for (const el of g.elements) {
              issues.push({ severity: 'FAIL', msg: formatIssue(el, 'OFF-SCREEN') });
            }
          }
        }
      }

      // FAIL: significantly clipped elements
      if (analysis.clippedElements.length > 0) {
        if (status !== 'FAIL') status = 'WARN';
        for (const el of analysis.clippedElements) {
          issues.push({ severity: 'WARN', msg: formatIssue(el, 'CLIPPED') });
        }
      }

      // WARN: no visible content
      if (analysis.visibleElements.length === 0) {
        status = 'FAIL';
        issues.push({ severity: 'FAIL', msg: 'EMPTY: no visible content elements on screen' });
      }

      // WARN: very low coverage
      if (analysis.contentCoverage < 3 && analysis.visibleElements.length < 3) {
        if (status === 'PASS') status = 'WARN';
        issues.push({ severity: 'WARN', msg: `LOW COVERAGE: ${analysis.contentCoverage}% of viewport` });
      }

      // INFO: far-off elements (expected zone transitions, don't affect status)
      const farOffCount = analysis.farOffElements.length;

      // ── Log ──
      const icon = { PASS: '✓', WARN: '⚠', FAIL: '✗' }[status];
      const color = { PASS: '\x1b[32m', WARN: '\x1b[33m', FAIL: '\x1b[31m' }[status];
      const reset = '\x1b[0m';
      const infoStr = farOffCount > 0 ? ` (${farOffCount} in other zones)` : '';

      console.log(`  ${color}${icon}${reset} Scene ${String(scene).padStart(2)}: ${analysis.visibleElements.length} visible, ${analysis.nearMissElements.length} near-miss, ${analysis.contentCoverage}% coverage${infoStr}`);

      for (const issue of issues) {
        const c = issue.severity === 'FAIL' ? '\x1b[31m' : '\x1b[33m';
        console.log(`      ${c}→ ${issue.msg}${reset}`);
      }

      // Store
      report.scenes.push({
        scene, status, screenshot: screenshotFile,
        issues: issues.map(i => `[${i.severity}] ${i.msg}`),
        stats: {
          visible: analysis.visibleElements.length,
          nearMiss: analysis.nearMissElements.length,
          clipped: analysis.clippedElements.length,
          farOff: farOffCount,
          coverage: analysis.contentCoverage,
        },
      });

      if (status === 'PASS') report.summary.pass++;
      else if (status === 'WARN') report.summary.warn++;
      else report.summary.fail++;

      // Next scene
      if (scene < totalScenes - 1) await page.keyboard.press('ArrowRight');
    }

    // ── Summary ──
    console.log(`\n  ─────────────────────────────────`);
    console.log(`  Total: ${report.summary.total} scenes`);
    console.log(`  \x1b[32m✓ Pass: ${report.summary.pass}\x1b[0m`);
    if (report.summary.warn > 0) console.log(`  \x1b[33m⚠ Warn: ${report.summary.warn}\x1b[0m`);
    if (report.summary.fail > 0) console.log(`  \x1b[31m✗ Fail: ${report.summary.fail}\x1b[0m`);
    console.log(`  ─────────────────────────────────`);

    // ── Write JSON Report ──
    writeFileSync(join(OUTPUT_DIR, 'report.json'), JSON.stringify(report, null, 2));

    // ── Write Markdown Report ──
    let md = `# Visual QA Report — ${EP_HASH}\n\n`;
    md += `**Date:** ${report.timestamp}  \n`;
    md += `**Viewport:** ${VIEWPORT.width}×${VIEWPORT.height}  \n`;
    md += `**Result:** ${report.summary.fail} failures, ${report.summary.warn} warnings, ${report.summary.pass} pass\n\n`;

    // Failed scenes first
    const failed = report.scenes.filter(s => s.status === 'FAIL');
    const warned = report.scenes.filter(s => s.status === 'WARN');

    if (failed.length > 0) {
      md += `## Failures\n\n`;
      for (const s of failed) {
        md += `### Scene ${s.scene}\n\n`;
        md += `![Scene ${s.scene}](${s.screenshot})\n\n`;
        md += `| Metric | Value |\n|---|---|\n`;
        md += `| Visible | ${s.stats.visible} | Near-miss | ${s.stats.nearMiss} | Clipped | ${s.stats.clipped} | Coverage | ${s.stats.coverage}% |\n\n`;
        for (const issue of s.issues) md += `- ${issue}\n`;
        md += `\n`;
      }
    }

    if (warned.length > 0) {
      md += `## Warnings\n\n`;
      for (const s of warned) {
        md += `### Scene ${s.scene}\n\n`;
        md += `![Scene ${s.scene}](${s.screenshot})\n\n`;
        for (const issue of s.issues) md += `- ${issue}\n`;
        md += `\n`;
      }
    }

    md += `## All Scenes\n\n`;
    md += `| Scene | Status | Visible | Near-miss | Coverage |\n|---|---|---|---|---|\n`;
    for (const s of report.scenes) {
      const icon = { PASS: 'PASS', WARN: 'WARN', FAIL: 'FAIL' }[s.status];
      md += `| ${s.scene} | ${icon} | ${s.stats.visible} | ${s.stats.nearMiss} | ${s.stats.coverage}% |\n`;
    }

    writeFileSync(join(OUTPUT_DIR, 'report.md'), md);

    console.log(`\n  Report: ${OUTPUT_DIR}/report.md`);
    console.log(`  Screenshots: ${OUTPUT_DIR}/\n`);

    process.exit(report.summary.fail > 0 ? 1 : 0);

  } finally {
    await browser.close();
    if (server) { server.kill(); console.log('  Dev server stopped'); }
  }
}

runVisualQA().catch(err => {
  console.error('\nVisual QA crashed:', err);
  process.exit(2);
});
