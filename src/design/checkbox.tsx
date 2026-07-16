import type { JSX } from "veles/jsx-runtime";

import "./checkbox.css";

type CheckboxProps = Omit<JSX.HTMLAttributes<HTMLInputElement>, "type">;

export function Checkbox(props: CheckboxProps) {
  return (
    <label data-toolbox-checkbox="">
      <input {...props} type="checkbox" />
      <span data-toolbox-checkbox-box="" aria-hidden="true" />
    </label>
  );
}
