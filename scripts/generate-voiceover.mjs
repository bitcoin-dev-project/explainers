import { writeFileSync, mkdirSync, readFileSync } from 'fs';

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

const SCENES = [
  {
    file: 'scene1.mp3',
    text: `Episode 2. Let's break down how a SegWit address actually works.`,
  },
  {
    file: 'scene2.mp3',
    text: `Unlike legacy addresses, SegWit uses a completely different encoding called Bech32. Not Base58.`,
  },
  {
    file: 'scene3.mp3',
    text: `Here's a real SegWit address. It has three parts. "bc" tells us this is Bitcoin mainnet. Then a "1" as a delimiter. And everything after that is the data.`,
  },
  {
    file: 'scene4.mp3',
    text: `The data splits into two pieces. The first character is the witness version. And the rest is the witness program, plus a checksum.`,
  },
  {
    file: 'scene5.mp3',
    text: `Now let's decode this address character by character. We lay out the full address in a grid. Each part is color-coded. Red for the human-readable prefix. Yellow for the version. White for the witness program. And green for the checksum.`,
  },
  {
    file: 'scene6.mp3',
    text: `We use the Bech32 lookup table. Each character maps to a number based on its row and column. The version character "q" sits at row zero, column zero. So the witness version is zero. Next, we decode all 32 witness characters the same way. Each one gives us a 5-bit value. Finally, the last 6 characters form the checksum. We decode them and verify the address is valid.`,
  },
  {
    file: 'scene7.mp3',
    text: `We take those 32 five-bit values and concatenate them into a single binary stream. Then regroup into 8-bit bytes, giving us 20 bytes. Converting to hexadecimal, we get the witness public key hash — the 20-byte fingerprint that identifies the recipient on the blockchain.`,
  },
  {
    file: 'scene8.mp3',
    text: `Follow Merkle for more Bitcoin technical posts.`,
  },
];

const OUTPUT_DIR = './client/public/audio/ep2-segwit';
mkdirSync(OUTPUT_DIR, { recursive: true });

for (const scene of SCENES) {
  console.log(`Generating ${scene.file}...`);
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method: 'POST',
    headers: {
      'xi-api-key': API_KEY,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text: scene.text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.6,
        similarity_boost: 0.8,
        style: 0.3,
      },
    }),
  });

  if (!res.ok) {
    console.error(`Failed ${scene.file}: ${res.status} ${await res.text()}`);
    continue;
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  writeFileSync(`${OUTPUT_DIR}/${scene.file}`, buffer);
  console.log(`  ✓ ${scene.file} (${(buffer.length / 1024).toFixed(0)} KB)`);
}

console.log('\nDone! All audio files in client/public/audio/');
