import type { State } from "veles";
import type { JSX } from "veles/jsx-runtime";

import "./button.css";

type ButtonTone = "default" | "danger" | "modified";
type ButtonToneAttribute = ReturnType<State<ButtonTone>["attribute"]>;

type NativeButtonProps = JSX.HTMLAttributes<HTMLButtonElement> & {
  tone?: ButtonTone | ButtonToneAttribute;
  [dataAttribute: `data-${string}`]: unknown;
};

type IconButtonProps = Omit<NativeButtonProps, "aria-label"> & {
  variant: "icon";
  "aria-label": NonNullable<NativeButtonProps["aria-label"]>;
};

type RegularButtonProps = NativeButtonProps & {
  variant?: "default" | "ghost";
};

type ButtonProps = IconButtonProps | RegularButtonProps;

export function Button(props: ButtonProps) {
  const {
    children,
    type = "button",
    variant = "default",
    tone = "default",
    ...nativeProps
  } = props;

  return (
    <button
      {...nativeProps}
      type={type}
      data-toolbox-button=""
      data-toolbox-button-tone={tone}
      data-toolbox-button-variant={variant}
    >
      {children}
    </button>
  );
}
