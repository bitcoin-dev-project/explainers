/**
 * EP6: The Duplicate Transaction Bug — Voiceover Generation
 *
 * Generates ONE continuous voiceover from all scene texts,
 * uses ElevenLabs with-timestamps for alignment data,
 * splits into individual scene files, and outputs paste-ready
 * SCENE_DURATIONS / SCENE_START_TIMES for VideoTemplate.tsx.
 *
 * Usage:
 *   node scripts/generate-voiceover-ep6.mjs            # generate (skip if full.mp3 exists)
 *   node scripts/generate-voiceover-ep6.mjs --force     # regenerate even if exists
 *
 * Requires: ELEVENLABS_API_KEY in .env, ffmpeg + ffprobe installed
 */

import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

// Load .env file
try {
  const env = readFileSync('.env', 'utf8');
  for (const line of env.split('\n')) {
    const [key, ...val] = line.split('=');
    if (key && val.length) process.env[key.trim()] = val.join('=').trim();
  }
} catch {}

const API_KEY = process.env.ELEVENLABS_API_KEY || 'YOUR_API_KEY_HERE';
const VOICE_ID = 'InRyolULHTXjegISsXuJ';
const FORCE = process.argv.includes('--force');

const OUTPUT_DIR = './client/public/audio/ep6-duplicate-txid';
mkdirSync(OUTPUT_DIR, { recursive: true });

// ─── Scene texts (ONE continuous voiceover) ──────────────────────
// Scenes with `pauseAfter: true` get a longer separator ("...\n\n")
// to let concepts land before the next scene starts.

const SCENES = [
  {
    file: 'scene1.mp3',
    text: `Bitcoin's identity crisis — a duplicate transaction bug that took fifteen years to truly fix.`,
    pauseAfter: true,
  },
  {
    file: 'scene2.mp3',
    text: `Every Bitcoin transaction gets a fingerprint — a unique I.D. called the txid. It's how the network tells one transaction apart from every other.`,
  },
  {
    file: 'scene3.mp3',
    text: `The txid is just a hash of the transaction's raw bytes. Take the data, feed it through sha two fifty six twice, and out comes the fingerprint. Change even one byte — you get a completely different I.D.`,
  },
  {
    file: 'scene4.mp3',
    text: `But here's the thing. If two transactions have the exact same bytes, they produce the exact same hash. For regular transactions, this can't happen — each one references unique inputs, so the bytes are always different. But there's one exception.`,
    pauseAfter: true,
  },
  {
    file: 'scene5.mp3',
    text: `The coinbase transaction. It's the first transaction in every block — the one that creates new coins. And it's special: there are no inputs to reference. The miner builds the entire thing from scratch. Coins from nothing.`,
  },
  {
    file: 'scene6.mp3',
    text: `The miner controls every single field. The script sig? Anything they want. The output address? Their choice. And notice that n-lock-time field at the bottom — it's always zero. Nobody ever used it. Remember that.`,
    pauseAfter: true,
  },
  {
    file: 'scene7.mp3',
    text: `So what happens if the same miner builds the exact same coinbase in two different blocks? Same script sig. Same output. Same everything. Two transactions with identical bytes.`,
  },
  {
    file: 'scene8.mp3',
    text: `Identical bytes. Identical hash. Identical txid. Two different transactions in two different blocks — but the system thinks they're the same thing.`,
  },
  {
    file: 'scene9.mp3',
    text: `And that's where it all breaks down. Bitcoin's UTXO database — the record of who owns what — is keyed by txid. One slot per I.D. When the second coinbase arrives with the same txid, it overwrites the first. The original fifty B.T.C. just... vanishes from the ledger. Gone.`,
    pauseAfter: true,
  },
  {
    file: 'scene10.mp3',
    text: `This isn't theoretical. In November twenty ten, it happened twice. Blocks ninety-one seven twenty-two and ninety-one eight eighty produced identical coinbases. So did blocks ninety-one eight twelve and ninety-one eight forty-two. A hundred bitcoin, permanently erased from the supply.`,
    pauseAfter: true,
  },
  {
    file: 'scene11.mp3',
    text: `The first fix came in twenty twelve. bip thirty said: before writing to the UTXO database, check if that txid already exists. If it does, reject the block. Simple and correct — but slow. It meant scanning the entire UTXO set on every single block.`,
  },
  {
    file: 'scene12.mp3',
    text: `So in twenty thirteen, bip thirty four took a smarter approach. It required miners to encode the block height at the start of the script sig. Different block, different height, different bytes, different txid. Duplicates become structurally impossible. The expensive bip thirty check? Removed.`,
    pauseAfter: true,
  },
  {
    file: 'scene13.mp3',
    text: `Problem solved. Or so everyone thought. The duplicate checks were removed from Bitcoin Core in twenty fifteen. The community moved on.`,
    pauseAfter: true,
  },
  {
    file: 'scene14.mp3',
    text: `But in twenty eighteen, someone took a closer look. Block one sixty-four thousand three hundred eighty-four — mined back in January twenty twelve, before bip thirty four even existed. Its script sig bytes accidentally look like a valid bip thirty four height commitment — for block one million nine hundred eighty-three thousand seven hundred two. That block arrives around January twenty forty-six. At that point, a miner could craft an identical coinbase and produce a duplicate txid all over again.`,
    pauseAfter: true,
  },
  {
    file: 'scene15.mp3',
    text: `The doppelgänger was back. Not today, not next year. But in twenty years. A ticking time bomb hiding in an old block, waiting patiently.`,
  },
  {
    file: 'scene16.mp3',
    text: `bip fifty-four, the real fix. Instead of relying on what miners put in the script sig, it repurposes the n-lock-time field — the one that was always zero, that nobody ever used. Set it to the block height minus one. Every old coinbase has n-lock-time zero. Every new coinbase has n-lock-time equal to its height. They can never be byte-identical again.`,
    pauseAfter: true,
  },
  {
    file: 'scene17.mp3',
    text: `One field. That's all it took. A field that sat dormant in every coinbase transaction for fifteen years. Doing absolutely nothing. The answer was hiding in plain sight the whole time.`,
    pauseAfter: true,
  },
  {
    file: 'scene18.mp3',
    text: `Twenty ten: the bug. Twenty twelve: the band-aid. Twenty thirteen: the permanent fix. Twenty fifteen: checks removed. Twenty eighteen: the edge case. Twenty twenty-five: the real fix. One bug, three attempts, fifteen years.`,
  },
  {
    file: 'scene19.mp3',
    text: `Follow at bitcoin devs for more. Next up: the timewarp attack.`,
  },
];

