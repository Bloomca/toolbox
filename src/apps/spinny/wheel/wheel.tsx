import styles from "../style.module.css";

import type { WheelProps, WheelSegment } from "./types";
import {
  WHEEL_PALETTE,
  createSegments,
  createWheelGradient,
  degreesToRadians,
  readableLabelRotation,
  validateWheel,
} from "./utils";

const LABEL_RADIUS_PERCENT = 31;

export function Wheel({ choices, palette = WHEEL_PALETTE }: WheelProps) {
  const validationError = validateWheel(choices, palette);
  if (validationError) {
    return (
      <div class={styles.invalidWheel} role="alert">
        {validationError}
      </div>
    );
  }

  const segments = createSegments(choices, palette);

  return (
    <div
      class={styles.wheel}
      role="list"
      aria-label="Wheel choices"
      style={{ background: createWheelGradient(segments) }}
    >
      {segments.map((segment) => (
        <Segment segment={segment} />
      ))}
    </div>
  );
}

function Segment({ segment }: { segment: WheelSegment }) {
  const angle = segment.endAngle - segment.startAngle;
  const midpoint = segment.startAngle + angle / 2;
  const radians = degreesToRadians(midpoint);
  const left = 50 + LABEL_RADIUS_PERCENT * Math.sin(radians);
  const top = 50 - LABEL_RADIUS_PERCENT * Math.cos(radians);
  const rotation = readableLabelRotation(midpoint - 90);
  const fontSize = Math.max(0.65, Math.min(1, angle / 30));

  return (
    <div
      class={styles.wheelLabel}
      role="listitem"
      aria-label={`${segment.choice.label}, weight ${segment.choice.weight}`}
      data-choice-id={segment.choice.id}
      title={segment.choice.label}
      style={{
        color: segment.color.foreground,
        left: `${left}%`,
        top: `${top}%`,
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        "font-size": `${fontSize}rem`,
      }}
    >
      {segment.choice.label}
    </div>
  );
}
