import styles from "../style.module.css";

import type { WheelProps, WheelSegment } from "./types";
import {
  WHEEL_PALETTE,
  createSegments,
  createWheelGradient,
  createWinnerSegmentBackground,
  createWinnerSegmentEdgeGradient,
  createWinnerSegmentMask,
  degreesToRadians,
  readableLabelRotation,
  validateWheel,
} from "./utils";

const LABEL_RADIUS_PERCENT = 31;
const WINNER_ANGLE_OVERLAP_DEGREES = 1.25;
const WINNER_SCALE = 1.03;
const NON_WINNER_OPACITY = 0.85;

export function Wheel({ choices, palette = WHEEL_PALETTE, selectedChoiceId$ }: WheelProps) {
  const validationError = validateWheel(choices, palette);
  if (validationError) {
    return (
      <div class={styles.invalidWheel} role="alert">
        {validationError}
      </div>
    );
  }

  const segments = createSegments(choices, palette);
  const wheelStyle = selectedChoiceId$
    ? selectedChoiceId$.attribute((selectedChoiceId) => ({
        background: createWheelGradient(segments, selectedChoiceId, NON_WINNER_OPACITY),
      }))
    : { background: createWheelGradient(segments) };

  return (
    <div class={styles.wheel} role="list" aria-label="Wheel choices" style={wheelStyle}>
      {segments.map((segment) => (
        <Segment segment={segment} selectedChoiceId$={selectedChoiceId$} />
      ))}
    </div>
  );
}

function Segment({
  segment,
  selectedChoiceId$,
}: Pick<WheelProps, "selectedChoiceId$"> & { segment: WheelSegment }) {
  const angle = segment.endAngle - segment.startAngle;
  const midpoint = segment.startAngle + angle / 2;
  const expandedAngle = angle + WINNER_ANGLE_OVERLAP_DEGREES * 2;
  const winnerStartAngle = segment.startAngle - WINNER_ANGLE_OVERLAP_DEGREES;
  const winnerMask = createWinnerSegmentMask(expandedAngle);
  const rotation = readableLabelRotation(midpoint - 90);
  const fontSize = Math.max(0.65, Math.min(1, angle / 30));
  const isSelected$ = selectedChoiceId$?.map((choiceId) => choiceId === segment.choice.id);
  const isDimmed$ = selectedChoiceId$?.map(
    (choiceId) => choiceId !== null && choiceId !== segment.choice.id,
  );
  const labelStyle = isSelected$
    ? isSelected$.attribute((isSelected) =>
        createLabelStyle(midpoint, rotation, fontSize, segment.color.foreground, isSelected),
      )
    : createLabelStyle(midpoint, rotation, fontSize, segment.color.foreground, false);

  return (
    <>
      <div
        class={styles.wheelSegment}
        aria-hidden="true"
        data-wheel-segment={segment.choice.id}
        data-selected={isSelected$?.attribute()}
        style={{
          background: createWinnerSegmentBackground(segment),
          mask: winnerMask,
          "-webkit-mask": winnerMask,
          "--winner-edge-background": createWinnerSegmentEdgeGradient(expandedAngle),
          "--winner-rotation": `${winnerStartAngle}deg`,
          "--winner-scale": WINNER_SCALE,
        }}
      />
      <div
        class={styles.wheelLabel}
        role="listitem"
        aria-label={`${segment.choice.label}, weight ${segment.choice.weight}`}
        data-choice-id={segment.choice.id}
        data-dimmed={isDimmed$?.attribute()}
        data-selected={isSelected$?.attribute()}
        title={segment.choice.label}
        style={labelStyle}
      >
        {segment.choice.label}
      </div>
    </>
  );
}

function createLabelStyle(
  midpoint: number,
  rotation: number,
  fontSize: number,
  color: string,
  isSelected: boolean,
) {
  const radians = degreesToRadians(midpoint);
  const scale = isSelected ? WINNER_SCALE : 1;
  const radius = LABEL_RADIUS_PERCENT * scale;
  const left = 50 + radius * Math.sin(radians);
  const top = 50 - radius * Math.cos(radians);

  return {
    color,
    left: `${left}%`,
    top: `${top}%`,
    transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`,
    "font-size": `${fontSize}rem`,
  };
}
