import { createRef, onMount, onUnmount } from "veles";

import { Button } from "./button";
import "./confirmation-modal.css";

export type ConfirmationModalProps = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
};

let nextConfirmationModalId = 1;

export function ConfirmationModal({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  const dialogRef = createRef<HTMLDivElement>();
  const cancelButtonRef = createRef<HTMLButtonElement>();
  const id = nextConfirmationModalId++;
  const titleId = `toolbox-confirmation-title-${id}`;
  const messageId = `toolbox-confirmation-message-${id}`;
  let previouslyFocusedElement: HTMLElement | null = null;

  onMount(() => {
    previouslyFocusedElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    cancelButtonRef.current?.focus();
  });

  onUnmount(() => {
    if (previouslyFocusedElement?.isConnected) previouslyFocusedElement.focus();
  });

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
      return;
    }

    if (event.key !== "Tab" || !dialogRef.current) return;

    const focusableElements = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
      ),
    );
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
      data-toolbox-confirmation-backdrop=""
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
      onKeyDown={handleKeyDown}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        tabIndex={-1}
        data-toolbox-confirmation-modal=""
      >
        <h2 id={titleId} data-toolbox-confirmation-title="">
          {title}
        </h2>
        <p id={messageId} data-toolbox-confirmation-message="">
          {message}
        </p>
        <div data-toolbox-confirmation-actions="">
          <Button ref={cancelButtonRef} onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button tone={tone} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
