import { createRef, onUnmount, Portal } from "veles";
import type { JSX } from "veles/jsx-runtime";

import "./tooltip.css";

type TooltipPlacement = "top" | "right" | "bottom" | "left";

type TooltipProps = {
  content: string;
  placement?: TooltipPlacement;
  hidden?: JSX.HTMLAttributes<HTMLSpanElement>["hidden"];
  children?: JSX.HTMLAttributes<HTMLSpanElement>["children"];
};

const TOOLTIP_GAP = 8;
const VIEWPORT_MARGIN = 8;

export function Tooltip({ content, placement = "top", hidden, children }: TooltipProps) {
  const targetRef = createRef<HTMLSpanElement>();
  const tooltipRef = createRef<HTMLSpanElement>();
  let hovered = false;
  let focused = false;
  let trackingPosition = false;

  function updatePosition() {
    if (!targetRef.current || !tooltipRef.current) return;

    const targetBounds = targetRef.current.getBoundingClientRect();
    const tooltipBounds = tooltipRef.current.getBoundingClientRect();
    let left = targetBounds.left + (targetBounds.width - tooltipBounds.width) / 2;
    let top = targetBounds.top + (targetBounds.height - tooltipBounds.height) / 2;

    switch (placement) {
      case "top":
        top = targetBounds.top - tooltipBounds.height - TOOLTIP_GAP;
        break;
      case "right":
        left = targetBounds.right + TOOLTIP_GAP;
        break;
      case "bottom":
        top = targetBounds.bottom + TOOLTIP_GAP;
        break;
      case "left":
        left = targetBounds.left - tooltipBounds.width - TOOLTIP_GAP;
        break;
    }

    const maximumLeft = Math.max(
      VIEWPORT_MARGIN,
      window.innerWidth - tooltipBounds.width - VIEWPORT_MARGIN,
    );
    const maximumTop = Math.max(
      VIEWPORT_MARGIN,
      window.innerHeight - tooltipBounds.height - VIEWPORT_MARGIN,
    );
    tooltipRef.current.style.left = `${Math.round(Math.min(Math.max(left, VIEWPORT_MARGIN), maximumLeft))}px`;
    tooltipRef.current.style.top = `${Math.round(Math.min(Math.max(top, VIEWPORT_MARGIN), maximumTop))}px`;
  }

  function startPositionTracking() {
    if (trackingPosition) return;
    trackingPosition = true;
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
  }

  function stopPositionTracking() {
    if (!trackingPosition) return;
    trackingPosition = false;
    window.removeEventListener("resize", updatePosition);
    window.removeEventListener("scroll", updatePosition, true);
  }

  function showTooltip() {
    if (!tooltipRef.current) return;
    updatePosition();
    tooltipRef.current.setAttribute("data-visible", "");
    startPositionTracking();
  }

  function hideTooltipIfInactive() {
    if (hovered || focused) return;
    tooltipRef.current?.removeAttribute("data-visible");
    stopPositionTracking();
  }

  onUnmount(stopPositionTracking);

  return (
    <span
      ref={targetRef}
      data-toolbox-tooltip=""
      onMouseEnter={() => {
        hovered = true;
        showTooltip();
      }}
      onMouseLeave={() => {
        hovered = false;
        hideTooltipIfInactive();
      }}
      onFocusIn={() => {
        focused = true;
        showTooltip();
      }}
      onFocusOut={() => {
        focused = false;
        hideTooltipIfInactive();
      }}
    >
      {children}
      <Portal portalNode={document.body}>
        <span
          ref={tooltipRef}
          role="tooltip"
          hidden={hidden}
          data-toolbox-tooltip-content=""
          data-toolbox-tooltip-placement={placement}
        >
          {content}
        </span>
      </Portal>
    </span>
  );
}
