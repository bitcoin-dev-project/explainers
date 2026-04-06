import { AnimatePresence } from 'framer-motion';
import { useVideoPlayer, DevControls } from '@/lib/video';
import { Scene1 } from './scenes/Scene1';
import { Scene2 } from './scenes/Scene2';
import { Scene3 } from './scenes/Scene3';
import { Scene4 } from './scenes/Scene4';
import { Scene5 } from './scenes/Scene5';
import { Scene6 } from './scenes/Scene6';
import { Scene7 } from './scenes/Scene7';
import { Scene8 } from './scenes/Scene8';
import { Scene9 } from './scenes/Scene9';
import { Scene10 } from './scenes/Scene10';
import { Scene11 } from './scenes/Scene11';
import { Scene12 } from './scenes/Scene12';
import { Scene13 } from './scenes/Scene13';

const SCENE_DURATIONS = {
  scene1: 6000,    // Title: Part 1 — SHA-256 Padding
  scene2: 7000,    // SHA-256 is used everywhere in Bitcoin
  scene3: 8000,    // Hashing as black box: Input → Black Box → Hash
  scene4: 7000,    // Look inside the black box: Input → ? → Hash
  scene5: 9000,    // Three internal steps: Padding, Message schedule, Compression
  scene6: 7000,    // Focus on Padding: Input → Padding → Hash
  scene7: 6000,    // Input text: "bitcoin"
  scene8: 12000,   // Step 1: ASCII conversion + concatenation
  scene9: 8000,    // Step 2: Append "1" bit
  scene10: 11000,  // Step 3: Add length (calculate + append 64-bit)
  scene11: 10000,  // 512-bit blocks + zero padding math
  scene12: 11000,  // Full padded message visualization
  scene13: 8000,   // Next step: Message schedule + CTA
};

export default function SHA256VideoTemplate() {
  const player = useVideoPlayer({
    durations: SCENE_DURATIONS,
  });
  const { currentScene } = player;

  return (
    <div
      className="w-full h-screen overflow-hidden relative"
      style={{ backgroundColor: 'var(--color-bg-light)' }}
    >
      <AnimatePresence mode="wait">
        {currentScene === 0 && <Scene1 key="scene1" />}
        {currentScene === 1 && <Scene2 key="scene2" />}
        {currentScene === 2 && <Scene3 key="scene3" />}
        {currentScene === 3 && <Scene4 key="scene4" />}
        {currentScene === 4 && <Scene5 key="scene5" />}
        {currentScene === 5 && <Scene6 key="scene6" />}
        {currentScene === 6 && <Scene7 key="scene7" />}
        {currentScene === 7 && <Scene8 key="scene8" />}
        {currentScene === 8 && <Scene9 key="scene9" />}
        {currentScene === 9 && <Scene10 key="scene10" />}
        {currentScene === 10 && <Scene11 key="scene11" />}
        {currentScene === 11 && <Scene12 key="scene12" />}
        {currentScene === 12 && <Scene13 key="scene13" />}
      </AnimatePresence>
      <DevControls player={player} />
    </div>
  );
}
