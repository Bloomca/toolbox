import type { JSX } from "veles/jsx-runtime";

import "./button.css";

type ButtonProps = JSX.HTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "icon";
  [dataAttribute: `data-${string}`]: unknown;
};

export function Button({ children, type = "button", variant = "default", ...props }: ButtonProps) {
  return (
    <button {...props} type={type} data-toolbox-button="" data-toolbox-button-variant={variant}>
      {children}
    </button>
  );
}
