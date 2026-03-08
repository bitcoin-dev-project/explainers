import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useVideoPlayer, DevControls } from '@/lib/video';
import { PersistentGate } from './scenes/PersistentGate';
import { Scene1 } from './scenes/Scene1';
import { Scene2 } from './scenes/Scene2';
import { Scene3 } from './scenes/Scene3';
import { Scene4 } from './scenes/Scene4';
import { Scene5 } from './scenes/Scene5';
import { Scene6 } from './scenes/Scene6';
import { Scene7 } from './scenes/Scene7';
import { Scene7b } from './scenes/Scene7b';
import { Scene8 } from './scenes/Scene8';
import { Scene9 } from './scenes/Scene9';
import { Scene9b } from './scenes/Scene9b';
import { Scene10 } from './scenes/Scene10';
import { Scene11 } from './scenes/Scene11';
import { Scene12 } from './scenes/Scene12';
import { Scene13 } from './scenes/Scene13';
import { Scene14 } from './scenes/Scene14';
import { Scene14b } from './scenes/Scene14b';
import { Scene14c } from './scenes/Scene14c';
import { Scene14d } from './scenes/Scene14d';
import { Scene15 } from './scenes/Scene15';

// Durations = audio length + buffer for transition/breathing room
const SCENE_DURATIONS = {
  scene1: 13000,    // audio 10.6s — Title: Garbled Circuits
  scene2: 19000,    // audio 16.2s — Millionaire's Problem
  scene3: 22000,    // audio 19.5s — Alice & Bob party question
  scene4: 17500,    // audio 15.0s — AND gate
  scene5: 23000,    // audio 20.2s — Truth table
  scene6: 23000,    // audio 20.6s — Privacy problem
  scene7: 10500,    // audio  8.2s — What if we could compute without seeing?
  scene7b: 19000,   // audio 16.1s — Garbler & Evaluator roles
  scene8: 28000,    // audio 25.2s — Step 1: random keys
  scene9: 24000,    // audio 21.0s — Step 2: encrypt with two keys
  scene9b: 18000,   // audio 15.1s — Garbled table rows
  scene10: 21500,   // audio 19.0s — Step 3: shuffle rows
  scene11: 24500,   // audio 22.0s — Step 4: Oblivious Transfer
  scene12: 27000,   // audio 24.4s — Step 5a: Bob's inventory
  scene13: 32000,   // audio 29.0s — Step 5b: Decryption attempts
  scene14: 22500,   // audio 20.0s — Privacy preserved
  scene14b: 13000,  // audio 10.4s — One gate recap
  scene14c: 27000,  // audio 24.1s — Chaining gates
  scene14d: 30000,  // audio 27.1s — Trade-off
  scene15: 13500,   // audio 10.8s — BitVM teaser + CTA
};

const SCENE_AUDIO = [
  '/audio/ep4-garbled-circuits/scene1.mp3',
  '/audio/ep4-garbled-circuits/scene2.mp3',
  '/audio/ep4-garbled-circuits/scene3.mp3',
  '/audio/ep4-garbled-circuits/scene4.mp3',
  '/audio/ep4-garbled-circuits/scene5.mp3',
  '/audio/ep4-garbled-circuits/scene6.mp3',
  '/audio/ep4-garbled-circuits/scene7.mp3',
  '/audio/ep4-garbled-circuits/scene7b.mp3',
  '/audio/ep4-garbled-circuits/scene8.mp3',
  '/audio/ep4-garbled-circuits/scene9.mp3',
  '/audio/ep4-garbled-circuits/scene9b.mp3',
  '/audio/ep4-garbled-circuits/scene10.mp3',
  '/audio/ep4-garbled-circuits/scene11.mp3',
  '/audio/ep4-garbled-circuits/scene12.mp3',
  '/audio/ep4-garbled-circuits/scene13.mp3',
  '/audio/ep4-garbled-circuits/scene14.mp3',
  '/audio/ep4-garbled-circuits/scene14b.mp3',
  '/audio/ep4-garbled-circuits/scene14c.mp3',
  '/audio/ep4-garbled-circuits/scene14d.mp3',
  '/audio/ep4-garbled-circuits/scene15.mp3',
];

/* Gate panel is visible for scenes 7–14 (indices 6–15) */
const GATE_FIRST = 6;
const GATE_LAST  = 15;

export default function GarbledCircuitsVideoTemplate() {
  const player = useVideoPlayer({ durations: SCENE_DURATIONS });
  const { currentScene } = player;

  const showGate = currentScene >= GATE_FIRST && currentScene <= GATE_LAST;

  // Audio playback synced to scene changes
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    const timer = setTimeout(() => {
      const audio = new Audio(SCENE_AUDIO[currentScene]);
      audio.play().catch(() => {});
      audioRef.current = audio;
    }, 400);
    return () => {
      clearTimeout(timer);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [currentScene]);

  return (
    <div
      data-video="ep4"
      className="w-full h-screen overflow-hidden relative flex"
      style={{
        '--color-secondary': '#F1760D',
        '--color-primary': '#264653',
        '--color-bg-light': '#ECD4B5',
        '--color-bg-muted': '#E8D5B8',
        backgroundColor: '#ECD4B5',
      } as React.CSSProperties}
    >
      {/* Scene content (left panel, or full-width for non-gate scenes) */}
      <div className="flex-1 h-screen overflow-hidden relative" style={{ backgroundColor: '#ECD4B5' }}>
        <AnimatePresence mode="wait">
          {/* Full-screen scenes (no gate) */}
          {currentScene === 0  && <Scene1  key="s1" />}
          {currentScene === 1  && <Scene2  key="s2" />}
          {currentScene === 2  && <Scene3  key="s3" />}
          {currentScene === 3  && <Scene4  key="s4" />}
          {currentScene === 4  && <Scene5  key="s5" />}
          {currentScene === 5  && <Scene6  key="s6" />}

          {/* Left-panel scenes (gate on right) */}
          {currentScene === 6  && <Scene7  key="s7" />}
          {currentScene === 7  && <Scene7b key="s7b" />}
          {currentScene === 8  && <Scene8  key="s8" />}
          {currentScene === 9  && <Scene9  key="s9" />}
          {currentScene === 10 && <Scene9b key="s9b" />}
          {currentScene === 11 && <Scene10 key="s10" />}
          {currentScene === 12 && <Scene11 key="s11" />}
          {currentScene === 13 && <Scene12 key="s12" />}
          {currentScene === 14 && <Scene13 key="s13" />}
          {currentScene === 15 && <Scene14 key="s14" />}

          {/* Full-screen again */}
          {currentScene === 16 && <Scene14b key="s14b" />}
          {currentScene === 17 && <Scene14c key="s14c" />}
          {currentScene === 18 && <Scene14d key="s14d" />}
          {currentScene === 19 && <Scene15 key="s15" />}
        </AnimatePresence>
      </div>

      {/* Persistent AND gate panel (right side) */}
      <AnimatePresence>
        {showGate && (
          <motion.div
            key="gate-panel"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: '30vw', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: 'circOut' }}
            className="h-full shrink-0 overflow-hidden"
          >
            <PersistentGate sceneIndex={currentScene} />
          </motion.div>
        )}
      </AnimatePresence>

      <DevControls player={player} />
    </div>
  );
}
