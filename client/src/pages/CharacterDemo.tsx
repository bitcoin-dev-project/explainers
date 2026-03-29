import { useState } from 'react';
import { Character } from '@/lib/video/characters';
import { ALL_EMOTIONS, ALL_GESTURES, ALL_LOOKS } from '@/lib/video/characters/emotions';
import type { Emotion, LookDirection, Gesture } from '@/lib/video/characters';

export default function CharacterDemo() {
  const [emotion, setEmotion] = useState<Emotion>('neutral');
  const [lookAt, setLookAt] = useState<LookDirection>('center');
  const [gesture, setGesture] = useState<Gesture>('none');
  const [showBubble, setShowBubble] = useState(false);

  const BUBBLE_TEXTS: Partial<Record<Emotion, { alice: string; bob: string }>> = {
    neutral: { alice: 'Hey Bob!', bob: 'Hey Alice!' },
    curious: { alice: 'What if we change one bit?', bob: 'Hmm, good question...' },
    explaining: { alice: 'The hash completely changes!', bob: 'That makes sense.' },
    surprised: { alice: 'Wait, really?!', bob: 'No way!' },
    confused: { alice: 'But how does that work?', bob: "I'm not sure either..." },
    happy: { alice: 'Now I get it!', bob: 'Me too!' },
    thinking: { alice: "Let me think about this...", bob: "There must be a pattern..." },
    worried: { alice: "What if someone finds a collision?", bob: "That would be bad..." },
    annoyed: { alice: "This is taking forever.", bob: "Tell me about it." },
    excited: { alice: "This is amazing!", bob: "I know, right?!" },
    laughing: { alice: "Ha! Classic off-by-one!", bob: "Every time!" },
  };

  const bubbles = BUBBLE_TEXTS[emotion];

  return (
    <div
      style={{
        width: '100vw',
        minHeight: '100vh',
        background: '#1a1a2e',
        fontFamily: 'var(--font-body)',
        color: 'white',
        padding: '2vw',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '2vw',
          textAlign: 'center',
          marginBottom: '1.5vw',
          color: '#F5E6D0',
        }}
      >
        Character System Preview
      </h1>

      {/* Controls */}
      <div
        style={{
          display: 'flex',
          gap: '2vw',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: '2vw',
        }}
      >
        {/* Emotion selector */}
        <div>
          <div style={{ fontSize: '0.9vw', opacity: 0.6, marginBottom: '0.4vw' }}>Emotion</div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '35vw' }}>
            {ALL_EMOTIONS.map((e) => (
              <button
                key={e}
                onClick={() => setEmotion(e)}
                style={{
                  background: emotion === e ? '#EB5234' : 'rgba(255,255,255,0.1)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '0.75vw',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  transition: 'background 0.15s',
                }}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Look direction */}
        <div>
          <div style={{ fontSize: '0.9vw', opacity: 0.6, marginBottom: '0.4vw' }}>Look At</div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {ALL_LOOKS.map((l) => (
              <button
                key={l}
                onClick={() => setLookAt(l)}
                style={{
                  background: lookAt === l ? '#396BEB' : 'rgba(255,255,255,0.1)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '0.75vw',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Gesture */}
        <div>
          <div style={{ fontSize: '0.9vw', opacity: 0.6, marginBottom: '0.4vw' }}>Gesture</div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {ALL_GESTURES.map((g) => (
              <button
                key={g}
                onClick={() => setGesture(g)}
                style={{
                  background: gesture === g ? '#0E9158' : 'rgba(255,255,255,0.1)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '0.75vw',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Speech bubble toggle */}
        <div>
          <div style={{ fontSize: '0.9vw', opacity: 0.6, marginBottom: '0.4vw' }}>Bubble</div>
          <button
            onClick={() => setShowBubble(!showBubble)}
            style={{
              background: showBubble ? '#F382AD' : 'rgba(255,255,255,0.1)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '0.75vw',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
            }}
          >
            {showBubble ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* ── Main preview — Alice & Bob facing each other ─── */}
      <div
        style={{
          position: 'relative',
          width: '70vw',
          height: '35vh',
          margin: '0 auto 3vw',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <Character
          name="alice"
          emotion={emotion}
          lookAt={lookAt}
          gesture={gesture}
          says={showBubble ? bubbles?.alice : undefined}
          position={{ x: '28%', y: '90%' }}
          size="13vw"
        />
        <Character
          name="bob"
          emotion={emotion}
          lookAt={lookAt}
          gesture={gesture}
          says={showBubble ? bubbles?.bob : undefined}
          position={{ x: '72%', y: '90%' }}
          size="13vw"
        />

        {/* Labels */}
        <div
          style={{
            position: 'absolute',
            bottom: '4%',
            left: '28%',
            transform: 'translateX(-50%)',
            fontSize: '1vw',
            fontFamily: 'var(--font-display)',
            color: '#F382AD',
          }}
        >
          Alice
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: '4%',
            left: '72%',
            transform: 'translateX(-50%)',
            fontSize: '1vw',
            fontFamily: 'var(--font-display)',
            color: '#EB5234',
          }}
        >
          Bob
        </div>
      </div>

      {/* ── Emotion gallery — all emotions at a glance ─── */}
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.3vw',
          textAlign: 'center',
          marginBottom: '1vw',
          color: '#F5E6D0',
          opacity: 0.8,
        }}
      >
        All Emotions
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '1.5vw',
          maxWidth: '70vw',
          margin: '0 auto',
        }}
      >
        {ALL_EMOTIONS.map((e) => (
          <div
            key={e}
            onClick={() => setEmotion(e)}
            style={{
              textAlign: 'center',
              cursor: 'pointer',
              padding: '0.5vw',
              borderRadius: '12px',
              background: emotion === e ? 'rgba(235,82,52,0.15)' : 'transparent',
              border: emotion === e ? '1px solid rgba(235,82,52,0.3)' : '1px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ position: 'relative', height: '8vw', marginBottom: '0.3vw' }}>
              <Character
                name="alice"
                emotion={e}
                size="5.5vw"
                style={{
                  position: 'absolute',
                  left: '50%',
                  bottom: '0',
                  transform: 'translate(-50%, 0)',
                }}
              />
            </div>
            <div
              style={{
                fontSize: '0.7vw',
                opacity: 0.7,
                fontFamily: 'var(--font-mono)',
                color: emotion === e ? '#EB5234' : 'white',
              }}
            >
              {e}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
