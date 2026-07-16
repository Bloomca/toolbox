/** @vitest-environment happy-dom */

import { afterEach, describe, expect, test, vi } from "vitest";
import { attachComponent } from "veles";

import { ConfirmationProvider, type RequestConfirmation, useConfirmation } from "./confirmation";

let unmount: (() => void) | undefined;

afterEach(() => {
  unmount?.();
  unmount = undefined;
  document.body.replaceChildren();
});

describe("confirmation context", () => {
  test("renders the modal alongside multiple provider children", () => {
    const container = renderComponent(
      <ConfirmationProvider>
        <span data-testid="provider-child">Provider child</span>
        <SingleRequester onResponse={() => undefined} />
      </ConfirmationProvider>,
    );

    expect(container.querySelector('[data-testid="provider-child"]')?.textContent).toBe(
      "Provider child",
    );
    findButton(container, "Request confirmation").click();
    expect(container.querySelector('[role="alertdialog"]')).not.toBeNull();
  });

  test("resolves confirmation and cancellation responses", async () => {
    const onResponse = vi.fn();
    const container = renderProvider(<SingleRequester onResponse={onResponse} />);

    findButton(container, "Request confirmation").click();
    expect(container.querySelector('[role="alertdialog"]')?.textContent).toContain("Continue?");
    findButton(container, "Continue").click();
    await vi.waitFor(() => expect(onResponse).toHaveBeenCalledWith(true));
    expect(container.querySelector('[role="alertdialog"]')).toBeNull();

    findButton(container, "Request confirmation").click();
    findButton(container, "Go back").click();
    await vi.waitFor(() => expect(onResponse).toHaveBeenLastCalledWith(false));
  });

  test("shows concurrent requests in order", async () => {
    const responses: Array<[string, boolean]> = [];
    const container = renderProvider(<QueueRequester responses={responses} />);

    findButton(container, "Request two confirmations").click();
    expect(dialogTitle(container)).toBe("First request");
    findButton(container, "First confirm").click();
    await vi.waitFor(() => expect(responses).toEqual([["first", true]]));

    expect(dialogTitle(container)).toBe("Second request");
    findButton(container, "Second cancel").click();
    await vi.waitFor(() =>
      expect(responses).toEqual([
        ["first", true],
        ["second", false],
      ]),
    );
    expect(container.querySelector('[role="alertdialog"]')).toBeNull();
  });

  test("cancels active and queued requests when the provider unmounts", async () => {
    const responses: Array<[string, boolean]> = [];
    const container = renderProvider(<QueueRequester responses={responses} />);
    findButton(container, "Request two confirmations").click();

    unmount?.();
    unmount = undefined;

    await vi.waitFor(() =>
      expect(responses).toEqual([
        ["first", false],
        ["second", false],
      ]),
    );
  });

  test("requires the confirmation function to be read inside a provider", () => {
    expect(() => renderComponent(<ContextReader />)).toThrow(
      "useConfirmation needs a ConfirmationProvider.",
    );
  });
});

function SingleRequester({ onResponse }: { onResponse: (response: boolean) => void }) {
  const confirm = useConfirmation();
  return (
    <button
      type="button"
      onClick={() => {
        void confirm({
          title: "Continue?",
          message: "Confirm this action.",
          confirmLabel: "Continue",
          cancelLabel: "Go back",
        }).then(onResponse);
      }}
    >
      Request confirmation
    </button>
  );
}

function QueueRequester({ responses }: { responses: Array<[string, boolean]> }) {
  const confirm = useConfirmation();
  return (
    <button
      type="button"
      onClick={() => {
        void collectResponse(
          confirm({
            title: "First request",
            message: "Resolve this one first.",
            confirmLabel: "First confirm",
            cancelLabel: "First cancel",
          }),
          "first",
          responses,
        );
        void collectResponse(
          confirm({
            title: "Second request",
            message: "This request should wait.",
            confirmLabel: "Second confirm",
            cancelLabel: "Second cancel",
          }),
          "second",
          responses,
        );
      }}
    >
      Request two confirmations
    </button>
  );
}

function ContextReader() {
  useConfirmation();
  return null;
}

async function collectResponse(
  response: ReturnType<RequestConfirmation>,
  name: string,
  responses: Array<[string, boolean]>,
) {
  responses.push([name, await response]);
}

function renderProvider(
  children: Parameters<typeof ConfirmationProvider>[0]["children"],
): HTMLElement {
  return renderComponent(<ConfirmationProvider>{children}</ConfirmationProvider>);
}

function renderComponent(component: ReturnType<typeof ConfirmationProvider>): HTMLElement {
  const container = document.createElement("div");
  document.body.append(container);
  unmount = attachComponent({ htmlElement: container, component });
  return container;
}

function dialogTitle(container: HTMLElement): string | null | undefined {
  return container.querySelector("[data-toolbox-confirmation-title]")?.textContent;
}

function findButton(container: HTMLElement, label: string): HTMLButtonElement {
  const button = Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find(
    (button) => button.textContent?.trim() === label,
  );
  if (!button) throw new Error(`Expected a ${label} button.`);
  return button;
}
