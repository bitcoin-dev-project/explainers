// Video template library - hook and animation presets

export { useVideoPlayer, useSceneTimer } from './hooks';
export type { SceneDurations, UseVideoPlayerOptions, UseVideoPlayerReturn } from './hooks';
export { DevControls } from './DevControls';

export {
  springs,
  easings,
  sceneTransitions,
  elementAnimations,
  charVariants,
  charContainerVariants,
  staggerConfigs,
  containerVariants,
  itemVariants,
  staggerDelay,
  customSpring,
  withDelay,
} from './animations';

export {
  DiagramBox,
  Arrow,
  Connector,
  FlowRow,
  Badge,
  DataCell,
  TableGrid,
  Brace,
  TreeNode,
  HighlightBox,
} from './diagrams';

// Single-canvas architecture (3B1B-style)
export { CE, morph, sceneRange, createThemedCE, ceThemes } from './canvas';
export type { CETheme } from './canvas';

// Camera — viewport pan/zoom + shot helpers + dev minimap
export { Camera, focus, fitRect, visibility } from './camera';
export type { CameraShot, CameraZone } from './camera';

// Stage/Act — declarative layout system (new episodes, ep13+)
export { Stage, Act } from './stage';
export type { StageProps, ActProps, ActShot } from './stage';

// Audio sync — voiceover playback + timing helpers
export { useAudioSync, syncTo, durationsFromAudio } from './audio-sync';

// GSAP utilities — imperative timeline animations
export { useGSAP, useTimeline, useSceneGSAP, gsapPresets } from './gsap-utils';

// Characters — expressive SVG stick figure characters with speech bubbles
export { Character, SpeechBubble } from './characters';
export type { CharacterProps, CharacterName, Emotion, LookDirection, Gesture } from './characters';
