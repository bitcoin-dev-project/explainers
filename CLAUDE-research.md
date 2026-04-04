# Research Agent Guide — Bitcoin Explainer Series

Lightweight context for research-phase agents. You are researching a topic for an animated Bitcoin explainer video.

## What We Make
Short animated explainer videos (React + Framer Motion + GSAP, recorded to MP4 via Playwright + FFmpeg). Target audience: developers and technically curious people. Style: 3Blue1Brown / Artem Kirsanov quality.

## Teaching Approaches (pick the best one for the topic)
1. **Problem > Failure > Fix Loop** — build naive system, show how it breaks, fix, repeat. Best for protocol design, system architecture.
2. **Specific > General** — concrete example with real values first, then abstract rule. A worked SHA-256 round beats the algorithm definition.
3. **Analogy-First** — only when analogy fits naturally.
4. **Definition-Deep-Dive** — define, then layer complexity scene by scene.
5. **Wrong > Less Wrong > Right** — start wrong, refine toward correct.
6. **Dialogue-Driven** — Alice & Bob discuss conversationally. Best for Q&A-style topics.

## Emotional Arc
Curiosity > Confusion > Partial clarity > **Aha moment** > Satisfaction.

## Tone & Voice
- Casual-educational, peer-to-peer. ELI5 ethos on deep topics.
- Direct address: "Let's see...", "Now let's look inside..."
- Conversational pacing. Never academic or stiff.
- **Never force analogies.** Only when they map naturally.
- Hooks use Jack Butcher style (compression, contrast pairs, reframes). Teaching stays plain and clear.

## Content Checklist
- Pick a topic people have heard of but don't really understand
- Find a natural analogy (or skip it if none fits)
- Open from what the viewer already knows, then build toward the technical concept
- Use a real worked example with actual values when possible
- End with CTA on last scene

## Scene Rules (for storyboarding)
- **One idea per scene.** One concept, one step, one point.
- **Scene 1 = Title.** Scene 2 = start from familiar ground — don't open with jargon.
- **Last scene = CTA** ("Follow @bitcoin_devs") + optional series teaser.
- **Scene duration = content density.** Simple text: 6-7s. Diagram: 8-10s. Complex animation: 10-12s. Never exceed 12s.
- **Use as many scenes as needed.** More scenes with less content > fewer dense scenes.

## Text Rules
- **Text inside visuals** (labels, values, formulas): ENCOURAGED, no word limit.
- **Screen-space captions**: ONE sentence, max ~15 words.
- **No paragraphs on screen.** 3+ sentences = split across scenes.
- **Use real values.** "bitcoin" → `01100010...` beats "the input gets converted to binary."
- **Progressive reveal.** Each scene adds ONE piece.

## What You Do NOT Need
You don't need animation toolkit details, Camera system docs, GSAP utilities, code patterns, or episode architecture. Those are for the build phase only.
