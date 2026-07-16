import type { WheelChoice } from "./wheel";

export type EditableChoice = WheelChoice & {
  included: boolean;
};

export type SavedSpinnyList = {
  id: string;
  title: string;
  choices: EditableChoice[];
};
