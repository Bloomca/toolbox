import type { JSX } from "veles/jsx-runtime";

import "./text-input.css";

type TextInputProps = Omit<JSX.HTMLAttributes<HTMLInputElement>, "type">;

export function TextInput(props: TextInputProps) {
  return <input {...props} type="text" data-toolbox-text-input="" />;
}
