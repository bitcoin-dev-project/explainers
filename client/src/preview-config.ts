/**
 * Storyboard Preview Config
 *
 * Viewport-first: each scene describes what's visible within 1920×1080.
 * No oversized canvases, no camera zones, no zoom/pan.
 */

export interface PreviewScene {
  /** Short title shown on screen */
  label: string;
  /** Optional subtitle / caption */
  text?: string;
  /** What happens visually in this scene (shown in info panel) */
  description?: string;
  /** Duration in ms (default: 3000 for fast preview) */
  duration?: number;
  /** Layout pattern for this scene */
  layout?: 'centered' | 'split-screen' | 'full-bleed' | 'asymmetric' | 'sidebar' | string;
}

export interface PreviewConfig {
  /** Episode title */
  title: string;
  /** Background color */
  bg: string;
  /** Scene definitions — each scene describes what's visible in the 1920×1080 viewport */
  scenes: PreviewScene[];
}

export const previewConfig: PreviewConfig = {
  title: "EP133 — Google's Quantum Threat to Bitcoin",
  bg: '#0a0a0f',

  scenes: [
    // ── ACT 1: FOUNDATIONS (Scenes 1–11) ──

    {
      label: 'Cold Open — The Race',
      text: '41% of the time, the quantum computer wins.',
      description:
        'Full-viewport RaceCanvas (1920×1080). Two concentric arcs race from 12 o\'clock: outer white arc (block confirmation, jittery exponential progress) and inner red arc (quantum derivation, smooth linear). Particle trails behind each arc (80 white, 60 red). Red arc completes first — full-screen red glow flash. Counter "41%" slams in at center (Montserrat Bold 120px, #ff2d2d). Label below: "of the time, the quantum computer wins." Ambient dot grid (#1c1c22, 40px spacing) pulses from center.',
      layout: 'full-bleed',
      duration: 8000,
    },
    {
      label: 'Rewind — Title Card',
      text: "Google's Quantum Threat to Bitcoin",
      description:
        'RaceCanvas morphs to top-right corner (0.3× scale, 0.2 opacity, dormant). Title "Google\'s Quantum Threat to Bitcoin" (Montserrat Bold 56px, #e8e8ec) centered at (960, 440). Subtitle "How 1,200 qubits could break your keys" (Quicksand 28px, #888892) at (960, 520). "Let\'s rewind." in italic below. Thin horizontal line (400px) draws from center outward.',
      layout: 'centered',
      duration: 7000,
    },
    {
      label: 'What Is a Private Key?',
      text: '256 random bits. Your secret.',
      description:
        'Label "YOUR PRIVATE KEY" (Montserrat Bold 18px, tracking 4px) at (960, 280). 256-square bit grid (8×32, each 16×16px, 4px gap) centered at (960, 440). Each square flickers 0/1 then settles. Hex string "0x7f4e...a3b1" types out below (JetBrains Mono 20px). Caption: "256 random bits. Your secret." below hex. On exit, all 256 squares converge toward center.',
      layout: 'full-bleed',
      duration: 7000,
    },
    {
      label: 'What Is a Public Key?',
      text: 'Easy to compute forward. Impossible to reverse.',
      description:
        'Private key dot (20px, #e8e8ec) at left-center (380, 440). Horizontal arrow (400px) draws rightward with label "one-way trapdoor function" above midpoint. Public key dot (24px, brighter glow) appears at arrow endpoint (780, 440). Labels: "Private Key (k)" and "Public Key (P)". Dashed reverse arrow attempts right→left, gets 30% across, jitters, shatters into fragments. Red cross mark "✗" at break point. Caption centered at (580, 560).',
      layout: 'horizontal-flow',
      duration: 7000,
    },
    {
      label: 'The Elliptic Curve',
      text: 'Every Bitcoin key starts here.',
      description:
        'ECCCanvas (1200×800px, centered). Axes draw outward from origin. secp256k1 curve (y² = x³ + 7) traces left→right, two symmetric branches (3px stroke, subtle glow). Equation "y² = x³ + 7" (JetBrains Mono 24px) floats top-right. "secp256k1" label below equation. Generator point P snaps onto curve with pulse glow. Caption below canvas.',
      layout: 'full-bleed',
      duration: 8000,
    },
    {
      label: 'Point Addition',
      text: 'Point addition: the building block of ECC.',
      description:
        'ECCCanvas persists from Scene 5 (mode: POINT_ADD). Floating step labels top-left cycle through: "Step 1: Draw a tangent line at P" → tangent line draws → intersection point appears (12px, #888892) → "Step 2: Reflect across x-axis" → reflection line → result dot "2P" (16px, pulse glow) → "Step 3: Repeat" → second tangent from 2P → "3P" appears. Construction lines at low opacity. All three points (P, 2P, 3P) visible on curve. Caption bottom-center.',
      layout: 'full-bleed',
      duration: 10000,
    },
    {
      label: 'Scalar Multiplication',
      text: 'Easy: P × k → Public Key. Hard: Public Key → k ???',
      description:
        'ECCCanvas mode: SCALAR_MULT. Caption top: "Multiply the point by your private key..." Points cascade along curve: P→2P→4P→8P...→kP (~40 dots). First 4 at 0.4s stagger, accelerating to 0.05s. Counter top-right: "k = 2... 4... 8... 2²⁵⁶" (JetBrains Mono 18px). Final point (kP) pulses bright with label "kP = Public Key" underlined. Two-line caption bottom: "Easy: P × k → Public Key" (#888892) and "Hard: Public Key → k ???" (#991a1a red).',
      layout: 'full-bleed',
      duration: 9000,
    },
    {
      label: 'The Finite Field',
      text: 'Discrete points. No curve to trace.',
      description:
        'ECCCanvas mode: FINITE_FIELD. Caption: "But Bitcoin doesn\'t use a smooth curve..." THE MORPH (2.5s): smooth curve dissolves into discrete points — line becomes dotted → dots scatter from curve → resolve into grid at valid (x,y) on y² ≡ x³ + 7 (mod 97), ~60 dots (6px, #e8e8ec). Faint gridlines appear. Label: "mod 97 (simplified)". One dot pulses red (#ff2d2d, 10px) with arrow: "Your public key is HERE". Challenge: "Which \'k\' produced this point?" All other dots flash in sequence (0.02s stagger).',
      layout: 'full-bleed',
      duration: 10000,
    },
    {
      label: 'Why Classical Computers Can\'t',
      text: 'No shortcut exists. Only brute force.',
      description:
        'Dimmed finite field dots (0.6 opacity) persist left/background. Red dot still pulsing. Data card (600×300px, #1c1c22) slides in from right to x:1100. Card contents stagger: "2²⁵⁶ possible private keys" (JetBrains Mono 28px), "= 1.16 × 10⁷⁷", "At 1 billion checks/second:", "3.7 × 10⁶⁰ years" (32px). Comparison bars below: tiny bar "Age of universe: 1.38 × 10¹⁰ years" vs vastly longer bar (clipped) for 10⁶⁰. Caption: "No shortcut exists. Only brute force."',
      layout: 'asymmetric',
      duration: 8000,
    },
    {
      label: 'Script Types — First Foreshadowing',
      text: 'The fix was simple: hash the public key.',
      description:
        'Horizontal timeline draws left (x:200) to right (x:900), centered vertically. 2009 node (20px circle, #ff2d2d fill) at x:300 with "P2PK" label below (bold, red), description: "Public key ON chain", annotation: "⚠ Exposed". Arrow draws rightward. 2012 node (20px, neutral gray) at x:600 with "P2PKH" label, "Public key HIDDEN behind hash", "✓ Protected". Caption bottom: "The fix was simple: hash the public key." Three ellipsis dots after 2012 node hint at continuation.',
      layout: 'horizontal-flow',
      duration: 8000,
    },
    {
      label: 'PUNCH 1 — "Bitcoin is quantum-safe"',
      text: 'Not quite.',
      description:
        'Spotlight layout, background darkens to #050508. False claim: "Bitcoin uses strong cryptography." (Montserrat Bold 36px, centered). Subtext below: "So it must be quantum-safe." (Quicksand 24px, #888892). 0.8s beat. CrackEffect: SVG hairline fracture draws from center outward (#ff2d2d, 1px), two text halves separate ±8px. Correction: "Not quite." (Quicksand 28px, #ff2d2d) appears below cracked text.',
      layout: 'centered',
      duration: 6000,
    },

    // ── ACT 2: THE THREAT (Scenes 12–23) ──

    {
      label: 'Enter Quantum Computing',
      text: 'Superposition: both states at once.',
      description:
        'Split layout. Left (x:480): classical bit — coin circle (100px), solid white, "0" and "1" separated by line (static). Label: "Classical Bit", "Definitely 0 or 1". Center: "vs" label. Right (x:1440): qubit — same coin spinning on Y-axis (CSS 2s rotation), both 0 and 1 visible simultaneously, subtle red glow. Label: "Qubit", "0 AND 1 simultaneously". Caption bottom: "Superposition: both states at once." Scaling cascade below qubit: "1 qubit → 2 states ... 256 qubits → 2²⁵⁶ states" (final line in red).',
      layout: 'split-screen',
      duration: 8000,
    },
    {
      label: "Shor's Algorithm",
      text: 'Exponential speedup. The trapdoor is broken.',
      description:
        'Finite field dots re-mount at 0.6 opacity. Caption: "Classical approach: check one point at a time." One dot highlights, scans sequentially (~14 dots), counter: "Checked: 1... 2... 14". Caption swap: "This would take 3.7 × 10⁶⁰ years." Red horizontal wipe divider. New caption (#ff2d2d): "Shor\'s algorithm: test ALL points at once." ALL dots light up simultaneously — red glow wave from center outward. Counter jumps: "Checked: 2²⁵⁶". One "answer" dot found (14px, #ff2d2d glow ring, label: "k found."). CrackEffect fracture radiates from found dot. Caption: "Exponential speedup. The trapdoor is broken."',
      layout: 'full-bleed',
      duration: 10000,
    },
    {
      label: "Google's Resource Estimate",
      text: '1,200 qubits. 90M gates. ~20× reduction.',
      description:
        'Chart title: "Logical Resources to Break 256-bit ECDLP" (Montserrat Bold 22px). ResourceChart (1400×700px, centered, log-log scatter). Gray historical points appear with 0.5s stagger: "Proos+Zalka \'04", "Roetteler+ \'17", "Häner+ \'20", "Gouzien+ \'23", "Litinski \'23". Dashed trend arrow upper-right→lower-left. RED Google point (16px, pulsing) appears below/left of all others: "This Work \'26". Annotation card: "1,200 qubits / 90M gates" (#ff2d2d, red border-left). Distance label: "~20× reduction".',
      layout: 'data-overlay',
      duration: 10000,
    },
    {
      label: 'Physical Qubits',
      text: 'Fewer than 500,000 physical qubits. Runtime: ~9 minutes.',
      description:
        'ResourceChart dims to 0.2 opacity, shifts up. Left (x:350): large chip rectangle (500×300px) filled with dense dot grid (~10M qubits, #333340). Label: "Previous estimate", inside: "10M+ physical qubits". Brace annotation on left. Right (x:1300): dramatically smaller chip (120×70px), dots #ff2d2d. Label: "Google 2026", inside: "<500K". Arrow between with "20×" (Montserrat Bold 48px). Red glow pulse on small chip. Caption: "Fewer than 500,000 physical qubits. On hardware that exists today." Addendum: "Runtime: ~9 minutes from primed state." (#ff2d2d).',
      layout: 'asymmetric',
      duration: 9000,
    },
    {
      label: 'PUNCH 2 — "You\'d need millions"',
      text: 'The safety margin just evaporated.',
      description:
        'Spotlight, background #050508. False claim: "But you\'d need millions of qubits..." (Montserrat Bold 32px, centered). 0.5s beat. Red strikethrough line draws through "millions" (3px, #ff2d2d). Replacement "<500,000" scales in below (Montserrat Bold 40px, #ff2d2d). CrackEffect on original text. Caption: "The safety margin just evaporated." (Quicksand 22px, #888892).',
      layout: 'centered',
      duration: 6000,
    },
    {
      label: 'The On-Spend Attack',
      text: 'Your funds are stolen before your block confirms.',
      description:
        'Asymmetric split ~40/60. Left panel: step-by-step flow. "1. You broadcast a transaction" — TX box (100×50px) slides in, arrow to "Public Mempool" zone. "2. Your public key is now visible" — key icon lifts from TX, red highlight. Attacker eye icon top-right: "Quantum Attacker". "3. The race begins" — RaceCanvas activates right panel (60% viewport, EXPLAINED mode). Arc labels: "~9 min: key derivation" (red), "~10 min avg: block confirmation" (white). Red arc completes first. "4. Attacker forges a transaction" — red-bordered TX, original TX crossed out with "✗".',
      layout: 'asymmetric',
      duration: 11000,
    },
    {
      label: '41% Success Rate',
      text: '~41% success probability.',
      description:
        'Full-viewport RaceCanvas. Caption: "How often does the quantum attacker win?" Counter top-right: "Quantum wins: 0 / 0". Races run at 3× visual speed: Race 1-2 at ~1.2s each, then races 3-10 rapid-fire at ~0.5s each. Arcs reset and re-race each iteration. Quantum wins flash red, block wins dim flash. Counter converges to "~41 / 100" — "41" turns #ff2d2d, scales 20→36px. Final label: "~41% success probability" (Montserrat Bold 28px, #ff2d2d).',
      layout: 'full-bleed',
      duration: 10000,
    },
    {
      label: 'Attack Type Comparison',
      text: 'Two real threats. One that doesn\'t apply.',
      description:
        'Triptych: three panels (~580×600px each, 20px gaps) slide in from bottom. Panel 1 (red top border): mini racing arcs loop, "On-Spend Attack", "Race the block: ~9 min", "Success rate: ~41%", "Target: any active TX". Panel 2 (red top border): target/crosshair pulsing, "At-Rest Attack", "Unlimited time", "Target: exposed public keys", "1.7M+ BTC at risk". Panel 3 (GRAY border, dimmed bg #141418): factory icon static, "On-Setup Attack", "One-time backdoor", "Bitcoin: IMMUNE ✓", "No trusted setup". Caption: "Two real threats. One that doesn\'t apply."',
      layout: 'triptych',
      duration: 9000,
    },
    {
      label: 'Which Bitcoin Is Vulnerable?',
      text: '~6.9M BTC vulnerable (~$690B).',
      description:
        'Chart title: "BTC Supply by Script Type". SupplyChart (1600×700px): stacked area chart, x-axis 2009→2026, y-axis 0→20M BTC. Six bands draw left→right (3s): P2PK (crosshatch, bottom), P2PKH, P2SH, P2WPKH, P2WSH, P2TR (crosshatch red, top). Vulnerable areas flash red tint. Callout arrow to P2PK band: "1.7M BTC in P2PK — incl. Satoshi era mining rewards" (#ff2d2d). Counter top-right counts up: "~6.9M BTC vulnerable" (Montserrat Bold 32px, #ff2d2d). Dollar equivalent below: "(~$690B at $100K/BTC)".',
      layout: 'data-overlay',
      duration: 10000,
    },
    {
      label: 'PUNCH 3 — "Modern addresses hide the key"',
      text: 'Public key BACK on chain.',
      description:
        'SupplyChart fades to 0.15. False claim: "At least modern addresses hide the public key." (Montserrat Bold 28px, centered at y:350). Timeline from Scene 10 morphs back in at y:550. Original 2009 P2PK (red) and 2012 P2PKH (gray) nodes visible. Timeline extends right: 2017 P2WPKH (gray, "✓ Hidden"). Then 2021 P2TR — RED circle (#ff2d2d, same color as 2009 P2PK). Label: "P2TR", annotation: "Public key BACK on chain" (#ff2d2d). CrackEffect on false claim text.',
      layout: 'spotlight-timeline',
      duration: 7000,
    },
    {
      label: '★ The Taproot Irony',
      text: "Bitcoin's newest upgrade re-introduced its oldest vulnerability.",
      description:
        '★ HIGHLIGHT SCENE. Background breaks to #0f0508 (deep red-black). Dot grid shifts to red tint. VulnerabilityTimeline fills viewport width. Timeline nodes from Scene 21 visible. U-SHAPE VULNERABILITY CURVE draws on top: starts HIGH at 2009 P2PK, descends LOW through 2012-2017 (P2PKH/P2WPKH), then ASCENDS sharply back to same height at 2021 P2TR. Full-viewport red pulse flash when 2021 node matches 2009 height. Dashed connecting line: "SAME VULNERABILITY" between the two high points. Caption: "Bitcoin\'s newest upgrade re-introduced its oldest vulnerability." Sub: "Taproot (2021) = P2PK (2009)". Faint future hint: dashed "202? P2MR?" descending.',
      layout: 'spotlight-center',
      duration: 10000,
    },
    {
      label: 'Fast-Clock vs Slow-Clock',
      text: 'Which arrives first determines who\'s at risk first.',
      description:
        'Split screen, vertical divider at x:960. Left: "Fast-Clock CRQC" (Montserrat Bold 18px, bright). Chip icon with fast 2Hz pulse. Specs: "Superconducting / Photonic", "Gate speed: fast (μs)", "Runtime: minutes", "Enables: on-spend + at-rest" (#ff2d2d). Right: "Slow-Clock CRQC" (18px, muted). Different chip, slow 0.3Hz pulse. Specs in muted #555560: "Neutral Atom / Ion Trap", "Gate speed: slow (ms)", "Runtime: hours to days", "Enables: at-rest only". "on-spend" gets red underline on left panel. Caption spans both panels.',
      layout: 'split-screen',
      duration: 9000,
    },

    // ── ACT 3: RESPONSE (Scenes 24–33) ──

    {
      label: 'Why Proof-of-Work Is Safe',
      text: "Quantum mining isn't a real threat.",
      description:
        'Title: "What about mining?" Grover\'s speedup: "Grover\'s algorithm: √N speedup". Large "√N" (Montserrat Bold 64px) appears centered, looks impressive, then dims to #555560 with crossing-out line ("error correction eats the speedup"). Two comparison bars left-aligned: top bar 6px tall "Quantum miner — 0.25 TH/s", bottom bar 440px wide "ASIC S19 Pro — 110 TH/s" (full bright). Scale arrow: "440× weaker". Caption: "Quantum mining isn\'t a real threat." Sub: "Grover\'s √N speedup is eaten by error correction overhead."',
      layout: 'centered',
      duration: 8000,
    },
    {
      label: 'PUNCH 4 — "Just migrate"',
      text: 'Some keys are lost forever.',
      description:
        'Spotlight, background #050508. False claim: "We can just migrate to quantum-resistant addresses." (Montserrat Bold 28px). Checkmark SVG begins drawing in bright white — freezes at ~60% complete with x-oscillation jitter. CrackEffect shatters the partial checkmark into fragments. Correction: "Not everyone can migrate." (Quicksand 24px, #ff2d2d). Sub-text: "Some keys are lost forever." (Quicksand 18px, #888892).',
      layout: 'centered',
      duration: 6000,
    },
    {
      label: 'Responsible Disclosure',
      text: 'Prove the threat is real without giving the weapon away.',
      description:
        'Split screen. Left panel: "The Circuit" — rectangle with circuit pattern, heavy lock icon overlay, "CLASSIFIED" stamp rotated -15°, all grayed (#333340, #444450). Right panel: "The Proof" — three verification steps stagger in: "✓ We have a circuit", "✓ It correctly computes point addition on secp256k1", "✓ Verified on 9,000 random inputs" (gray checkmarks). Below: "SP1 zkVM + Groth16 SNARK" (12px, #555560). Dashed arrow from locked blueprint to verification: "zero-knowledge proof". Caption: "Prove the threat is real without giving the weapon away."',
      layout: 'split-screen',
      duration: 9000,
    },
    {
      label: 'Resource Reduction Trend',
      text: 'Attacks always get better.',
      description:
        'Chart title: "Physical Qubits to Break RSA-2048 (Over Time)". Log-log chart (Y: 1M→1B qubits, X: 2012→2026). Seven gray data points appear in sequence (0.4s stagger): 2012 (~1B), 2015 (~300M), 2017 (~200M), 2019 (~50M), 2021 (~20M), 2024 (~4M), 2025 (~1M). Trend line draws through points progressively — 1000× reduction over 13 years. Caption: "Attacks always get better." (#ff2d2d). Dashed extrapolation extends rightward with "?" at end. Annotation: "This pattern holds for ECDLP too."',
      layout: 'data-overlay',
      duration: 9000,
    },
    {
      label: 'BIP-360 P2MR',
      text: 'A patch, not a cure.',
      description:
        'VulnerabilityTimeline returns from Scene 22 via morph. U-shape visible: 2009 (high) → 2012 (low) → 2017 (low) → 2021 (high). Timeline extends right: new node "202? P2MR" at x:1500 (neutral gray, solid). Descending DASHED recovery arm draws from 2021 high point down to P2MR low point — stroke shifts #ff2d2d → #555568. Label: "BIP-360: Pay-to-Merkle-Root". Annotation: "Key hidden behind Merkle root again." Caveat in red: "Fixes at-rest attacks only. On-spend still vulnerable." Caption: "A patch, not a cure."',
      layout: 'horizontal-flow',
      duration: 8000,
    },
    {
      label: 'Immediate Mitigations',
      text: 'The real fix is post-quantum cryptography.',
      description:
        'Title: "What you can do NOW" (Montserrat Bold 22px). ShieldStack: four cards build upward from bottom, centered. Shield 1: "1. Stop reusing addresses" (icon: arrow, border-left #666672). Shield 2: "2. Avoid P2TR for large holdings" + sub "(Taproot re-exposes your key)" (#888892). Shield 3: "3. Use P2WPKH (SegWit)" (icon: ✓). Shield 4 (larger, red border-left #ff2d2d): "4. Prepare for PQC migration (BIP-360)" in red — most urgent. Caption: "Intermediate steps. The real fix is post-quantum cryptography."',
      layout: 'stacked',
      duration: 8000,
    },
    {
      label: 'THE DORMANT COIN PROBLEM',
      text: 'These keys are LOST.',
      description:
        'DARKEST SCENE — background #050508, ambient dot grid dead still. DormantVault: 8×6 grid (48 coin icons, 60×60px each, centered). Each coin = circle + lock icon, initially #444450. Coins stagger in (scale 0→1, 0.04s apart). Counter above: "0 BTC" → counts to "1,700,000 BTC" (Montserrat Bold 64px, turns #ff2d2d). Simultaneously, locks cascade red one-by-one (0.06s stagger). Captions below: "These keys are LOST.", "No owner can migrate them. No software update helps.", "Including Satoshi\'s ~1.1 million bitcoin." CrackEffect fracture radiates from grid center. Final: "They will sit there until a quantum computer takes them."',
      layout: 'spotlight-dark',
      duration: 11000,
    },
    {
      label: 'PUNCH 5 — Governance Triptych',
      text: 'The real problem is governance.',
      description:
        'Title: "The real problem isn\'t cryptography." (Montserrat Bold 24px). Three panels slide in from bottom (same format as Scene 19). Panel 1: "Do Nothing" — "Let quantum attackers take the coins." Risks: "$170B+ seized by unknown actors" (border-top #444450). Panel 2: "Burn" — "Destroy 1.7M BTC by protocol change." Risks: "confiscation precedent, supply shock" (border-top #ff2d2d). Panel 3: "Digital Salvage" — "Regulated recovery, like sunken treasure." Risks: "legal complexity, centralization" (border-top #666672). Large "?" (80px) below all panels. Caption: "The real problem is governance." CrackEffect on "cryptography" → replaced by "governance" in red.',
      layout: 'triptych',
      duration: 9000,
    },
    {
      label: 'The Urgency',
      text: 'The window is closing. The migration starts now.',
      description:
        'Horizontal timeline centered vertically. Node 1 (solid circle, #e8e8ec, left): "TODAY" / "2026". Solid line section labeled "Preparation window" above. Line becomes dashed. Node 2 (dashed circle, #ff2d2d border, right): "First CRQC" / "???". Brace above dashed section: "Unknown timeline". Bold arrow pointing LEFT from CRQC back to TODAY: "Migration must START now." (Montserrat Bold 18px, #ff2d2d). Small ticking clock icon near TODAY. Annotation: "Google\'s migration deadline: 2029". Caption: "The window is closing. The migration starts now."',
      layout: 'horizontal-flow',
      duration: 8000,
    },
    {
      label: 'CTA',
      text: 'Follow @bitcoin_devs',
      description:
        'Centered CTA card (800×400px, #1c1c22 bg, #333340 border, 12px rounded). All text stagger blurIn: "Follow @bitcoin_devs" (Montserrat Bold 28px), "Read the paper" (Quicksand 20px), "arxiv.org/abs/2603.28846" (JetBrains Mono 16px, underlined). Short horizontal divider (200px). "Next: How Post-Quantum Signatures Work" (Quicksand 20px, #555560). BDP logo/series badge at card bottom. Fade to black.',
      layout: 'centered',
      duration: 6000,
    },
  ],
};
