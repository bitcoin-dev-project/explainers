# EP5 — 64-Byte Transaction Bug: Technical Reference & Errata

## Sources

- **BitMEX Research:** https://testnet.bitmex.com/blog/64-Byte-Transactions
- **Sergio Demian Lerner (Bitslog):** https://bitslog.com/2018/06/09/leaf-node-weakness-in-bitcoin-merkle-tree-design/
- **Peter Todd (bitcoin-dev):** https://gnusha.org/pi/bitcoindev/20180607171311.6qdjohfuuy3ufriv@petertodd.org/
- **CVE-2017-12842** — disclosed by Sergio Demian Lerner, 2017

---

## Part 1: How a Merkle Tree Inner Node Works

Bitcoin packs transactions into a Merkle tree. Pairs of transactions get hashed together, then those hashes get hashed together, all the way up to one root hash that goes in the block header.

To compute any inner node (parent), you take two child hashes (each 32 bytes), concatenate them, and double-SHA-256 the result:

```
Inner node = SHA256(SHA256( left_child_32B || right_child_32B ))
                           └──────── 64 bytes total ────────┘
```

Every inner node computation takes exactly **64 bytes** as input.

---

## Part 2: A Minimal Transaction Is Also 64 Bytes

A Bitcoin transaction with 1 input, 1 output, and minimal scripts:

```
Field              Bytes   Example (hex)
───────────────────────────────────────────────────────────
Version              4     01000000
Input count          1     01
Prev TXID           32     a1b2c3d4e5f6...  (hash of tx being spent)
Prev output idx      4     00000000
ScriptSig size       1     00  (empty scriptsig)
Sequence             4     ffffffff
Output count         1     01
Value                8     0050d6dc01000000  (≈80 BTC in satoshis)
ScriptPubKey size    1     04
ScriptPubKey         4     01234567  (short script)
Locktime             4     00000000
───────────────────────────────────────────────────────────
TOTAL               64 bytes
```

SHA-256 sees 64 bytes either way — it **cannot tell** if it's hashing a Merkle node or a transaction. That ambiguity is the bug.

---

## Part 3: Where the 32-Byte Split Falls (Prev TXID Overflow)

When the Merkle tree reads those 64 bytes as an inner node, it splits them in half:

- **Bytes 0–31** = "left child hash"
- **Bytes 32–63** = "right child hash"

Counting where each field lands:

```
Field             Size    Running total
──────────────────────────────────────
Version            4B     → 4
Input count        1B     → 5
Prev TXID         32B     → 37   ← OVERFLOWS past byte 32!
```

The 32-byte boundary falls **inside** the Prev TXID field:

```
LEFT CHILD (bytes 0–31):                RIGHT CHILD (bytes 32–63):
┌──────────────────────────────┐        ┌──────────────────────────────────┐
│ Version          4B          │        │ Prev TXID tail       5B         │
│ Input count      1B          │        │ Prev output index    4B         │
│ Prev TXID       27B ← first │        │ ScriptSig size       1B         │
│                 27 of the    │        │ Sequence             4B         │
│                 32-byte      │        │ Output count         1B         │
│                 TXID field   │        │ Value                8B         │
│                              │        │ ScriptPubKey size    1B         │
│ Total:          32B          │        │ ScriptPubKey         4B         │
└──────────────────────────────┘        │ Locktime             4B         │
                                        │ Total:              32B         │
                                        └──────────────────────────────────┘
```

**The Prev TXID (32 bytes) gets split:** 27 bytes in the left child, 5 bytes overflow into the right child. This is critical for understanding the attack's feasibility — those 5 overflow bytes ("TXID tail") are among the hardest bits to brute-force.

---

## Part 4: The Attack

Alice wants to trick Bob's SPV (light) wallet into thinking she paid him 5 BTC. She never actually does.

**Step 1 — Craft two transactions:**

- **Transaction T** (the real one): A weird but valid 64-byte transaction that actually gets mined.
- **Transaction F** (the fake one): A normal-looking "5 BTC to Bob" payment. **Never gets mined.**

**Step 2 — The match that matters:**

Alice needs:

```
TXID(F) == right half of T (bytes 32–63)
```

If T is a leaf in the Merkle tree, and its right 32 bytes happen to equal the hash of F, then the Merkle tree can be reinterpreted. T looks like an inner node whose right child is F. Alice can construct a Merkle proof that "proves" F is in the block — even though F was never mined.

**Step 3 — Fool the SPV wallet:**

Alice sends Bob the fake Merkle proof. Bob's light wallet checks:

