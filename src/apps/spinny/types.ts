import type { WheelChoice } from "./wheel";

export type EditableChoice = WheelChoice & {
  included: boolean;
  parentChoiceId: string | null;
};

export type SavedSpinnyList = {
  id: string;
  title: string;
  choices: EditableChoice[];
};
