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
