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

// Camera — viewport pan/zoom
export { Camera } from './camera';

// GSAP utilities — imperative timeline animations
export { useGSAP, useTimeline, useSceneGSAP, gsapPresets } from './gsap-utils';
