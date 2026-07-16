import type { JSX } from "veles/jsx-runtime";

import "./button.css";

type NativeButtonProps = JSX.HTMLAttributes<HTMLButtonElement> & {
  tone?: "default" | "danger";
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
