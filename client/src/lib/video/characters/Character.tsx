import { motion, AnimatePresence } from 'framer-motion';
import { SpeechBubble } from './SpeechBubble';
import { EMOTION_CONFIGS, LOOK_OFFSETS, GESTURE_CONFIGS, CHARACTER_PRESETS } from './emotions';
import type { CharacterProps } from './types';

// ── Stick figure anatomy ─────────────────────────────────────────────
//
//     ViewBox: 0 0 140 220
//
//          ___
//         /   \        Head: cx=70, cy=36, r=26
//        | o o |       Eyes: (59,33) (81,33)
//         \_‿_/        Mouth: ~(70,47)
//           |          Neck/body top: (70,62)
//          /|\         Shoulder: (70,82)
//         / | \        Arms: from shoulder to gesture endpoints
//           |          Body: line to (70,142)
//          / \         Legs: to (52,196) and (88,196)
//         /   \        Shoes: small curves at feet
//
// ─────────────────────────────────────────────────────────────────────

const FACE_COLOR = '#2D2B2B';
const HEAD_FILL = 'white';

// Stroke widths
const BODY_W = 4.5;
const HEAD_W = 4;
const FACE_W = 2.5;
const SHOE_W = 5;

// Anatomy landmarks
const HEAD = { cx: 70, cy: 36, r: 26 };
const LEFT_EYE = { cx: 59, cy: 33 };
const RIGHT_EYE = { cx: 81, cy: 33 };
const SHOULDER = { x: 70, y: 82 };
const HIP = { x: 70, y: 142 };
const LEFT_FOOT = { x: 52, y: 196 };
const RIGHT_FOOT = { x: 88, y: 196 };

const spring = { type: 'spring' as const, stiffness: 250, damping: 22 };

const positionSpring = { type: 'spring' as const, stiffness: 120, damping: 22 };

