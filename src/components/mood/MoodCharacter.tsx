import React, { useEffect, useId } from 'react';
import Animated, {
  DerivedValue,
  cancelAnimation,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  FeGaussianBlur,
  Filter,
  G,
  Path,
  Pattern,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import { MOODS, type MoodFace } from '../../constants/moods';
import type { MoodColor } from '../../types/entry';

const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

export type Gaze = { x: number; y: number };

type Props = {
  mood: MoodColor;
  size: number;
  /** Normalised −1..1 look direction shared with the parent gesture. */
  gaze?: DerivedValue<Gaze>;
  /** Enables blinking. Off for static copies such as the blurred depth layer. */
  alive?: boolean;
  /** Gaussian blur radius in viewBox units, for carousel depth. */
  blur?: number;
  /** Bedtime look: striped pyjama top and a floppy nightcap. */
  outfit?: 'pajamas';
};

// Geometry is authored in a 200 × 232 box whose origin is shifted up 12 units
// so accessories (sprout, cloud) can sit above the head.
const VB = '0 -12 200 232';
const RATIO = 232 / 200;
const EYE_L = { x: 76, y: 104 };
const EYE_R = { x: 124, y: 104 };
const SCLERA = 18;
const BODY =
  'M100 22 C152 22 184 66 186 124 C188 180 158 208 100 208 C42 208 12 180 14 124 C16 66 48 22 100 22 Z';
const BROW = '#E7B25F';

type FaceSpec = {
  brows?: [string, string];
  browWidth?: number;
  /** Lid shapes drawn over the eyes in body colour, plus their lash line. */
  lids?: { fill: [string, string]; line: [string, string] };
  mouth: React.ReactNode;
  pupil: number;
  cheeks: number;
};

const faceSpec = (face: MoodFace, ink: string): FaceSpec => {
  const stroke = { stroke: ink, strokeWidth: 5, strokeLinecap: 'round' as const, fill: 'none' };
  switch (face) {
    case 'joy':
      return {
        brows: ['M62 78 Q74 66 88 75', 'M112 75 Q126 66 138 78'],
        pupil: 11,
        cheeks: 0.55,
        mouth: (
          <G>
            <Path d="M80 134 Q100 168 120 134 Q100 140 80 134 Z" fill="#3A0A14" />
            <Path d="M89 150 Q100 162 111 150 Q100 144 89 150 Z" fill="#F07A8E" />
          </G>
        ),
      };
    case 'calm':
      return {
        brows: ['M62 82 Q74 77 88 81', 'M112 81 Q126 77 138 82'],
        pupil: 11,
        cheeks: 0.5,
        lids: {
          fill: [
            'M55 106 A21 21 0 0 1 97 106 Q76 113 55 106 Z',
            'M103 106 A21 21 0 0 1 145 106 Q124 113 103 106 Z',
          ],
          line: ['M58 106 Q76 112 94 106', 'M106 106 Q124 112 142 106'],
        },
        mouth: <Path d="M86 140 Q100 151 114 140" {...stroke} />,
      };
    case 'flat':
      return {
        brows: ['M62 80 L88 80', 'M112 80 L138 80'],
        pupil: 10,
        cheeks: 0.35,
        mouth: <Path d="M86 144 L114 144" {...stroke} />,
      };
    case 'worried':
      return {
        brows: ['M62 84 Q75 81 88 71', 'M112 71 Q125 81 138 84'],
        pupil: 9,
        cheeks: 0.35,
        mouth: <Path d="M83 147 Q91 139 100 147 Q109 155 117 147" {...stroke} />,
      };
    case 'grumpy':
      return {
        brows: ['M60 73 L89 87', 'M111 87 L140 73'],
        browWidth: 8,
        pupil: 9,
        cheeks: 0.25,
        lids: {
          fill: ['M54 80 L98 80 L98 104 L54 94 Z', 'M102 80 L146 80 L146 94 L102 104 Z'],
          line: ['M57 94.5 L95 103', 'M105 103 L143 94.5'],
        },
        mouth: <Path d="M84 152 Q100 136 116 152" {...stroke} />,
      };
    case 'blank':
      return {
        pupil: 5,
        cheeks: 0.15,
        mouth: <Path d="M92 146 L108 146" {...stroke} />,
      };
    case 'sad':
      return {
        brows: ['M62 86 Q76 82 88 75', 'M112 75 Q124 82 138 86'],
        pupil: 10,
        cheeks: 0.2,
        lids: {
          fill: ['M54 84 L98 84 L98 95 L54 106 Z', 'M102 84 L146 84 L146 106 L102 95 Z'],
          line: ['M57 105 L95 95.5', 'M105 95.5 L143 105'],
        },
        mouth: <Path d="M86 151 Q100 140 114 151" {...stroke} />,
      };
  }
};

function Accessory({ mood }: { mood: MoodColor }) {
  switch (mood) {
    case 'green':
      return (
        <G>
          <Path d="M100 24 Q97 10 103 0" stroke="#2F7A3E" strokeWidth={4} strokeLinecap="round" fill="none" />
          <Path d="M102 4 Q118 -10 130 4 Q116 14 102 4 Z" fill="#3FAE5A" />
          <Path d="M101 8 Q84 -4 72 8 Q88 18 101 8 Z" fill="#62C878" />
        </G>
      );
    case 'blue':
      return (
        <G opacity={0.9}>
          <Path d="M150 44 l4 -10 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 Z" fill="#FFFFFF" />
          <Path d="M40 60 l2.5 -6 l2.5 6 l6 2.5 l-6 2.5 l-2.5 6 l-2.5 -6 l-6 -2.5 Z" fill="#FFFFFF" />
        </G>
      );
    case 'orange':
      return (
        <G>
          <Path d="M160 56 Q170 72 166 79 Q160 88 154 79 Q150 72 160 56 Z" fill="#E4F4FF" />
          <Ellipse cx={157} cy={75} rx={2} ry={4} fill="#FFFFFF" />
        </G>
      );
    case 'red':
      return (
        <G stroke="#B0233A" strokeWidth={4.5} strokeLinecap="round" fill="none">
          <Path d="M143 46 Q150 46 150 39" />
          <Path d="M157 39 Q157 46 164 46" />
          <Path d="M143 53 Q150 53 150 60" />
          <Path d="M157 60 Q157 53 164 53" />
        </G>
      );
    case 'gray':
      return (
        <G fill="#FFFFFF" opacity={0.75}>
          <Circle cx={150} cy={48} r={4} />
          <Circle cx={162} cy={40} r={5.5} />
          <Circle cx={177} cy={30} r={7} />
        </G>
      );
    case 'black':
      return (
        <G>
          <Path
            d="M120 18 Q120 4 134 6 Q140 -8 156 -2 Q170 -6 172 8 Q184 10 180 20 Q178 26 170 26 L128 26 Q118 26 120 18 Z"
            fill="#B9BCD6"
          />
          <G stroke="#9CC8FF" strokeWidth={3} strokeLinecap="round">
            <Path d="M134 32 L131 40" />
            <Path d="M150 32 L147 42" />
            <Path d="M166 32 L163 40" />
          </G>
          <Path d="M60 116 Q66 126 62 131 Q58 135 55 130 Q53 125 60 116 Z" fill="#BFE3FF" />
        </G>
      );
    default:
      return null;
  }
}

// ─── Bedtime outfit ─────────────────────────────────────────────────────────

const CREAM = '#FFF8EC';

/** Every pyjama set is indigo flannel; the pattern carries the mood colour. */
const FABRIC = '#3E4A8F';

function PajamaDefs({ uid, mood }: { uid: string; mood: MoodColor }) {
  const fabric = FABRIC;
  const accent = MOODS[mood].palette.bg;
  return (
    <>
      <ClipPath id={`clip${uid}`}>
        <Path d={BODY} />
      </ClipPath>
      <Pattern id={`stripe${uid}`} width={14} height={14} patternUnits="userSpaceOnUse">
        <Rect x={0} y={0} width={14} height={14} fill={fabric} />
        <Rect x={0} y={0} width={5} height={14} fill={accent} />
      </Pattern>
      <Pattern id={`dots${uid}`} width={16} height={16} patternUnits="userSpaceOnUse">
        <Rect x={0} y={0} width={16} height={16} fill={fabric} />
        <Circle cx={4} cy={4} r={2.4} fill={accent} />
        <Circle cx={12} cy={12} r={1.7} fill={CREAM} opacity={0.8} />
      </Pattern>
    </>
  );
}

function Pajamas({ uid }: { uid: string }) {
  return (
    <G>
      {/* Pyjama top, clipped to the body silhouette. */}
      <G clipPath={`url(#clip${uid})`}>
        <Rect x={0} y={160} width={200} height={60} fill={`url(#stripe${uid})`} />
        <Rect x={0} y={158} width={200} height={4} fill="#000000" opacity={0.08} />
      </G>
      <Path d="M76 160 L100 180 L100 160 Z" fill={CREAM} />
      <Path d="M124 160 L100 180 L100 160 Z" fill={CREAM} />
      <Circle cx={100} cy={188} r={3.4} fill={CREAM} />
      <Circle cx={100} cy={200} r={3.4} fill={CREAM} />

      {/* Floppy nightcap, tip drooping to the right, with a pom-pom. */}
      <Path
        d="M50 46 C56 8 96 -10 136 0 C164 8 182 30 186 58 C176 40 160 30 148 32 C150 36 152 40 150 46 Z"
        fill={`url(#dots${uid})`}
      />
      <Path
        d="M50 46 C56 8 96 -10 136 0 C164 8 182 30 186 58"
        stroke="#000000"
        strokeOpacity={0.12}
        strokeWidth={2}
        fill="none"
      />
      <Rect x={44} y={40} width={112} height={18} rx={9} fill={CREAM} />
      <Rect x={44} y={52} width={112} height={6} rx={3} fill="#000000" opacity={0.06} />
      <Circle cx={186} cy={62} r={11} fill={CREAM} />
      <Circle cx={182} cy={58} r={3.5} fill="#FFFFFF" />
    </G>
  );
}

function Eye({
  cx,
  cy,
  pupil,
  gaze,
  open,
}: {
  cx: number;
  cy: number;
  pupil: number;
  gaze?: DerivedValue<Gaze>;
  open: DerivedValue<number>;
}) {
  const range = SCLERA - pupil - 2;
  const scleraProps = useAnimatedProps(() => ({ ry: Math.max(0.5, SCLERA * open.value) }));
  const pupilProps = useAnimatedProps(() => {
    const g = gaze?.value ?? { x: 0, y: 0 };
    return {
      cx: cx + g.x * range,
      cy: cy + g.y * range * open.value,
      ry: Math.max(0.3, pupil * open.value),
    };
  });

  return (
    <G>
      <AnimatedEllipse cx={cx} cy={cy} rx={SCLERA} animatedProps={scleraProps} fill="#FFFFFF" />
      <AnimatedEllipse rx={pupil} animatedProps={pupilProps} fill="#0B0B12" />
    </G>
  );
}

function MoodCharacterBase({ mood, size, gaze, alive = true, blur, outfit }: Props) {
  const def = MOODS[mood];
  const { body, shade, face: ink } = def.palette;
  const spec = faceSpec(def.face, ink);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const open = useSharedValue(1);

  useEffect(() => {
    if (!alive) return;
    const blink = withSequence(withTiming(0.08, { duration: 80 }), withTiming(1, { duration: 140 }));
    open.value = withDelay(
      600 + Math.random() * 2400,
      withRepeat(withSequence(withDelay(2600 + Math.random() * 2200, blink)), -1),
    );
    return () => cancelAnimation(open);
  }, [alive, open]);

  const content = (
    <G>
      <Ellipse cx={100} cy={212} rx={62} ry={7} fill="#000000" opacity={0.16} />
      <Ellipse cx={78} cy={204} rx={17} ry={8} fill={shade} />
      <Ellipse cx={122} cy={204} rx={17} ry={8} fill={shade} />
      <Path d={BODY} fill={`url(#body${uid})`} />
      <Path d={BODY} fill={`url(#knit${uid})`} opacity={0.55} />
      <Path
        d={BODY}
        fill="none"
        stroke={body}
        strokeWidth={5}
        strokeDasharray="0.1 6"
        strokeLinecap="round"
        opacity={0.9}
      />
      <Ellipse cx={70} cy={58} rx={24} ry={11} fill="#FFFFFF" opacity={0.32} transform="rotate(-28 70 58)" />
      <Ellipse cx={54} cy={134} rx={13} ry={7} fill="#F28DB2" opacity={spec.cheeks} />
      <Ellipse cx={146} cy={134} rx={13} ry={7} fill="#F28DB2" opacity={spec.cheeks} />

      <Eye cx={EYE_L.x} cy={EYE_L.y} pupil={spec.pupil} gaze={gaze} open={open} />
      <Eye cx={EYE_R.x} cy={EYE_R.y} pupil={spec.pupil} gaze={gaze} open={open} />

      {spec.lids ? (
        <G>
          <Path d={spec.lids.fill[0]} fill={body} />
          <Path d={spec.lids.fill[1]} fill={body} />
          <Path d={spec.lids.line[0]} stroke={ink} strokeWidth={3.5} strokeLinecap="round" fill="none" />
          <Path d={spec.lids.line[1]} stroke={ink} strokeWidth={3.5} strokeLinecap="round" fill="none" />
        </G>
      ) : null}

      {spec.brows ? (
        <G stroke={BROW} strokeWidth={spec.browWidth ?? 7} strokeLinecap="round" fill="none">
          <Path d={spec.brows[0]} />
          <Path d={spec.brows[1]} />
        </G>
      ) : null}

      {spec.mouth}
      {outfit === 'pajamas' ? <Pajamas uid={uid} /> : <Accessory mood={mood} />}
    </G>
  );

  return (
    <Svg width={size} height={size * RATIO} viewBox={VB}>
      <Defs>
        <RadialGradient id={`body${uid}`} cx="38%" cy="30%" r="78%" fx="38%" fy="30%">
          <Stop offset="0" stopColor={body} />
          <Stop offset="0.55" stopColor={body} stopOpacity={0.92} />
          <Stop offset="1" stopColor={shade} />
        </RadialGradient>
        <Pattern id={`knit${uid}`} width={8} height={7} patternUnits="userSpaceOnUse">
          <Path d="M0 0 L4 5 L8 0" stroke={shade} strokeWidth={1.1} fill="none" opacity={0.45} />
        </Pattern>
        {outfit === 'pajamas' ? <PajamaDefs uid={uid} mood={mood} /> : null}
        {blur ? (
          <Filter id={`blur${uid}`} x="-20%" y="-20%" width="140%" height="140%">
            <FeGaussianBlur stdDeviation={blur} />
          </Filter>
        ) : null}
      </Defs>
      {blur ? <G filter={`url(#blur${uid})`}>{content}</G> : content}
    </Svg>
  );
}

export const MoodCharacter = React.memo(MoodCharacterBase);
export const CHARACTER_RATIO = RATIO;
