import { motion } from 'framer-motion';

const EPISODES = [
  {
    id: 'ep1',
    number: 1,
    title: "Satoshi's Off-By-One Error",
    description:
      'How a fencepost bug in Bitcoin\'s difficulty retargeting code biases difficulty upward by ~0.05%.',
    scenes: 15,
    duration: '3:10',
    status: 'published' as const,
  },
  {
    id: 'ep2',
    number: 2,
    title: 'How SegWit Addresses Work',
    description:
      'Decoding a Bech32 address step by step — from human-readable prefix to witness public key hash.',
    scenes: 8,
    duration: '2:09',
    status: 'published' as const,
  },
  {
    id: 'ep3',
    number: 3,
    title: 'SHA-256 Padding',
    description:
      'Part 1 of SHA-256 internals: how Bitcoin pads a message before hashing it.',
    scenes: 13,
    duration: '1:54',
    status: 'draft' as const,
  },
  {
    id: 'ep4',
    number: 4,
    title: 'Garbled Circuits',
    description:
      'How two parties can compute a function together without revealing their private inputs.',
    scenes: 15,
    duration: '1:59',
    status: 'draft' as const,
  },
  {
    id: 'ep5',
    number: 5,
    title: 'The 64-Byte Transaction Bug',
    description:
      'How a Merkle tree ambiguity lets attackers fake SPV proofs — and the BIP 54 fix that bans it.',
    scenes: 16,
    duration: '6:24',
    status: 'draft' as const,
  },
  {
    id: 'ep6',
    number: 6,
    title: "Bitcoin's Identity Crisis",
    description:
      'How duplicate coinbase txids corrupted the UTXO set, and the 15-year journey from BIP 30 to BIP 54 to fix it.',
    scenes: 19,
    duration: '2:36',
    status: 'draft' as const,
  },
  {
    id: 'ep7',
    number: 7,
    title: 'The Overwrite',
    description:
      'How duplicate coinbase TXIDs silently destroyed 100 BTC, the accidental time bomb in block 164,384, and BIP 54\'s permanent fix.',
    scenes: 18,
    duration: '2:35',
    status: 'draft' as const,
  },
  {
    id: 'ep8',
    number: 8,
    title: 'Keccak SHA3-256: The Sponge',
    description:
      'Why Bitcoin double-hashes to avoid length extension — and how Keccak\'s sponge construction solves it by design.',
    scenes: 17,
    duration: '2:35',
    status: 'draft' as const,
  },
  {
    id: 'ep9',
    number: 9,
    title: 'Worst-Case Block Validation',
    description:
      'How a single crafted transaction can stall a node for 10 hours — and how BIP 54 caps it to 3 seconds.',
    scenes: 14,
    duration: '1:56',
    status: 'draft' as const,
  },
  {
    id: 'ep10',
    number: 10,
    title: 'BIP 54: The 4 Bugs Bitcoin Never Fixed',
    description:
      'A diagnostic scan of Bitcoin\'s 4 consensus bugs — the 5-year stall, the Murch-Zawy discovery, and the Great Consensus Cleanup.',
    scenes: 13,
    duration: '1:47',
    status: 'draft' as const,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-bg-light">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-12">
            <h1 className="font-display text-4xl font-bold tracking-tight text-text-primary">
              Bitcoin Explainers
            </h1>
            <p className="mt-3 text-lg text-text-muted">
              Visual explainers that break down how Bitcoin works.
            </p>
          </div>

          <div className="grid gap-5">
            {EPISODES.map((ep, i) => (
              <motion.a
                key={ep.id}
                href={`#${ep.id}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08, duration: 0.4 }}
                className="group flex gap-5 rounded-xl border border-text-primary/10 bg-white/50 p-5 transition-all hover:border-primary/40 hover:bg-white/80 hover:shadow-md"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-mono text-lg font-bold text-primary">
                  {ep.number}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-lg font-semibold text-text-primary group-hover:text-primary transition-colors">
                      {ep.title}
                    </h2>
                    {ep.status === 'draft' && (
                      <span className="rounded-full bg-text-muted/15 px-2 py-0.5 text-xs font-medium text-text-muted">
                        Draft
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-text-muted leading-relaxed">
                    {ep.description}
                  </p>
                  <div className="mt-2 flex gap-4 text-xs text-text-muted/70 font-mono">
                    <span>{ep.scenes} scenes</span>
                    <span>{ep.duration}</span>
                  </div>
                </div>
                <div className="flex items-center text-text-muted/40 group-hover:text-primary transition-colors">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </motion.a>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
