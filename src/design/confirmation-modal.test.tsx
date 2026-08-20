/** @vitest-environment happy-dom */

import { afterEach, describe, expect, test, vi } from "vitest";
import { attachComponent } from "veles";

import { ConfirmationModal } from "./confirmation-modal";

let unmount: (() => void) | undefined;

afterEach(() => {
  unmount?.();
  unmount = undefined;
  document.body.replaceChildren();
});

describe("ConfirmationModal", () => {
  test("renders an accessible alert dialog and responds to its actions", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const container = renderModal({
      title: "Delete list?",
      message: "This cannot be undone.",
      confirmLabel: "Delete",
      cancelLabel: "Keep list",
      tone: "danger",
      onConfirm,
      onCancel,
    });

    const dialog = container.querySelector<HTMLElement>('[role="alertdialog"]');
    const title = container.querySelector<HTMLElement>("[data-toolbox-modal-title]");
    const message = container.querySelector<HTMLElement>("[data-toolbox-modal-description]");
    expect(dialog?.getAttribute("aria-modal")).toBe("true");
    expect(dialog?.getAttribute("aria-labelledby")).toBe(title?.id);
    expect(dialog?.getAttribute("aria-describedby")).toBe(message?.id);
    expect(title?.textContent).toBe("Delete list?");
    expect(message?.textContent).toBe("This cannot be undone.");

    findButton(container, "Delete").click();
    findButton(container, "Keep list").click();
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onCancel).toHaveBeenCalledOnce();
    expect(findButton(container, "Delete").getAttribute("data-toolbox-button-tone")).toBe("danger");
  });

  test("cancels with Escape or a backdrop click, but not a dialog click", () => {
    const onCancel = vi.fn();
    const container = renderModal({ onCancel });
    const dialog = container.querySelector<HTMLElement>('[role="alertdialog"]');
    const backdrop = container.querySelector<HTMLElement>("[data-toolbox-modal-backdrop]");

    dialog?.click();
    expect(onCancel).not.toHaveBeenCalled();

    dialog?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(onCancel).toHaveBeenCalledOnce();

    backdrop?.click();
    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  test("starts on the safe action, traps focus, and restores focus when removed", () => {
    const previousButton = document.createElement("button");
    previousButton.textContent = "Previous";
    document.body.append(previousButton);
    previousButton.focus();
    const container = renderModal();
    const cancelButton = findButton(container, "Cancel");
    const confirmButton = findButton(container, "Confirm");

    expect(document.activeElement).toBe(cancelButton);
    cancelButton.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true }),
    );
    expect(document.activeElement).toBe(confirmButton);
    confirmButton.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
    expect(document.activeElement).toBe(cancelButton);

    unmount?.();
    unmount = undefined;
    expect(document.activeElement).toBe(previousButton);
  });
});

function renderModal(
  overrides: Partial<Parameters<typeof ConfirmationModal>[0]> = {},
): HTMLElement {
  const container = document.createElement("div");
  document.body.append(container);
  unmount = attachComponent({
    htmlElement: container,
    component: (
      <ConfirmationModal
        title="Confirm action?"
        message="Choose whether to continue."
        onConfirm={() => undefined}
        onCancel={() => undefined}
        {...overrides}
      />
    ),
  });
  return container;
}

function findButton(container: HTMLElement, label: string): HTMLButtonElement {
  const button = Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find(
    (button) => button.textContent?.trim() === label,
  );
  if (!button) throw new Error(`Expected a ${label} button.`);
  return button;
}
