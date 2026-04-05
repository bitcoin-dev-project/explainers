import { useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useVideoPlayer, useEpisodeAudioExport, DevControls } from '@/lib/video';
import { Scene1 } from './scenes/Scene1';
import { Scene2 } from './scenes/Scene2';
import { Scene3 } from './scenes/Scene3';
import { Scene4 } from './scenes/Scene4';
import { Scene5 } from './scenes/Scene5';
import { Scene6 } from './scenes/Scene6';
import { Scene7 } from './scenes/Scene7';
import { Scene8 } from './scenes/Scene8';

const SCENE_DURATIONS = {
  scene1: 7000,    // Episode 2: SegWit Address (audio 4.2s)
  scene2: 10000,   // Bech32, not base58 (audio 7.5s)
  scene3: 14000,   // Address breakdown (audio 11.2s)
  scene4: 12000,   // Data = version + witness (audio 9.4s)
  scene5: 21000,   // Decode grid + color coding (audio 17.8s)
  scene6: 35000,   // Decode steps: version → witness → checksum (audio 29.1s)
  scene7: 24000,   // Step 4: Binary → WPKH hex (audio 20.8s)
  scene8: 6000,    // CTA: Follow Merkle (audio 3.1s)
};

const SCENE_AUDIO = [
  '/audio/ep2-segwit/scene1.mp3',
  '/audio/ep2-segwit/scene2.mp3',
  '/audio/ep2-segwit/scene3.mp3',
  '/audio/ep2-segwit/scene4.mp3',
  '/audio/ep2-segwit/scene5.mp3',
  '/audio/ep2-segwit/scene6.mp3',
  '/audio/ep2-segwit/scene7.mp3',
  '/audio/ep2-segwit/scene8.mp3',
];

export default function SegWitVideoTemplate() {
  const player = useVideoPlayer({
    durations: SCENE_DURATIONS,
  });
  const { currentScene } = player;

  useEpisodeAudioExport({
    kind: 'scenes',
    scenePaths: SCENE_AUDIO,
    offsetMs: 400,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Stop previous audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    // Play audio for current scene after a small delay for the transition
    const timer = setTimeout(() => {
      const audio = new Audio(SCENE_AUDIO[currentScene]);
      audio.play().catch(() => {}); // ignore autoplay errors on first load
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
      className="w-full h-screen overflow-hidden relative"
      style={{ backgroundColor: '#ECD4B5' }}
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
      </AnimatePresence>
      <DevControls player={player} />
    </div>
  );
}
