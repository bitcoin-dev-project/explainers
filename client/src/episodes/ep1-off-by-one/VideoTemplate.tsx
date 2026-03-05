import { AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
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
import { Scene14 } from './scenes/Scene14';
import { Scene15 } from './scenes/Scene15';

const SCENE_DURATIONS = {
  scene1: 6000,    // Title
  scene2: 9000,    // Epochs: 2016 blocks, difficulty adjusts
  scene3: 8000,    // Retarget period intro
  scene4: 8000,    // Quiz hook question (A or B?)
  scene5: 10000,   // 10 min/block → 14 days (blocks + brace)
  scene6: 6000,    // "But is it really 14 days?"
  scene7: 8000,    // Simple example: 5 blocks = 4 intervals
  scene8: 8000,    // "How long did the last epoch take?"
  scene9: 9000,    // Correct: Block 2015 → Block 4031 = 2016 intervals
  scene10: 11000,  // Bug: code + Block 2016 → Block 4031 = 2015 intervals
  scene11: 10000,  // Math: 2015 vs 2016
  scene12: 10000,  // Days comparison cards
  scene13: 10000,  // +0.05% bias
  scene14: 10000,  // Quiz answer reveal
  scene15: 9000,   // TimeWarp
};

export default function VideoTemplate() {
  const { currentScene } = useVideoPlayer({
    durations: SCENE_DURATIONS,
  });

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
        {currentScene === 13 && <Scene14 key="scene14" />}
        {currentScene === 14 && <Scene15 key="scene15" />}
      </AnimatePresence>
    </div>
  );
}
