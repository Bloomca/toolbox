import type { JSX } from "veles/jsx-runtime";

import "./slider.css";

export type SliderProps = Omit<JSX.HTMLAttributes<HTMLInputElement>, "type">;

export function Slider(props: SliderProps) {
  return <input {...props} type="range" data-toolbox-slider="" />;
}
