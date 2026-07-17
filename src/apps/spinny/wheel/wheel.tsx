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
const SVG_CENTER = 50;
const SVG_RADIUS = 50;

export function Wheel({
  choices,
  palette = WHEEL_PALETTE,
  selectedChoiceId$,
  selectableChoiceIds,
  onChoiceSelect,
}: WheelProps) {
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
  const selectableSegments = onChoiceSelect
    ? segments.filter((segment) => selectableChoiceIds?.has(segment.choice.id))
    : [];

  return (
    <div class={styles.wheel} role="list" aria-label="Wheel choices" style={wheelStyle}>
      {segments.map((segment) => (
        <Segment
          segment={segment}
          selectedChoiceId$={selectedChoiceId$}
          selectable={selectableChoiceIds?.has(segment.choice.id) ?? false}
        />
      ))}
      {selectableSegments.length > 0 ? (
        <svg
          class={styles.wheelInteraction}
          viewBox="0 0 100 100"
          aria-label="Subcategory navigation"
        >
          {selectableSegments.map((segment) => (
            <CategorySegment segment={segment} onSelect={onChoiceSelect!} />
          ))}
        </svg>
      ) : null}
    </div>
  );
}

function Segment({
  segment,
  selectedChoiceId$,
  selectable,
}: Pick<WheelProps, "selectedChoiceId$"> & {
  segment: WheelSegment;
  selectable: boolean;
}) {
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
        aria-label={`${segment.choice.label}, weight ${segment.choice.weight}${selectable ? ", subcategory" : ""}`}
        data-choice-id={segment.choice.id}
        data-dimmed={isDimmed$?.attribute()}
        data-selected={isSelected$?.attribute()}
        title={segment.choice.label}
        style={labelStyle}
      >
        {segment.choice.label}
        {selectable ? " ›" : null}
      </div>
    </>
  );
}

function CategorySegment({
  segment,
  onSelect,
}: {
  segment: WheelSegment;
  onSelect: (choiceId: string) => void;
}) {
  function select() {
    onSelect(segment.choice.id);
  }

  return (
    <path
      class={styles.wheelCategorySegment}
      d={createSegmentPath(segment)}
      role="button"
      tabIndex={0}
      aria-label={`Open ${segment.choice.label} subcategory`}
      data-wheel-category={segment.choice.id}
      onClick={select}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        select();
      }}
    />
  );
}

function createSegmentPath(segment: WheelSegment): string {
  const angle = segment.endAngle - segment.startAngle;
  if (angle >= 360) {
    return [
      `M ${SVG_CENTER} 0`,
      `A ${SVG_RADIUS} ${SVG_RADIUS} 0 1 1 ${SVG_CENTER} 100`,
      `A ${SVG_RADIUS} ${SVG_RADIUS} 0 1 1 ${SVG_CENTER} 0`,
      "Z",
    ].join(" ");
  }

  const start = pointOnWheel(segment.startAngle);
  const end = pointOnWheel(segment.endAngle);
  const largeArcFlag = angle > 180 ? 1 : 0;
  return [
    `M ${SVG_CENTER} ${SVG_CENTER}`,
    `L ${start.x} ${start.y}`,
    `A ${SVG_RADIUS} ${SVG_RADIUS} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
}

function pointOnWheel(angle: number): { x: number; y: number } {
  const radians = degreesToRadians(angle);
  return {
    x: SVG_CENTER + SVG_RADIUS * Math.sin(radians),
    y: SVG_CENTER - SVG_RADIUS * Math.cos(radians),
  };
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
