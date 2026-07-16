import type { JSX } from "veles/jsx-runtime";

import "./tooltip.css";

type TooltipProps = {
  content: string;
  placement?: "top" | "right" | "bottom" | "left";
  hidden?: JSX.HTMLAttributes<HTMLSpanElement>["hidden"];
  children?: JSX.HTMLAttributes<HTMLSpanElement>["children"];
};

export function Tooltip({ content, placement = "top", hidden, children }: TooltipProps) {
  return (
    <span data-toolbox-tooltip="">
      {children}
      <span
        role="tooltip"
        hidden={hidden}
        data-toolbox-tooltip-content=""
        data-toolbox-tooltip-placement={placement}
      >
        {content}
      </span>
    </span>
  );
}
