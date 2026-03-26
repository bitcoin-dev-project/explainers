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

const OUTPUT_DIR = './client/public/audio/ep1-off-by-one';
mkdirSync(OUTPUT_DIR, { recursive: true });

// ─── Scene texts (ONE continuous voiceover) ──
// Scenes with `pauseAfter: true` get a longer separator ("...\n\n") to let concepts land.
const SCENES = [
  {
    file: 'scene1.mp3',
    text: `Satoshi's off-by-one error. A tiny bug hiding in Bitcoin's difficulty adjustment since day one.`,
    pauseAfter: true, // let title breathe
  },
  {
    file: 'scene2.mp3',
    text: `Every two thousand sixteen blocks, Bitcoin recalculates its mining difficulty. If blocks came too fast, difficulty goes up. Too slow, it goes down. At each boundary, the network retargets.`,
  },
  {
    file: 'scene3.mp3',
    text: `This cycle of two thousand sixteen blocks is called a retarget period. Block zero through block two thousand fifteen — one full cycle. But how long should it actually take?`,
    pauseAfter: true, // question hangs before quiz
  },
  {
    file: 'scene4.mp3',
    text: `Quick question before we dive in. How long does one retarget period take? Is it exactly two weeks? Or two weeks minus ten minutes? Think about it — we'll come back to this.`,
    pauseAfter: true, // let quiz question settle
  },
  {
    file: 'scene5.mp3',
    text: `Each block takes about ten minutes. So two thousand sixteen blocks times ten minutes gives us fourteen days. Two weeks of blocks — that's the target.`,
  },
  {
    file: 'scene6.mp3',
    text: `But is it really fourteen days? Let's look at how Bitcoin actually measures time.`,
    pauseAfter: true, // dramatic pause before fencepost
  },
  {
    file: 'scene7.mp3',
    text: `Here's the key. Time is measured in the gaps between blocks, not the blocks themselves. Five blocks, four gaps. Like fence posts — five posts, four sections of fence.`,
    pauseAfter: true, // key insight — let it land
  },
  {
    file: 'scene8.mp3',
    text: `To adjust difficulty, Bitcoin asks: how long did the last epoch take? It compares two block timestamps to find out.`,
  },
  {
    file: 'scene9.mp3',
    text: `The correct measurement: take the timestamp of block four thousand thirty-one, subtract the timestamp of block two thousand fifteen. That gives you two thousand sixteen intervals — exactly one full epoch.`,
  },
  {
    file: 'scene10.mp3',
    text: `But Satoshi's code does something different. It subtracts two thousand fifteen instead of two thousand sixteen. So it starts measuring from block two thousand sixteen, not two thousand fifteen. The gap between the two epochs is never counted. One interval, lost. That's the off-by-one error.`,
    pauseAfter: true, // bug reveal — let it sink in
  },
  {
    file: 'scene11.mp3',
    text: `Let's do the math. Two thousand fifteen times ten minutes equals twenty thousand one hundred fifty minutes. The correct value — two thousand sixteen times ten — is twenty thousand one hundred sixty. A difference of exactly ten minutes.`,
  },
  {
    file: 'scene12.mp3',
    text: `Converting to days: Bitcoin measures thirteen point nine nine three days instead of the expected fourteen. Ten minutes short. Every single retarget period. Bitcoin thinks blocks came slightly too fast, so it bumps difficulty up.`,
  },
  {
    file: 'scene13.mp3',
    text: `Ten minutes out of twenty thousand one hundred sixty. That's a plus zero point zero five percent upward bias on difficulty. Every two weeks. Baked in since the genesis block.`,
    pauseAfter: true, // HIGHLIGHT — let the big number land
  },
  {
    file: 'scene14.mp3',
    text: `Remember the question? The answer is B — two weeks minus ten minutes. Two thousand fifteen intervals times ten minutes gives you thirteen days, twenty-three hours, and fifty minutes.`,
  },
  {
    file: 'scene15.mp3',
    text: `Next up: how the Consensus Cleanup soft fork fixes the timewarp attack. Follow at bitcoin devs for more.`,
  },
];

// ─── Step 1: Build ONE continuous narration ─────────────────────
console.log('Step 1: Building continuous narration...\n');

// Join scene texts with paragraph breaks. Scenes with `pauseAfter` get a longer
// separator ("...\n\n") so ElevenLabs produces a ~1s natural pause at key moments.
const SHORT_SEP = '\n\n';           // ~0.3-0.5s natural pause
const LONG_SEP = '\n\n...\n\n';    // ~0.8-1.2s natural pause (ellipsis = beat)
const sceneTextOffsets = []; // character offset of each scene's text start
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

    // Response may be single JSON or newline-delimited JSON (streaming)
    const responseText = await res.text();
    const audioChunks = [];
    const allChars = [];
    const allStarts = [];
    const allEnds = [];

    try {
      // Try single JSON response first
      const data = JSON.parse(responseText);
      audioChunks.push(Buffer.from(data.audio_base64, 'base64'));
      if (data.alignment) {
        allChars.push(...(data.alignment.characters || []));
        allStarts.push(...(data.alignment.character_start_times_seconds || []));
        allEnds.push(...(data.alignment.character_end_times_seconds || []));
      }
    } catch {
      // Streaming: newline-delimited JSON chunks
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

  // Fallback: standard TTS endpoint (no alignment data)
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

  // Save alignment if we got it (for debugging/fine-tuning)
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
        // Search for the first ~30 characters of each scene's text in the alignment
        const searchKeys = [
          SCENES[i].text.slice(0, 30),
          SCENES[i].text.slice(0, 20),
          SCENES[i].text.slice(0, 12),
        ];

        let found = false;
        for (const key of searchKeys) {
          // Search from the approximate position (avoid false early matches)
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
          // Fallback for this scene: interpolate from word count
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

// Round timestamps
sceneStartTimes = sceneStartTimes.map(t => Math.round(t * 100) / 100);

// ─── Step 5: Calculate scene durations ──────────────────────────
const sceneDurationsMs = [];
for (let i = 0; i < SCENES.length; i++) {
  const nextStart = i < SCENES.length - 1 ? sceneStartTimes[i + 1] : totalDuration + 2.0;
  const dur = nextStart - sceneStartTimes[i];
  sceneDurationsMs.push(Math.round(dur * 1000));
}

// Audio lengths per scene (for reference — these are the audio section lengths)
const audioLengths = [];
for (let i = 0; i < SCENES.length; i++) {
  const nextStart = i < SCENES.length - 1 ? sceneStartTimes[i + 1] : totalDuration;
  audioLengths.push(Math.round((nextStart - sceneStartTimes[i]) * 100) / 100);
}

// ─── Step 6: Split into individual scene files ───────────────────
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
console.log('const FULL_AUDIO = \'/audio/ep1-off-by-one/full.mp3\';');
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