// ─── Step 1: Build ONE continuous narration ─────────────────────
console.log('Step 1: Building continuous narration...\n');

const SHORT_SEP = '\n\n';           // ~0.3-0.5s natural pause
const LONG_SEP = '\n\n...\n\n';    // ~0.8-1.2s natural pause
const sceneTextOffsets = [];
let fullText = '';

for (let i = 0; i < SCENES.length; i++) {
  sceneTextOffsets.push(fullText.length);
  fullText += SCENES[i].text;
  if (i < SCENES.length - 1) {
    fullText += SCENES[i].pauseAfter ? LONG_SEP : SHORT_SEP;
  }
}

console.log(`  Total: ${fullText.length} characters, ${SCENES.length} scenes`);
console.log(`  Word count: ${fullText.split(/\s+/).length} words\n`);

// ─── Step 2: Generate ONE continuous voiceover ──────────────────
const fullPath = `${OUTPUT_DIR}/full.mp3`;

if (!FORCE && existsSync(fullPath)) {
  console.log('  ⊘ full.mp3 exists (use --force to regenerate)\n');
} else {
  let audioBuffer = null;
  let alignment = null;

  // Try with-timestamps endpoint first (gives us character-level timing)
  console.log('Step 2: Generating continuous voiceover (with-timestamps)...\n');
  try {
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/with-timestamps`;
    console.log('  ⟳ Calling ElevenLabs with-timestamps endpoint...');

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: fullText,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.6,
          similarity_boost: 0.8,
          style: 0.3,
        },
        speed: 1.15,
      }),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    }

    const responseText = await res.text();
    const audioChunks = [];
    const allChars = [];
    const allStarts = [];
    const allEnds = [];

    try {
      const data = JSON.parse(responseText);
      audioChunks.push(Buffer.from(data.audio_base64, 'base64'));
      if (data.alignment) {
        allChars.push(...(data.alignment.characters || []));
        allStarts.push(...(data.alignment.character_start_times_seconds || []));
        allEnds.push(...(data.alignment.character_end_times_seconds || []));
      }
    } catch {
      for (const line of responseText.split('\n')) {
        if (!line.trim()) continue;
        try {
          const data = JSON.parse(line);
          if (data.audio_base64) {
            audioChunks.push(Buffer.from(data.audio_base64, 'base64'));
          }
          if (data.alignment) {
            allChars.push(...(data.alignment.characters || []));
            allStarts.push(...(data.alignment.character_start_times_seconds || []));
            allEnds.push(...(data.alignment.character_end_times_seconds || []));
          }
        } catch {}
      }
    }

    audioBuffer = Buffer.concat(audioChunks);
    if (allChars.length > 0) {
      alignment = { characters: allChars, starts: allStarts, ends: allEnds };
      console.log(`  ✓ Got alignment data (${allChars.length} characters)\n`);
    }
  } catch (err) {
    console.log(`  ⚠ with-timestamps failed: ${err.message}`);
    console.log('  Falling back to standard endpoint...\n');
  }

  // Fallback: standard TTS endpoint
  if (!audioBuffer || audioBuffer.length < 1000) {
    console.log('  ⟳ Calling ElevenLabs standard endpoint...');
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text: fullText,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.6,
          similarity_boost: 0.8,
          style: 0.3,
        },
        speed: 1.15,
      }),
    });

    if (!res.ok) {
      console.error(`  ✗ API error: ${res.status} ${await res.text()}`);
      process.exit(1);
    }

    audioBuffer = Buffer.from(await res.arrayBuffer());
    alignment = null;
  }

  writeFileSync(fullPath, audioBuffer);
  console.log(`  ✓ full.mp3 (${(audioBuffer.length / 1024).toFixed(0)} KB)`);

  if (alignment) {
    writeFileSync(`${OUTPUT_DIR}/alignment.json`, JSON.stringify(alignment, null, 2));
  }
}

// ─── Step 3: Measure total duration ─────────────────────────────
console.log('\nStep 3: Measuring duration & calculating timestamps...\n');

const totalDuration = parseFloat(
  execSync(`ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${fullPath}"`).toString().trim()
);
console.log(`  Total duration: ${totalDuration.toFixed(1)}s`);

// ─── Step 4: Calculate scene start times ────────────────────────
let sceneStartTimes = [];
let timingMethod = 'word-count';

// Try alignment-based timestamps first
if (existsSync(`${OUTPUT_DIR}/alignment.json`)) {
  try {
    const alignment = JSON.parse(readFileSync(`${OUTPUT_DIR}/alignment.json`, 'utf8'));
    if (alignment.characters && alignment.characters.length > 0) {
      const alignedText = alignment.characters.join('');

      for (let i = 0; i < SCENES.length; i++) {
        const searchKeys = [
          SCENES[i].text.slice(0, 30),
          SCENES[i].text.slice(0, 20),
          SCENES[i].text.slice(0, 12),
        ];

        let found = false;
        for (const key of searchKeys) {
          const searchFrom = i === 0 ? 0 : Math.max(0, sceneStartTimes.length > 0
            ? alignedText.indexOf(searchKeys[0], Math.floor(sceneTextOffsets[i] * 0.8))
            : 0);
          const idx = alignedText.indexOf(key, searchFrom >= 0 ? searchFrom : 0);

          if (idx >= 0 && idx < alignment.starts.length) {
            sceneStartTimes.push(alignment.starts[idx]);
            found = true;
            break;
          }
        }

        if (!found) {
          const wordsBefore = SCENES.slice(0, i).reduce((sum, s) => sum + s.text.split(/\s+/).length, 0);
          const totalWords = SCENES.reduce((sum, s) => sum + s.text.split(/\s+/).length, 0);
          sceneStartTimes.push((wordsBefore / totalWords) * totalDuration);
          console.log(`  ⚠ Scene ${i + 1}: alignment miss, using word-count estimate`);
        }
      }
      timingMethod = 'alignment';
      console.log(`  Using alignment-based timestamps\n`);
    }
  } catch (err) {
    console.log(`  ⚠ Alignment parse failed: ${err.message}\n`);
  }
}

// Fallback: word-count proportional estimation
if (sceneStartTimes.length === 0) {
  console.log('  Using word-count proportional estimation\n');
  const wordsPerScene = SCENES.map(s => s.text.split(/\s+/).length);
  const totalWords = wordsPerScene.reduce((a, b) => a + b, 0);

  let cumWords = 0;
  for (const w of wordsPerScene) {
    sceneStartTimes.push(Math.round((cumWords / totalWords) * totalDuration * 100) / 100);
    cumWords += w;
  }
}

sceneStartTimes = sceneStartTimes.map(t => Math.round(t * 100) / 100);

// ─── Step 5: Calculate scene durations ──────────────────────────
const sceneDurationsMs = [];
for (let i = 0; i < SCENES.length; i++) {
  const nextStart = i < SCENES.length - 1 ? sceneStartTimes[i + 1] : totalDuration + 2.0;
  const dur = nextStart - sceneStartTimes[i];
  sceneDurationsMs.push(Math.round(dur * 1000));
}

const audioLengths = [];
for (let i = 0; i < SCENES.length; i++) {
  const nextStart = i < SCENES.length - 1 ? sceneStartTimes[i + 1] : totalDuration;
  audioLengths.push(Math.round((nextStart - sceneStartTimes[i]) * 100) / 100);
}

// ─── Step 6: Split into individual scene files ──────────────────
console.log('Step 4: Splitting into individual scene files...\n');

for (let i = 0; i < SCENES.length; i++) {
  const start = sceneStartTimes[i];
  const duration = audioLengths[i];
  const filePath = `${OUTPUT_DIR}/${SCENES[i].file}`;
  try {
    execSync(
      `ffmpeg -y -ss ${start} -t ${duration} -i "${fullPath}" -acodec copy "${filePath}" 2>/dev/null`
    );
    console.log(`  ✓ ${SCENES[i].file}`);
  } catch {
    console.log(`  ✗ ${SCENES[i].file} (split failed)`);
  }
}

// ─── Step 7: Save timestamps ────────────────────────────────────
const timestamps = {
  continuous: true,
  timingMethod,
  sceneStartTimes,
  sceneDurationsMs,
  audioLengths,
  totalDuration: Math.round(totalDuration * 100) / 100,
};

writeFileSync(`${OUTPUT_DIR}/timestamps.json`, JSON.stringify(timestamps, null, 2));

// ─── Print summary ──────────────────────────────────────────────
console.log('\n  Scene Timing Summary:');
console.log('  ─────────────────────────────────────────────');
for (let i = 0; i < SCENES.length; i++) {
  const start = sceneStartTimes[i].toFixed(1).padStart(6);
  const audio = audioLengths[i].toFixed(1).padStart(5);
  const dur = (sceneDurationsMs[i] / 1000).toFixed(1).padStart(5);
  console.log(`  ${String(i).padStart(2)}: ${start}s  audio ${audio}s  dur ${dur}s  ${SCENES[i].file}`);
}

// ─── Output code for VideoTemplate.tsx ──────────────────────────
console.log('\n// ─── Paste into VideoTemplate.tsx ───────────────────────');
console.log(`const FULL_AUDIO = '/audio/ep6-duplicate-txid/full.mp3';`);
console.log('const SCENE_START_TIMES = [');
console.log('  ' + sceneStartTimes.map(t => t.toFixed(2)).join(', ') + ',');
console.log('];');
console.log('');
console.log('const SCENE_DURATIONS = {');
for (let i = 0; i < SCENES.length; i++) {
  const key = `scene${i + 1}`;
  const ms = sceneDurationsMs[i];
  const start = sceneStartTimes[i].toFixed(1);
  const audio = audioLengths[i].toFixed(1);
  console.log(`  ${key}: ${ms},${' '.repeat(Math.max(1, 8 - String(ms).length))}// ${i}: @${start}s, audio ${audio}s`);
}
console.log('};');

console.log(`\n✓ Done! Continuous voiceover (${timingMethod} timing)`);
console.log(`  Total: ${totalDuration.toFixed(1)}s — no artificial gaps between scenes.`);
console.log('  Run "npm run dev:client" and preview to verify sync.');
console.log('  Fine-tune: adjust SCENE_START_TIMES in VideoTemplate if any scene transitions feel off.');
