import type { WheelChoice, WheelPaletteEntry, WheelSegment } from "./types";

export const MIN_CHOICES = 2;
export const MAX_CHOICES = 12;

export const WHEEL_PALETTE: readonly WheelPaletteEntry[] = [
  { background: "#f6c85f", foreground: "#1f2937" },
  { background: "#2563eb", foreground: "#ffffff" },
  { background: "#ef8354", foreground: "#1f2937" },
  { background: "#0f766e", foreground: "#ffffff" },
  { background: "#a78bfa", foreground: "#1f2937" },
  { background: "#e9c46a", foreground: "#1f2937" },
  { background: "#15803d", foreground: "#ffffff" },
  { background: "#ff9f1c", foreground: "#1f2937" },
  { background: "#be185d", foreground: "#ffffff" },
  { background: "#66c7f0", foreground: "#1f2937" },
  { background: "#92400e", foreground: "#ffffff" },
  { background: "#b8a1e3", foreground: "#1f2937" },
];

const SEGMENT_BORDER = "#5f4634";

export function validateWheel(
  choices: readonly WheelChoice[],
  palette: readonly WheelPaletteEntry[],
): string | undefined {
  if (choices.length < MIN_CHOICES || choices.length > MAX_CHOICES) {
    return `Spinny needs between ${MIN_CHOICES} and ${MAX_CHOICES} choices.`;
  }

  if (palette.length === 0) return "Spinny needs at least one wheel color.";

  if (choices.some((choice) => !Number.isFinite(choice.weight) || choice.weight <= 0)) {
    return "Every Spinny choice needs a positive weight.";
  }

  return undefined;
}

export function createSegments(
  choices: readonly WheelChoice[],
  palette: readonly WheelPaletteEntry[],
): WheelSegment[] {
  const totalWeight = choices.reduce((total, choice) => total + choice.weight, 0);
  let startAngle = 0;

  return choices.map((choice, index) => {
    const angle = (choice.weight / totalWeight) * 360;
    const segment = {
      choice,
      color: palette[index % palette.length],
      startAngle,
      endAngle: startAngle + angle,
    };
    startAngle += angle;
    return segment;
  });
}

export function createWheelGradient(segments: readonly WheelSegment[]): string {
  const stops = segments.flatMap((segment) => {
    const angle = segment.endAngle - segment.startAngle;
    const borderWidth = Math.min(0.6, angle * 0.05);
    const colorStart = segment.startAngle + borderWidth;

    return [
      `${SEGMENT_BORDER} ${formatAngle(segment.startAngle)}deg ${formatAngle(colorStart)}deg`,
      `${segment.color.background} ${formatAngle(colorStart)}deg ${formatAngle(segment.endAngle)}deg`,
    ];
  });

  return `conic-gradient(${stops.join(", ")})`;
}

export function readableLabelRotation(rotation: number): number {
  let normalized = ((rotation + 180) % 360) - 180;
  if (normalized > 90) normalized -= 180;
  if (normalized < -90) normalized += 180;
  return normalized;
}

export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function formatAngle(angle: number): number {
  return Number(angle.toFixed(4));
}
