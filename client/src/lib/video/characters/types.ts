// Character system types — stick figure design

export type CharacterName = 'alice' | 'bob';

export type Emotion =
  | 'neutral'
  | 'happy'
  | 'excited'
  | 'curious'
  | 'confused'
  | 'thinking'
  | 'surprised'
  | 'worried'
  | 'annoyed'
  | 'explaining'
  | 'laughing';

export type LookDirection = 'left' | 'right' | 'up' | 'down' | 'center';

export type Gesture = 'none' | 'wave' | 'point' | 'shrug' | 'present';

export interface CharacterProps {
  name: CharacterName;
  emotion?: Emotion;
  lookAt?: LookDirection;
  gesture?: Gesture;
  says?: string;
  facing?: 'left' | 'right';
  position?: { x: string; y: string };
  size?: string;
  className?: string;
  style?: React.CSSProperties;
  /** Spring transition config for position/size changes between scenes */
  transition?: Record<string, unknown>;
}

// Internal config types

export interface EmotionConfig {
  eyeR: number;
  eyeOffsetX: number;
  eyeOffsetY: number;
  leftBrow: BrowConfig;
  rightBrow: BrowConfig;
  mouthPath: string;
  mouthOpenRx: number;
  mouthOpenRy: number;
  headTilt: number;
  bodyTilt: number;
  showBlush: boolean;
}

export interface BrowConfig {
  y: number;
  rotation: number;
}

export interface GestureConfig {
  leftEnd: { x: number; y: number };
  leftCtrl: { x: number; y: number };
  rightEnd: { x: number; y: number };
  rightCtrl: { x: number; y: number };
}

export interface CharacterPreset {
  color: string;
  defaultFacing: 'left' | 'right';
}