export function Character({
  name,
  emotion = 'neutral',
  lookAt = 'center',
  gesture = 'none',
  says,
  facing,
  position,
  size = '10vw',
  className,
  style,
  transition: customTransition,
}: CharacterProps) {
  const preset = CHARACTER_PRESETS[name];
  const emo = EMOTION_CONFIGS[emotion];
  const look = LOOK_OFFSETS[lookAt];
  const gest = GESTURE_CONFIGS[gesture];

  const actualFacing = facing ?? preset.defaultFacing;
  const isFlipped = actualFacing === 'left';
  const color = preset.color;

  // Eye positions with look + emotion offsets
  const leX = LEFT_EYE.cx + look.x + emo.eyeOffsetX;
  const leY = LEFT_EYE.cy + look.y + emo.eyeOffsetY;
  const reX = RIGHT_EYE.cx + look.x + emo.eyeOffsetX;
  const reY = RIGHT_EYE.cy + look.y + emo.eyeOffsetY;

  return (
    <motion.div
      className={className}
      style={{
        position: 'absolute',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        transform: 'translate(-50%, -100%)',
        ...style,
      }}
      animate={{
        ...(position && { left: position.x, top: position.y }),
        width: size,
      }}
      transition={customTransition ?? positionSpring}
    >
      {/* ─── Speech Bubble ─── */}
      <AnimatePresence>
        {says && <SpeechBubble key="speech" text={says} />}
      </AnimatePresence>

      {/* ─── Stick Figure SVG ─── */}
      <motion.svg
        viewBox="0 0 140 220"
        style={{
          width: size,
          height: 'auto',
          overflow: 'visible',
          transform: isFlipped ? 'scaleX(-1)' : 'none',
        }}
        animate={{ rotate: emo.bodyTilt }}
        transition={spring}
      >
        {/* ════════════════════════════════════════════════════════
            LEGS — two lines from hip to feet + shoes
        ════════════════════════════════════════════════════════ */}
        <line
          x1={HIP.x} y1={HIP.y}
          x2={LEFT_FOOT.x} y2={LEFT_FOOT.y}
          stroke={color}
          strokeWidth={BODY_W}
          strokeLinecap="round"
        />
        <line
          x1={HIP.x} y1={HIP.y}
          x2={RIGHT_FOOT.x} y2={RIGHT_FOOT.y}
          stroke={color}
          strokeWidth={BODY_W}
          strokeLinecap="round"
        />

        {/* Shoes — small angled lines at feet */}
        <line
          x1={LEFT_FOOT.x} y1={LEFT_FOOT.y}
          x2={LEFT_FOOT.x - 12} y2={LEFT_FOOT.y + 4}
          stroke={color}
          strokeWidth={SHOE_W}
          strokeLinecap="round"
        />
        <line
          x1={RIGHT_FOOT.x} y1={RIGHT_FOOT.y}
          x2={RIGHT_FOOT.x + 12} y2={RIGHT_FOOT.y + 4}
          stroke={color}
          strokeWidth={SHOE_W}
          strokeLinecap="round"
        />

        {/* ════════════════════════════════════════════════════════
            BODY — single vertical line
        ════════════════════════════════════════════════════════ */}
        <line
          x1={70} y1={62}
          x2={HIP.x} y2={HIP.y}
          stroke={color}
          strokeWidth={BODY_W}
          strokeLinecap="round"
        />

        {/* ════════════════════════════════════════════════════════
            ARMS — curved paths from shoulder to endpoints
        ════════════════════════════════════════════════════════ */}
        <motion.path
          stroke={color}
          strokeWidth={BODY_W}
          strokeLinecap="round"
          fill="none"
          animate={{
            d: `M ${SHOULDER.x},${SHOULDER.y} Q ${gest.leftCtrl.x},${gest.leftCtrl.y} ${gest.leftEnd.x},${gest.leftEnd.y}`,
          }}
          transition={spring}
        />
        <motion.path
          stroke={color}
          strokeWidth={BODY_W}
          strokeLinecap="round"
          fill="none"
          animate={{
            d: `M ${SHOULDER.x},${SHOULDER.y} Q ${gest.rightCtrl.x},${gest.rightCtrl.y} ${gest.rightEnd.x},${gest.rightEnd.y}`,
          }}
          transition={spring}
        />

        {/* ════════════════════════════════════════════════════════
            HEAD — circle with white fill, tilts with emotion
        ════════════════════════════════════════════════════════ */}
        <motion.g
          style={{ transformOrigin: `${HEAD.cx}px ${HEAD.cy + HEAD.r}px` }}
          animate={{ rotate: emo.headTilt }}
          transition={spring}
        >
          {/* Head circle */}
          <circle
            cx={HEAD.cx}
            cy={HEAD.cy}
            r={HEAD.r}
            fill={HEAD_FILL}
            stroke={color}
            strokeWidth={HEAD_W}
          />

          {/* ── Eyebrows ── */}
          <motion.line
            x1={53} y1={23} x2={65} y2={23}
            stroke={FACE_COLOR}
            strokeWidth={FACE_W}
            strokeLinecap="round"
            style={{ transformOrigin: '59px 23px' }}
            animate={{ y: emo.leftBrow.y, rotate: emo.leftBrow.rotation }}
            transition={spring}
          />
          <motion.line
            x1={75} y1={23} x2={87} y2={23}
            stroke={FACE_COLOR}
            strokeWidth={FACE_W}
            strokeLinecap="round"
            style={{ transformOrigin: '81px 23px' }}
            animate={{ y: emo.rightBrow.y, rotate: emo.rightBrow.rotation }}
            transition={spring}
          />

          {/* ── Eyes ── */}
          <motion.circle
            fill={FACE_COLOR}
            animate={{ cx: leX, cy: leY, r: emo.eyeR }}
            transition={spring}
          />
          <motion.circle
            fill={FACE_COLOR}
            animate={{ cx: reX, cy: reY, r: emo.eyeR }}
            transition={spring}
          />

          {/* ── Mouth ── */}
          {/* Open mouth fill (surprised, laughing, excited) */}
          <motion.ellipse
            cx={70}
            cy={49}
            fill={FACE_COLOR}
            animate={{
              rx: Math.max(0, emo.mouthOpenRx),
              ry: Math.max(0, emo.mouthOpenRy),
              opacity: emo.mouthOpenRx > 0 ? 1 : 0,
            }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          />
          {/* Mouth curve */}
          <motion.path
            fill="none"
            stroke={FACE_COLOR}
            strokeWidth={FACE_W}
            strokeLinecap="round"
            animate={{ d: emo.mouthPath }}
            transition={spring}
          />

          {/* ── Blush ── */}
          <motion.g
            animate={{ opacity: emo.showBlush ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ellipse cx={50} cy={42} rx={6} ry={3.5} fill="rgba(255,120,120,0.3)" />
            <ellipse cx={90} cy={42} rx={6} ry={3.5} fill="rgba(255,120,120,0.3)" />
          </motion.g>
        </motion.g>
      </motion.svg>
    </motion.div>
  );
}
