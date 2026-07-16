import { Wheel, type WheelChoice } from "./wheel";
import styles from "./style.module.css";

const CHOICES: readonly WheelChoice[] = [
  { id: "sun", label: "Sun", weight: 1 },
  { id: "water", label: "Water", weight: 1 },
  { id: "earth", label: "Earth", weight: 1 },
  { id: "wind", label: "Wind", weight: 1 },
  { id: "fire", label: "Fire", weight: 1 },
  { id: "sky", label: "Sky", weight: 1 },
  { id: "air", label: "Air", weight: 1 },
  { id: "ocean", label: "Ocean", weight: 1 },
  { id: "sand", label: "Sand", weight: 1 },
];

export function SpinnyApp() {
  return (
    <div class={styles.app}>
      <Wheel choices={CHOICES} />
    </div>
  );
}
