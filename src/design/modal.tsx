import { createRef, onMount, onUnmount } from "veles";
import type { JSX } from "veles/jsx-runtime";

import "./modal.css";

const FOCUSABLE_SELECTOR =
  'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

let nextModalId = 1;

type ModalProps = {
  title: string;
  description?: string;
  role?: "dialog" | "alertdialog";
  size?: "default" | "wide";
  onClose: () => void;
  children?: JSX.HTMLAttributes<HTMLDivElement>["children"];
};

export function Modal({
  title,
  description,
  role = "dialog",
  size = "default",
  onClose,
  children,
}: ModalProps) {
  const dialogRef = createRef<HTMLDivElement>();
  const id = nextModalId++;
  const titleId = `toolbox-modal-title-${id}`;
  const descriptionId = `toolbox-modal-description-${id}`;
  let previouslyFocusedElement: HTMLElement | null = null;

  onMount(() => {
    previouslyFocusedElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const focusableElements = getFocusableElements(dialogRef.current);
    const initialFocusElement = focusableElements.find((element) =>
      element.hasAttribute("data-toolbox-modal-initial-focus"),
    );
    (initialFocusElement ?? focusableElements[0] ?? dialogRef.current)?.focus();
  });

  onUnmount(() => {
    if (previouslyFocusedElement?.isConnected) previouslyFocusedElement.focus();
  });

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== "Tab" || !dialogRef.current) return;

    const focusableElements = getFocusableElements(dialogRef.current);
    if (focusableElements.length === 0) {
      event.preventDefault();
      dialogRef.current.focus();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  return (
    <div
      data-toolbox-modal-backdrop=""
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={handleKeyDown}
    >
      <div
        ref={dialogRef}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description === undefined ? undefined : descriptionId}
        tabIndex={-1}
        data-toolbox-modal=""
        data-toolbox-modal-size={size}
      >
        <h2 id={titleId} data-toolbox-modal-title="">
          {title}
        </h2>
        {description === undefined ? null : (
          <p id={descriptionId} data-toolbox-modal-description="">
            {description}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}

function getFocusableElements(dialog: HTMLElement | null): HTMLElement[] {
  return dialog ? Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)) : [];
}
