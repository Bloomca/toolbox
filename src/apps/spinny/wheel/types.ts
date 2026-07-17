import type { State } from "veles";

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
  selectedChoiceId$?: State<string | null>;
  selectableChoiceIds?: ReadonlySet<string>;
  onChoiceSelect?: (choiceId: string) => void;
};

export type WheelSegment = {
  choice: WheelChoice;
  color: WheelPaletteEntry;
  startAngle: number;
  endAngle: number;
};
