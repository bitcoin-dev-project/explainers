import type { Emotion, EmotionConfig, LookDirection, Gesture, CharacterName, CharacterPreset, GestureConfig } from './types';

/*
  Stick figure anatomy (viewBox 0 0 140 220):

  Head center: (70, 36), r=26
  Left eye:    (59, 33)
  Right eye:   (81, 33)
  Mouth:       centered ~(70, 47)
  Shoulder:    (70, 82)
  Hip:         (70, 142)
*/

// ── Emotion → face configuration ─────────────────────────────────────

export const EMOTION_CONFIGS: Record<Emotion, EmotionConfig> = {
  neutral: {
    eyeR: 2.8,
    eyeOffsetX: 0,
    eyeOffsetY: 0,
    leftBrow: { y: 0, rotation: 0 },
    rightBrow: { y: 0, rotation: 0 },
    mouthPath: 'M 61,47 Q 70,53 79,47',
    mouthOpenRx: 0,
    mouthOpenRy: 0,
    headTilt: 0,
    bodyTilt: 0,
    showBlush: false,
  },

  happy: {
    eyeR: 1.8,
    eyeOffsetX: 0,
    eyeOffsetY: 0,
    leftBrow: { y: -2, rotation: 0 },
    rightBrow: { y: -2, rotation: 0 },
    mouthPath: 'M 57,45 Q 70,57 83,45',
    mouthOpenRx: 0,
    mouthOpenRy: 0,
    headTilt: 0,
    bodyTilt: 0,
    showBlush: true,
  },

  excited: {
    eyeR: 3.5,
    eyeOffsetX: 0,
    eyeOffsetY: 0,
    leftBrow: { y: -5, rotation: 0 },
    rightBrow: { y: -5, rotation: 0 },
    mouthPath: 'M 57,44 Q 70,58 83,44',
    mouthOpenRx: 5,
    mouthOpenRy: 3,
    headTilt: -2,
    bodyTilt: -2,
    showBlush: true,
  },

  curious: {
    eyeR: 2.8,
    eyeOffsetX: 2,
    eyeOffsetY: -1,
    leftBrow: { y: 0, rotation: 0 },
    rightBrow: { y: -5, rotation: -10 },
    mouthPath: 'M 63,48 Q 70,48 77,48',
    mouthOpenRx: 0,
    mouthOpenRy: 0,
    headTilt: -3,
    bodyTilt: -3,
    showBlush: false,
  },

  confused: {
    eyeR: 2.5,
    eyeOffsetX: -1,
    eyeOffsetY: 0,
    leftBrow: { y: -3, rotation: 12 },
    rightBrow: { y: -3, rotation: -12 },
    mouthPath: 'M 61,50 Q 70,44 79,50',
    mouthOpenRx: 0,
    mouthOpenRy: 0,
    headTilt: 4,
    bodyTilt: 0,
    showBlush: false,
  },

  thinking: {
    eyeR: 2.5,
    eyeOffsetX: -3,
    eyeOffsetY: -3,
    leftBrow: { y: -2, rotation: 5 },
    rightBrow: { y: -4, rotation: -5 },
    mouthPath: 'M 64,48 Q 73,45 78,50',
    mouthOpenRx: 0,
    mouthOpenRy: 0,
    headTilt: 3,
    bodyTilt: 0,
    showBlush: false,
  },

  surprised: {
    eyeR: 4,
    eyeOffsetX: 0,
    eyeOffsetY: 0,
    leftBrow: { y: -8, rotation: 0 },
    rightBrow: { y: -8, rotation: 0 },
    mouthPath: 'M 65,47 Q 70,53 75,47',
    mouthOpenRx: 4,
    mouthOpenRy: 5,
    headTilt: 0,
    bodyTilt: 2,
    showBlush: false,
  },

  worried: {
    eyeR: 2.8,
    eyeOffsetX: 0,
    eyeOffsetY: 1,
    leftBrow: { y: -4, rotation: 15 },
    rightBrow: { y: -4, rotation: -15 },
    mouthPath: 'M 61,50 Q 70,44 79,50',
    mouthOpenRx: 0,
    mouthOpenRy: 0,
    headTilt: 0,
    bodyTilt: 0,
    showBlush: false,
  },

  annoyed: {
    eyeR: 2,
    eyeOffsetX: 0,
    eyeOffsetY: 1,
    leftBrow: { y: 2, rotation: -10 },
    rightBrow: { y: 2, rotation: 10 },
    mouthPath: 'M 63,48 Q 70,48 77,48',
    mouthOpenRx: 0,
    mouthOpenRy: 0,
    headTilt: 0,
    bodyTilt: 0,
    showBlush: false,
  },

  explaining: {
    eyeR: 2.8,
    eyeOffsetX: 2,
    eyeOffsetY: 0,
    leftBrow: { y: -2, rotation: 0 },
    rightBrow: { y: -3, rotation: -5 },
    mouthPath: 'M 59,46 Q 70,54 81,46',
    mouthOpenRx: 0,
    mouthOpenRy: 0,
    headTilt: -2,
    bodyTilt: -2,
    showBlush: false,
  },

  laughing: {
    eyeR: 1.5,
    eyeOffsetX: 0,
    eyeOffsetY: 0,
    leftBrow: { y: -3, rotation: 0 },
    rightBrow: { y: -3, rotation: 0 },
    mouthPath: 'M 55,44 Q 70,60 85,44',
    mouthOpenRx: 7,
    mouthOpenRy: 4,
    headTilt: -2,
    bodyTilt: -2,
    showBlush: true,
  },
};

