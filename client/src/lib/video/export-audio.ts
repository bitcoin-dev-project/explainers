import { useEffect } from 'react';

export type EpisodeAudioExport =
  | {
      kind: 'continuous';
      src: string;
      sceneStartTimes: number[];
    }
  | {
      kind: 'scenes';
      scenePaths: string[];
      offsetMs?: number;
    };

declare global {
  interface Window {
    __episodeAudio?: EpisodeAudioExport;
  }
}

export function useEpisodeAudioExport(audio: EpisodeAudioExport | null) {
  useEffect(() => {
    if (!audio) {
      delete window.__episodeAudio;
      return;
    }

    window.__episodeAudio = audio;
    return () => {
      delete window.__episodeAudio;
    };
  }, [audio]);
}
