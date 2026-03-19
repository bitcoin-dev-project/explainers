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

const OUTPUT_DIR = './client/public/audio/ep5-64byte-tx';
mkdirSync(OUTPUT_DIR, { recursive: true });

// ─── Scene texts (ONE continuous voiceover) ──
// Scenes with `pauseAfter: true` get a longer separator ("...\n\n") to let concepts land.
const SCENES = [
  {
    file: 'scene1.mp3',
    text: `The sixty-four byte transaction bug — a hidden flaw in Bitcoin's Merkle tree, addressed by bip fifty-four as part of the Consensus Cleanup proposal.`,
    pauseAfter: true, // let title breathe before diving in
  },
  {
    file: 'scene2.mp3',
    text: `Every Bitcoin block bundles its transactions into a structure called a Merkle tree. Transactions sit at the bottom as leaves, and each pair gets hashed together to form a parent — all the way up to a single root hash.`,
  },
  {
    file: 'scene3.mp3',
    text: `To prove your transaction is in a block, you don't need the whole tree. You just need the sibling hashes at each level. Hash your way up — if you land on the same root that's in the block header, the proof checks out.`,
  },
  {
    file: 'scene4.mp3',
    text: `Now let's look inside one of these parent nodes. To compute it, you concatenate two child hashes — each one is thirty-two bytes — and feed the result into sha two fifty six. So the input to every inner node is exactly sixty-four bytes.`,
    pauseAfter: true, // key fact — inner node = 64 bytes
  },
  {
    file: 'scene5.mp3',
    text: `Here's where it gets interesting. A Bitcoin transaction can be crafted to be exactly sixty-four bytes — one input, one output, minimal script data. The smallest possible transaction is actually around sixty-one bytes, but sixty-four is the critical number because it matches the inner node size.`,
    pauseAfter: true, // the coincidence — let it land
  },
  {
    file: 'scene6.mp3',
    text: `Stack them side by side. Inner node: sixty-four bytes. Transaction: sixty-four bytes. sha two fifty six sees the same number of bytes either way. It has no idea whether it's hashing a Merkle node or a transaction. That ambiguity is the bug.`,
    pauseAfter: true, // let the bug reveal sink in
  },
  {
    file: 'scene7.mp3',
    text: `Why does this matter? Because light wallets — also called S.P.V. wallets — don't download every block. They only grab block headers and ask full nodes for Merkle proofs. If the proof hashes to the root in the header, they trust it. They never see the full tree.`,
    pauseAfter: true, // pause before the attack section
  },
  {
    file: 'scene8.mp3',
    text: `Here's how the attack works. Alice needs two transactions. The first one is the real transaction — a malicious sixty-four byte transaction that actually gets mined. Its first thirty-two bytes will be read as a left child hash, and its last thirty-two bytes as a right child hash. The second transaction is the fake one — a normal-looking payment, say five B.T.C. to Bob. This one never gets mined. But its transaction I.D., the hash of that payment, must exactly match those last thirty-two bytes of the real transaction.`,
  },
  {
    file: 'scene9.mp3',
    text: `So how does Alice make the transaction I.D.s match? She grinds. She creates her fake transaction, then keeps changing the change address — over and over — and each time, the transaction I.D. changes. Most attempts won't match. But with the constraints on the last thirty-two bytes, there are about seventy bits of work to brute-force. That's far less than two-to-the-two-fifty-six, but still expensive.`,
    pauseAfter: true, // pause before the attack execution steps
  },
  {
    file: 'scene10.mp3',
    text: `Step one. Alice broadcasts her sixty-four byte transaction. It looks weird, but it's technically valid, so miners include it in a block. It lands in the Merkle tree as a leaf — let's call it transaction sixty-four.`,
  },
  {
    file: 'scene11.mp3',
    text: `Step two. Here's the key insight. That leaf — transaction sixty-four — is sixty-four bytes long. When the Merkle tree hashes it, sha two fifty six sees sixty-four bytes and treats the first thirty-two as one child hash and the last thirty-two as another. The leaf splits open into two fake children. The tree now has an extra level that was never meant to exist — and one of those fake children is the transaction I.D. of Alice's never-mined payment.`,
    pauseAfter: true, // key insight — let it land
  },
  {
    file: 'scene12.mp3',
    text: `So now there are two ways to read the same Merkle tree. In reality, it's a normal tree with transaction sixty-four as a leaf. But Alice can construct a Merkle proof that treats it as an inner node with two children — one of which is her fake five B.T.C. payment. Both interpretations produce the exact same root hash. That's the whole trick.`,
    pauseAfter: true, // let "that's the whole trick" land before consequence
  },
  {
    file: 'scene13.mp3',
    text: `Step three. Alice sends this fake proof to Bob's light wallet. The wallet checks: does the leaf hash to the parent? Yes. Does the path reach the root? Yes. Does the root match the block header? Yes — because it's a real block, mined by real miners with real proof of work. Every check passes. Bob's wallet shows an incoming payment of five B.T.C. But that transaction was never mined. It doesn't exist.`,
    pauseAfter: true, // dramatic moment — let it breathe
  },
  {
    file: 'scene14.mp3',
    text: `Now, you might ask — how feasible is this really? Let's break down the last thirty-two bytes field by field. Out of those thirty-two bytes, about eight bytes are constrained — the tail of the transaction I.D., the signature size, the output count, and the script size. The other twenty-four bytes are either freely chosen or directly manipulable by the attacker. That leaves about seventy bits of work — far from the two-to-the-two-fifty-six you'd need for a full sha two fifty six collision, but still costly enough to require serious resources.`,
  },
  {
    file: 'scene15.mp3',
    text: `The fix? Beautifully simple. bip fifty-four says: ban all sixty-four byte transactions. Nothing breaks. This is part of the Consensus Cleanup soft fork.`,
  },
  {
    file: 'scene16.mp3',
    text: `Follow at bitcoin devs for more. Next up, worst-case block validation time.`,
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

// ─── Step 6: Split into individual scene files (optional) ───────
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