// ── Look direction → eye offsets ─────────────────────────────────────

export const LOOK_OFFSETS: Record<LookDirection, { x: number; y: number }> = {
  center: { x: 0, y: 0 },
  left: { x: -3, y: 0 },
  right: { x: 3, y: 0 },
  up: { x: 0, y: -3 },
  down: { x: 0, y: 3 },
};

// ── Gesture → arm endpoints ─────────────────────────────────────────
// Arms go from shoulder (70, 82) to these endpoints

export const GESTURE_CONFIGS: Record<Gesture, GestureConfig> = {
  none: {
    leftEnd:  { x: 40, y: 118 },
    leftCtrl: { x: 46, y: 98 },
    rightEnd:  { x: 100, y: 118 },
    rightCtrl: { x: 94, y: 98 },
  },
  wave: {
    leftEnd:  { x: 40, y: 118 },
    leftCtrl: { x: 46, y: 98 },
    rightEnd:  { x: 112, y: 32 },
    rightCtrl: { x: 110, y: 56 },
  },
  point: {
    leftEnd:  { x: 40, y: 118 },
    leftCtrl: { x: 46, y: 98 },
    rightEnd:  { x: 132, y: 76 },
    rightCtrl: { x: 108, y: 70 },
  },
  shrug: {
    leftEnd:  { x: 26, y: 60 },
    leftCtrl: { x: 38, y: 66 },
    rightEnd:  { x: 114, y: 60 },
    rightCtrl: { x: 102, y: 66 },
  },
  present: {
    leftEnd:  { x: 40, y: 118 },
    leftCtrl: { x: 46, y: 98 },
    rightEnd:  { x: 122, y: 48 },
    rightCtrl: { x: 110, y: 58 },
  },
};

// ── Character identity ──────────────────────────────────────────────

export const CHARACTER_PRESETS: Record<CharacterName, CharacterPreset> = {
  alice: {
    color: '#396BEB',     // blue (from brand)
    defaultFacing: 'right',
  },
  bob: {
    color: '#EB5234',     // BDP orange (from brand)
    defaultFacing: 'left',
  },
};

// Iterables
export const ALL_EMOTIONS: Emotion[] = [
  'neutral', 'happy', 'excited', 'curious', 'confused',
  'thinking', 'surprised', 'worried', 'annoyed', 'explaining', 'laughing',
];
export const ALL_GESTURES: Gesture[] = ['none', 'wave', 'point', 'shrug', 'present'];
export const ALL_LOOKS: LookDirection[] = ['center', 'left', 'right', 'up', 'down'];
