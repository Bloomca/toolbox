/** @vitest-environment happy-dom */

import { afterEach, describe, expect, test, vi } from "vitest";
import { attachComponent } from "veles";

import { SpinnyApp } from ".";
import { readSpinnyLists, saveSpinnyList } from "./storage";

let unmount: (() => void) | undefined;

function renderApp(): HTMLElement {
  const container = document.createElement("div");
  document.body.append(container);
  unmount = attachComponent({ htmlElement: container, component: <SpinnyApp /> });
  return container;
}

afterEach(() => {
  unmount?.();
  unmount = undefined;
  document.body.replaceChildren();
  localStorage.clear();
});

describe("Spinny choice editor", () => {
  test("renders the choices as checked editable rows", () => {
    const container = renderApp();
    const checkboxes = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
    const inputs = container.querySelectorAll<HTMLInputElement>('[aria-label="Choice name"]');

    expect(checkboxes).toHaveLength(9);
    expect(Array.from(checkboxes).every((checkbox) => checkbox.checked)).toBe(true);
    expect(Array.from(inputs, (input) => input.value)).toEqual([
      "Sun",
      "Water",
      "Earth",
      "Wind",
      "Fire",
      "Sky",
      "Air",
      "Ocean",
      "Sand",
    ]);
  });

  test("starts with an editable list title", () => {
    const container = renderApp();
    const titleInput = container.querySelector<HTMLInputElement>('[aria-label="List title"]');

    expect(titleInput?.value).toBe("New List");
    setInputValue(titleInput, "Weekend choices");
    expect(container.querySelector("aside")?.getAttribute("aria-label")).toBe(
      "Weekend choices editor",
    );
  });

  test("saves the current list", async () => {
    const container = renderApp();
    const saveButton = findButton(container, "Save");

    await vi.waitFor(() => expect(saveButton.disabled).toBe(false));
    saveButton.click();

    await vi.waitFor(async () => expect(await readSpinnyLists()).toHaveLength(1));
    const lists = await readSpinnyLists();
    expect(saveButton.disabled).toBe(true);
    expect(lists[0].title).toBe("New List");
    expect(lists[0].choices).toHaveLength(9);
  });

  test("disables saving when a normalized title already exists", async () => {
    await saveSpinnyList({ title: "  NEW LIST  ", choices: [] });
    const container = renderApp();
    const saveButton = findButton(container, "Save");

    const duplicateTooltip = findTooltip(container, "A list with this title already exists.");
    const titleInput = container.querySelector<HTMLInputElement>('[aria-label="List title"]');
    setInputValue(titleInput, "Another list");
    await vi.waitFor(() => expect(saveButton.disabled).toBe(false));
    expect(duplicateTooltip.hidden).toBe(true);

    setInputValue(titleInput, " new list ");
    expect(saveButton.disabled).toBe(true);
    expect(duplicateTooltip.hidden).toBe(false);
  });

  test("disables saving a blank title", async () => {
    const container = renderApp();
    const saveButton = findButton(container, "Save");
    await vi.waitFor(() => expect(saveButton.disabled).toBe(false));

    setInputValue(container.querySelector('[aria-label="List title"]'), "   ");

    expect(saveButton.disabled).toBe(true);
  });

  test("explains choice toggles and deletion with tooltips", () => {
    const container = renderApp();

    expect(findTooltip(container, "Toggle this option").hidden).toBe(false);
    expect(findTooltip(container, "Delete").hidden).toBe(false);
  });

  test("updates the wheel label immediately", () => {
    const container = renderApp();
    const input = container.querySelector<HTMLInputElement>('[aria-label="Choice name"]');

    setInputValue(input, "Solar");

    expect(container.querySelector<HTMLElement>('[data-choice-id="sun"]')?.title).toBe("Solar");
  });

  test("adds a blank choice and includes it after it receives a name", () => {
    const container = renderApp();
    const addButton = findButton(container, "Add");

    addButton.click();

    const inputs = container.querySelectorAll<HTMLInputElement>('[aria-label="Choice name"]');
    const checkboxes = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
    const newInput = inputs[inputs.length - 1];
    const newCheckbox = checkboxes[checkboxes.length - 1];
    expect(inputs).toHaveLength(10);
    expect(newInput.value).toBe("");
    expect(newCheckbox.disabled).toBe(true);
    expect(container.querySelectorAll("[data-wheel-segment]")).toHaveLength(9);

    setInputValue(newInput, "Cloud");

    expect(newCheckbox.checked).toBe(true);
    expect(newCheckbox.disabled).toBe(false);
    expect(container.querySelectorAll("[data-wheel-segment]")).toHaveLength(10);
    expect(
      Array.from(container.querySelectorAll<HTMLElement>("[data-choice-id]")).at(-1)?.title,
    ).toBe("Cloud");
  });

  test("deletes a choice with an accessible icon button", () => {
    const container = renderApp();
    const deleteButton = container.querySelector<HTMLButtonElement>('[aria-label="Delete Sun"]');

    expect(deleteButton?.textContent).toContain("−");
    deleteButton?.click();

    expect(container.querySelectorAll('[aria-label="Choice name"]')).toHaveLength(8);
    expect(container.querySelector('[data-wheel-segment="sun"]')).toBeNull();
  });

  test("disables adding at the maximum choice count", () => {
    const container = renderApp();
    const addButton = findButton(container, "Add");

    addButton.click();
    addButton.click();
    addButton.click();

    expect(container.querySelectorAll('[aria-label="Choice name"]')).toHaveLength(12);
    expect(addButton.disabled).toBe(true);
  });

  test("automatically disables a blank choice", () => {
    const container = renderApp();
    const input = container.querySelector<HTMLInputElement>('[aria-label="Choice name"]');
    const checkbox = container.querySelector<HTMLInputElement>('input[type="checkbox"]');

    setInputValue(input, "   ");

    expect(checkbox?.checked).toBe(false);
    expect(checkbox?.disabled).toBe(true);
    expect(container.querySelector('[data-wheel-segment="sun"]')).toBeNull();
  });

  test("disables spinning with fewer than two choices and still renders an empty wheel", () => {
    const container = renderApp();
    const checkboxes = Array.from(
      container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'),
    );

    checkboxes.forEach((checkbox) => setCheckboxValue(checkbox, false));

    expect(container.querySelector<HTMLButtonElement>("button")?.disabled).toBe(true);
    expect(container.querySelector('[role="status"]')?.textContent).toContain(
      "Enable at least two named choices",
    );
    expect(container.querySelector('[role="list"]')).not.toBeNull();
    expect(container.querySelectorAll("[data-wheel-segment]")).toHaveLength(0);
  });
});

function findTooltip(container: HTMLElement, content: string): HTMLElement {
  const tooltip = Array.from(container.querySelectorAll<HTMLElement>('[role="tooltip"]')).find(
    (tooltip) => tooltip.textContent === content,
  );
  if (!tooltip) throw new Error(`Expected a tooltip containing "${content}".`);
  return tooltip;
}

function findButton(container: HTMLElement, label: string): HTMLButtonElement {
  const button = Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find(
    (button) => button.textContent?.trim() === label,
  );
  if (!button) throw new Error(`Expected a ${label} button.`);
  return button;
}

function setInputValue(input: HTMLInputElement | null, value: string) {
  if (!input) throw new Error("Expected a text input.");
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function setCheckboxValue(input: HTMLInputElement, checked: boolean) {
  input.checked = checked;
  input.dispatchEvent(new Event("change", { bubbles: true }));
}
