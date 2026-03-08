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
    text: `Garbled Circuits. A cryptographic technique for one of the hardest problems in computer science: how do you compute something together, without revealing your private data?`,
  },
  {
    file: 'scene2.mp3',
    text: `Here's a classic example called Yao's Millionaires Problem. Two millionaires are sitting at dinner. They want the richest person to pay the bill. But neither one wants to reveal how much money they actually have. They need a way to compare their wealth, without exposing it.`,
  },
  {
    file: 'scene3.mp3',
    text: `Let's simplify this to something smaller. Alice and Bob are deciding whether to go to a party together. The rule is simple: they only go if both of them want to. But here's the catch. If one of them says no, they don't want the other person to know. They want to keep their answer private.`,
  },
  {
    file: 'scene4.mp3',
    text: `This is actually a well-known logic gate called an AND gate. It takes two inputs and produces one output. The output is yes only when both inputs are yes. This is exactly the logic we need.`,
  },
  {
    file: 'scene5.mp3',
    text: `Here's the truth table showing all four possible combinations. Zero and zero gives zero. Zero and one gives zero. One and zero gives zero. Only when both Alice and Bob say one, do we get one. That's the only combination that gets them to the party.`,
  },
  {
    file: 'scene6.mp3',
    text: `But here's the problem. If we just run this gate normally, Alice can see Bob's input and Bob can see Alice's input. That completely defeats the purpose. If Alice said no and the answer comes back "don't go", she still shouldn't be able to figure out whether Bob said yes or no. We need to keep these inputs private.`,
  },
  {
    file: 'scene7.mp3',
    text: `So what if we could compute the answer, without either side actually seeing the inputs? That's exactly what garbled circuits let us do.`,
  },
  {
    file: 'scene7b.mp3',
    text: `In a garbled circuit, there are two roles. Alice is the garbler. She's the one who prepares the encrypted circuit. Bob is the evaluator. He's the one who runs the circuit and gets the result. Let's walk through how this works step by step.`,
  },
  {
    file: 'scene8.mp3',
    text: `Step one. Alice replaces every possible bit value with a random cryptographic key. On Alice's wire, the bit zero gets a random key, and the bit one gets a completely different random key. Same thing for Bob's wire. These keys look nothing like the original bits. Just by looking at a key, you have no idea whether it represents zero or one.`,
  },
  {
    file: 'scene9.mp3',
    text: `Step two. Alice encrypts each row of the truth table using the two keys that correspond to that row. Each output is double-encrypted. You need both Alice's key and Bob's key to decrypt it. No single key can open any row on its own. You need the exact matching pair.`,
  },
  {
    file: 'scene9b.mp3',
    text: `Here's what the garbled table looks like. Each row is an encryption of the output, locked with a specific combination of Alice's key and Bob's key. Only the right pair of keys can open the right row. No other combination works.`,
  },
  {
    file: 'scene10.mp3',
    text: `Step three. Alice shuffles the rows randomly. Now the position of a row in the table tells you nothing about which input combination it represents. This is why it's called a garbled circuit. The table is scrambled. The truth is hidden inside the encryption.`,
  },
  {
    file: 'scene11.mp3',
    text: `Step four. Alice needs to give Bob his key, but without learning which key he picks. This is where oblivious transfer comes in. Alice holds both of Bob's possible keys. Through oblivious transfer, Bob receives exactly the key matching his private choice, and Alice never learns which one he picked.`,
  },
  {
    file: 'scene12.mp3',
    text: `Now let's look at what Bob has. Three things. First, Alice's key for her actual input. She simply sends him the key corresponding to her choice. Second, his own key that he got through oblivious transfer. And third, the entire garbled table that Alice sent over. He has the keys, and he has the encrypted table. Time to decrypt.`,
  },
  {
    file: 'scene13.mp3',
    text: `Bob tries his two keys against each row in the garbled table. For most rows, the keys don't match. The decryption produces gibberish. But for exactly one row, both keys fit. That's the row encrypted with the exact combination matching Alice's input and Bob's input. It opens cleanly and reveals the output. In this case, both chose one, so the output is one. They're going to the party.`,
  },
  {
    file: 'scene14.mp3',
    text: `So what did each side actually learn? Alice, the garbler, never learned Bob's input and she never learned the output. Bob, the evaluator, learned the output but never learned Alice's input. They computed together, but learned nothing about each other. That's the magic of garbled circuits.`,
  },
  {
    file: 'scene14b.mp3',
    text: `Now, our party example was just a single AND gate. One question, one answer. But real-world problems are much more complex than that.`,
  },
  {
    file: 'scene14c.mp3',
    text: `The power of garbled circuits is that you can chain gates together. The output of one gate feeds into the input of the next. AND gates, OR gates, XOR gates, all wired together into bigger and bigger circuits. The millionaires problem, auctions, voting, any function that a computer can evaluate can be turned into a garbled circuit.`,
  },
  {
    file: 'scene14d.mp3',
    text: `But there's a trade-off. A regular logic gate takes about a nanosecond. A garbled gate, because it uses symmetric encryption, takes about a microsecond. That's roughly a thousand times slower. And every gate in the circuit needs four encryptions, so the full circuit description can be megabytes, even gigabytes of encrypted data sent between the parties. Privacy has a cost. But it works.`,
  },
  {
    file: 'scene15.mp3',
    text: `Next time, we'll see how BitVM takes this exact technique, garbled circuits, and brings it to Bitcoin. Follow @bitcoin_devs to catch that episode.`,
  },
];

const OUTPUT_DIR = './client/public/audio/ep4-garbled-circuits';
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

console.log('\nDone! All audio files in client/public/audio/ep4-garbled-circuits/');