1. Does the proof hash up to the Merkle root? **Yes** (because T is really in the tree)
2. Does the root match the block header? **Yes** (because it's a real block with real PoW)
3. Bob's wallet shows: "Received 5 BTC" — but the transaction **doesn't exist**.

---

## Part 5: Why It's NOT 2^32 — Field-by-Field Collision Analysis

### The wrong claim (our transcript, scene 8)

> "after roughly two-to-the-thirty-two tries — about four billion — she'll find a match"

**This is wrong.** 2^32 appears in none of the published analyses. Here's the actual breakdown.

### What Alice needs to match

She needs the 32 bytes of the right half of T to equal TXID(F). If she had to brute-force all 32 bytes blindly, that would be 2^256 — impossible. But she **controls many of those fields**.

### Field-by-field categorization of the right half

```
Field              Size   Category       Why?
─────────────────────────────────────────────────────────────────────────
Prev TXID tail      5B    COLLISION      Must find a UTXO whose txid ends
                                         with specific bytes. Must grind.

Prev output idx     4B    MANIPULABLE    Create a tx with many outputs,
                                         pick the matching index.

ScriptSig size      1B    COLLISION      Must be 0x00 (empty sig).
                                         Can't freely choose.

Sequence            4B    FREE           Any value is valid. Alice picks
                                         whatever she needs.

Output count        1B    COLLISION      Must be 0x01 (one output).
                                         Fixed by tx structure.

Value               8B    MANIPULABLE    Alice controls the amount she
                                         sends. Can set to match.

ScriptPubKey sz     1B    COLLISION      Must be a valid small script size.
                                         Very constrained.

ScriptPubKey        4B    FREE           Various short valid scripts work.

Locktime            4B    MANIPULABLE    Any valid block height or
                                         timestamp. Attacker controls.
─────────────────────────────────────────────────────────────────────────
COLLISION (must brute-force):    5+1+1+1 = 8 bytes  = 64 bits
MANIPULABLE (attacker controls):   4+8+4 = 16 bytes
FREE (anything goes):              4+4   = 8 bytes
```

Alice grinds from **both sides** — she tweaks T's fields AND F's fields (change address, amounts, etc.) simultaneously. Each change to F produces a completely different 32-byte TXID.

### Published estimates

| Source | Estimated work | Method | Notes |
|--------|---------------|--------|-------|
| **Peter Todd** | **~2^61** | bitcoin-dev mailing list | Reviewer calls this "wildly underestimated" |
| **BitMEX Research** | **~2^64** | 8 collision bytes = 64 bits | "Moderate to low" risk |
| **Sergio Lerner** | **~2^72** | Field-by-field constraint analysis | Stage 1: 72 bits. ~$3M in mining hardware, 4 days with 1000 ASICs |

### Why these numbers are so different from 2^32

```
2^32  =                        4,294,967,296  ← OUR WRONG CLAIM (seconds on laptop)
2^61  =        2,305,843,009,213,693,952      ← Peter Todd (dedicated hardware)
2^64  =       18,446,744,073,709,551,616      ← BitMEX (serious computation)
2^72  =    4,722,366,482,869,645,213,696      ← Lerner ($3M in ASICs)
2^256 = 1.158 × 10^77                         ← full SHA-256 collision (impossible)
```

Even the most optimistic estimate (2^61) is **~500 million times harder** than 2^32. This is not "doable on a regular laptop" — it requires dedicated hardware and significant investment.

### Why Lerner's 72 bits is higher than BitMEX's 64 bits

BitMEX counts only the strictly fixed bytes (8B = 64 bits). Lerner's analysis accounts for **partial constraints within the "manipulable" fields**:

- The output value can't exceed the UTXO amount Alice controls
- The prev output index must be < the number of outputs in the parent tx
- The locktime must represent a valid block height or Unix timestamp
- Certain script bytes must form valid opcodes

These partial constraints add ~8 more bits of work on top of the 64, bringing the total to ~72.

---

## Part 6: The Fix — BIP 54

Beautifully simple: **ban all 64-byte transactions at consensus level.**

There are exactly **zero** legitimate 64-byte transactions on the entire Bitcoin blockchain, so nothing breaks. This is part of the proposed Consensus Cleanup soft fork.

---

## Errata — Fixed (2026-03-18, per Antoine Poinsot's review)

| # | Issue | Fix Applied |
|---|-------|-------------|
| 1 | **"Minimal tx is 64 bytes"** — smallest is ~61B | Changed heading to "A transaction can be crafted to be exactly 64 bytes" |
| 2 | **2^32 brute force claim** — actually ~2^61-2^72 | Scene 8 grinding table: ~2³² → ~2⁶¹⁺. Scene 13 feasibility: ~2⁶⁴ → ~2⁶¹—2⁷². "laptop-feasible" → "expensive but feasible" |
| 3 | **Prev TXID overflow** — field straddles 32B boundary | Scene 7: Split PrevTXID into "prevTXID ↗" (27B) and "↘ TXID" (5B) with dashed boundary marker |
| 4 | **Transcript updated** — corrected brute force estimates and feasibility language |

### Remaining audio issues (requires re-recording)
- Scene 8 voiceover still says "two-to-the-thirty-two" and "doable on a regular laptop"
- Scene 4 voiceover says "minimal" instead of "crafted"
- Visual fixes correct the on-screen text; audio would need re-generation to fully fix
