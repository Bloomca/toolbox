export type WheelChoice = {
  id: string;
  label: string;
  weight: number;
};

export type WheelPaletteEntry = {
  background: string;
  foreground: string;
};

export type WheelProps = {
  choices: readonly WheelChoice[];
  palette?: readonly WheelPaletteEntry[];
};

export type WheelSegment = {
  choice: WheelChoice;
  color: WheelPaletteEntry;
  startAngle: number;
  endAngle: number;
};
