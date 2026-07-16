/** @vitest-environment happy-dom */

import { afterEach, describe, expect, test, vi } from "vitest";
import { attachComponent } from "veles";

import { ConfirmationProvider } from "../../design/confirmation";
import { SpinnyApp } from ".";
import { readSpinnyLists, saveSpinnyList } from "./storage";

let unmount: (() => void) | undefined;

function renderApp(): HTMLElement {
  const container = document.createElement("div");
  document.body.append(container);
  unmount = attachComponent({
    htmlElement: container,
    component: (
      <ConfirmationProvider>
        <SpinnyApp />
      </ConfirmationProvider>
    ),
  });
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
    expect(
      container.querySelector<HTMLOptionElement>('[aria-label="Saved lists"] option[value=""]')
        ?.textContent,
    ).toBe("New list (unsaved)");
    expect(findButton(container, "New").disabled).toBe(true);
    setInputValue(titleInput, "Weekend choices");
    expect(container.querySelector("aside")?.getAttribute("aria-label")).toBe(
      "Weekend choices editor",
    );
  });

  test("shows and selects saved lists from the dropdown", async () => {
    const weekend = await saveSpinnyList({
      title: "Weekend",
      choices: [{ id: "rest", label: "Rest", weight: 1, included: true }],
    });
    await saveSpinnyList({ title: "Lunch", choices: [] });
    const container = renderApp();

    const select = await vi.waitFor(() => {
      const dropdown = container.querySelector<HTMLSelectElement>('[aria-label="Saved lists"]');
      expect(dropdown?.disabled).toBe(false);
      return dropdown;
    });
    const options = select?.querySelectorAll("option");
    expect(Array.from(options ?? [], (option) => option.textContent)).toEqual([
      "New list (unsaved)",
      "Weekend",
      "Lunch",
    ]);

    setSelectValue(select, weekend.id);

    expect(container.querySelector<HTMLInputElement>('[aria-label="List title"]')?.value).toBe(
      "Weekend",
    );
    expect(
      Array.from(
        container.querySelectorAll<HTMLInputElement>('[aria-label="Choice name"]'),
        (input) => input.value,
      ),
    ).toEqual(["Rest"]);
    expect(select?.value).toBe(weekend.id);
    expect(findButton(container, "Update").disabled).toBe(false);
    expect(findButton(container, "Save as new").disabled).toBe(false);
    expect(findButton(container, "New").disabled).toBe(false);
  });

  test("resets a selected list to a new unsaved list", async () => {
    const weekend = await saveSpinnyList({
      title: "Weekend",
      choices: [{ id: "rest", label: "Rest", weight: 1, included: true }],
    });
    const container = renderApp();
    const select = await vi.waitFor(() => {
      const dropdown = container.querySelector<HTMLSelectElement>('[aria-label="Saved lists"]');
      expect(dropdown?.disabled).toBe(false);
      return dropdown;
    });
    setSelectValue(select, weekend.id);
    setInputValue(container.querySelector('[aria-label="List title"]'), "Changed");
    setInputValue(container.querySelector('[aria-label="Choice name"]'), "Relax");

    findButton(container, "New").click();

    expect(container.querySelector<HTMLInputElement>('[aria-label="List title"]')?.value).toBe(
      "New List",
    );
    expect(
      Array.from(
        container.querySelectorAll<HTMLInputElement>('[aria-label="Choice name"]'),
        (input) => input.value,
      ),
    ).toEqual(["Sun", "Water", "Earth", "Wind", "Fire", "Sky", "Air", "Ocean", "Sand"]);
    const currentDropdown = container.querySelector<HTMLSelectElement>(
      '[aria-label="Saved lists"]',
    );
    expect(currentDropdown?.selectedIndex).toBe(0);
    expect(findButton(container, "New").disabled).toBe(true);
    expect(findButton(container, "Save").disabled).toBe(false);
    expect((await readSpinnyLists())[0].choices[0].label).toBe("Rest");
  });

  test("saves the current list", async () => {
    const container = renderApp();
    const saveButton = findButton(container, "Save");

    await vi.waitFor(() => expect(saveButton.disabled).toBe(false));
    saveButton.click();

    await vi.waitFor(async () => expect(await readSpinnyLists()).toHaveLength(1));
    const lists = await readSpinnyLists();
    expect(findButton(container, "Update").disabled).toBe(false);
    expect(findButton(container, "Save as new").disabled).toBe(false);
    expect(lists[0].title).toBe("New List");
    expect(lists[0].choices).toHaveLength(9);
    await vi.waitFor(() =>
      expect(container.querySelectorAll('[aria-label="Saved lists"] option')).toHaveLength(2),
    );
    expect(container.querySelector<HTMLSelectElement>('[aria-label="Saved lists"]')?.value).toBe(
      lists[0].id,
    );
  });

  test("saves a selected list as a new list and selects it", async () => {
    const weekend = await saveSpinnyList({
      title: "Weekend",
      choices: [{ id: "rest", label: "Rest", weight: 1, included: true }],
    });
    const container = renderApp();
    const select = await vi.waitFor(() => {
      const dropdown = container.querySelector<HTMLSelectElement>('[aria-label="Saved lists"]');
      expect(dropdown?.disabled).toBe(false);
      return dropdown;
    });
    setSelectValue(select, weekend.id);
    setInputValue(container.querySelector('[aria-label="List title"]'), "Weekend copy");
    setInputValue(container.querySelector('[aria-label="Choice name"]'), "Relax");

    findButton(container, "Save as new").click();

    await vi.waitFor(async () => expect(await readSpinnyLists()).toHaveLength(2));
    const lists = await readSpinnyLists();
    expect(lists.map((list) => ({ title: list.title, label: list.choices[0].label }))).toEqual([
      { title: "Weekend", label: "Rest" },
      { title: "Weekend copy", label: "Relax" },
    ]);
    await vi.waitFor(() =>
      expect(container.querySelectorAll('[aria-label="Saved lists"] option')).toHaveLength(3),
    );
    expect(container.querySelector<HTMLSelectElement>('[aria-label="Saved lists"]')?.value).toBe(
      lists[1].id,
    );
  });

  test("confirms deletion and resets to a new default list", async () => {
    const weekend = await saveSpinnyList({
      title: "Weekend",
      choices: [{ id: "rest", label: "Rest", weight: 1, included: true }],
    });
    const container = renderApp();
    const select = await vi.waitFor(() => {
      const dropdown = container.querySelector<HTMLSelectElement>('[aria-label="Saved lists"]');
      expect(dropdown?.disabled).toBe(false);
      return dropdown;
    });
    setSelectValue(select, weekend.id);

    findButton(container, "Delete").click();
    expect(container.querySelector('[role="alertdialog"]')?.textContent).toContain(
      "Delete “Weekend”?",
    );
    findButton(container, "Cancel").click();
    await vi.waitFor(() => expect(container.querySelector('[role="alertdialog"]')).toBeNull());
    await expect(readSpinnyLists()).resolves.toHaveLength(1);

    findButton(container, "Delete").click();
    findButton(container, "Delete list").click();

    await vi.waitFor(async () => expect(await readSpinnyLists()).toHaveLength(0));
    await vi.waitFor(() => expect(findButton(container, "Save").disabled).toBe(false));
    expect(container.querySelector<HTMLInputElement>('[aria-label="List title"]')?.value).toBe(
      "New List",
    );
    expect(
      Array.from(
        container.querySelectorAll<HTMLInputElement>('[aria-label="Choice name"]'),
        (input) => input.value,
      ),
    ).toEqual(["Sun", "Water", "Earth", "Wind", "Fire", "Sky", "Air", "Ocean", "Sand"]);
    const savedListsDropdown = container.querySelector<HTMLSelectElement>(
      '[aria-label="Saved lists"]',
    );
    expect(savedListsDropdown?.value).toBe("");
    expect(savedListsDropdown?.selectedIndex).toBe(0);
    expect(savedListsDropdown?.querySelector('option[value=""]')?.textContent).toBe(
      "New list (unsaved)",
    );
  });

  test("updates the selected list without checking for a duplicate title", async () => {
    await saveSpinnyList({ title: "Weather", choices: [] });
    const forecast = await saveSpinnyList({
      title: "Forecast",
      choices: [{ id: "sun", label: "Sun", weight: 1, included: true }],
    });
    const container = renderApp();
    const select = await vi.waitFor(() => {
      const dropdown = container.querySelector<HTMLSelectElement>('[aria-label="Saved lists"]');
      expect(dropdown?.disabled).toBe(false);
      return dropdown;
    });
    setSelectValue(select, forecast.id);
    setInputValue(container.querySelector('[aria-label="List title"]'), "Weather");
    setInputValue(container.querySelector('[aria-label="Choice name"]'), "Rain");

    const updateButton = findButton(container, "Update");
    expect(updateButton.disabled).toBe(false);
    updateButton.click();

    await vi.waitFor(async () => {
      const lists = await readSpinnyLists();
      expect(lists[1].title).toBe("Weather");
      expect(lists[1].choices[0].label).toBe("Rain");
    });
  });

  test("allows saving a duplicate title", async () => {
    await saveSpinnyList({ title: "  NEW LIST  ", choices: [] });
    const container = renderApp();
    const saveButton = findButton(container, "Save");

    setInputValue(container.querySelector('[aria-label="List title"]'), " new list ");
    await vi.waitFor(() => expect(saveButton.disabled).toBe(false));
    saveButton.click();

    await vi.waitFor(async () => expect(await readSpinnyLists()).toHaveLength(2));
    expect((await readSpinnyLists()).map((list) => list.title)).toEqual(["NEW LIST", "new list"]);
  });

  test("disables saving a blank title", async () => {
    const container = renderApp();
    const saveButton = findButton(container, "Save");
    await vi.waitFor(() => expect(saveButton.disabled).toBe(false));

    setInputValue(container.querySelector('[aria-label="List title"]'), "   ");

    expect(saveButton.disabled).toBe(true);
  });

  test("explains choice toggles and deletion with tooltips", () => {
    renderApp();

    expect(findTooltip("Toggle this option").hidden).toBe(false);
    expect(findTooltip("Delete").hidden).toBe(false);
  });

  test("expands and collapses weight options for a choice", () => {
    const container = renderApp();
    const optionsButton = container.querySelector<HTMLButtonElement>(
      '[aria-label="Options for Sun"]',
    );

    expect(optionsButton?.textContent).toContain("…");
    expect(optionsButton?.getAttribute("aria-expanded")).toBe("false");
    expect(container.querySelector('[aria-label="Weight for Sun"]')).toBeNull();
    optionsButton?.click();

    const slider = container.querySelector<HTMLInputElement>('[aria-label="Weight for Sun"]');
    expect(optionsButton?.getAttribute("aria-expanded")).toBe("true");
    expect(slider?.type).toBe("range");
    expect(slider?.min).toBe("1");
    expect(slider?.max).toBe("9");
    expect(slider?.value).toBe("5");
    expect(slider?.parentElement?.id).toBe(optionsButton?.getAttribute("aria-controls"));

    optionsButton?.click();
    expect(optionsButton?.getAttribute("aria-expanded")).toBe("false");
    expect(container.querySelector('[aria-label="Weight for Sun"]')).toBeNull();
  });

  test("maps slider positions to choice weights", async () => {
    const container = renderApp();
    container.querySelector<HTMLButtonElement>('[aria-label="Options for Sun"]')?.click();
    const slider = container.querySelector<HTMLInputElement>('[aria-label="Weight for Sun"]');
    if (!slider) throw new Error("Expected a weight slider.");

    setInputValue(slider, "1");
    expect(slider.getAttribute("aria-valuetext")).toBe("0.5×");
    const saveButton = findButton(container, "Save");
    await vi.waitFor(() => expect(saveButton.disabled).toBe(false));
    saveButton.click();
    await vi.waitFor(async () => expect((await readSpinnyLists())[0]?.choices[0].weight).toBe(0.5));
    await vi.waitFor(() => expect(findButton(container, "Save as new").disabled).toBe(false));

    setInputValue(slider, "9");
    expect(slider.getAttribute("aria-valuetext")).toBe("1.5×");
    findButton(container, "Update").click();
    await vi.waitFor(async () => expect((await readSpinnyLists())[0]?.choices[0].weight).toBe(1.5));
  });

  test("expands options when a saved choice has a custom weight", async () => {
    const weightedList = await saveSpinnyList({
      title: "Weighted",
      choices: [{ id: "sun", label: "Sun", weight: 1.5, included: true }],
    });
    const container = renderApp();
    const select = await vi.waitFor(() => {
      const dropdown = container.querySelector<HTMLSelectElement>('[aria-label="Saved lists"]');
      expect(dropdown?.disabled).toBe(false);
      return dropdown;
    });

    setSelectValue(select, weightedList.id);

    const slider = container.querySelector<HTMLInputElement>('[aria-label="Weight for Sun"]');
    expect(slider?.value).toBe("9");
    expect(slider?.getAttribute("aria-valuetext")).toBe("1.5×");
    expect(
      container
        .querySelector<HTMLButtonElement>('[aria-label="Options for Sun"]')
        ?.getAttribute("aria-expanded"),
    ).toBe("true");
  });

  test("updates the wheel label immediately", () => {
    const container = renderApp();
    const input = container.querySelector<HTMLInputElement>('[aria-label="Choice name"]');

    setInputValue(input, "Solar");

    expect(container.querySelector<HTMLElement>('[data-choice-id="sun"]')?.title).toBe("Solar");
  });

  test("adds a blank choice and includes it after it receives a name", () => {
    const container = renderApp();
    const addButton = findButton(container, "Add option");

    addButton.click();

    const inputs = container.querySelectorAll<HTMLInputElement>('[aria-label="Choice name"]');
    const checkboxes = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
    const newInput = inputs[inputs.length - 1];
    const newCheckbox = checkboxes[checkboxes.length - 1];
    expect(inputs).toHaveLength(10);
    expect(newInput.value).toBe("");
    expect(document.activeElement).toBe(newInput);
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

  test("adds and focuses a new choice when Enter is pressed in a named choice", () => {
    const container = renderApp();
    const firstInput = container.querySelector<HTMLInputElement>('[aria-label="Choice name"]');

    firstInput?.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));

    const inputs = container.querySelectorAll<HTMLInputElement>('[aria-label="Choice name"]');
    const newInput = inputs[inputs.length - 1];
    expect(inputs).toHaveLength(10);
    expect(newInput.value).toBe("");
    expect(document.activeElement).toBe(newInput);
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
    const addButton = findButton(container, "Add option");

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

function findTooltip(content: string): HTMLElement {
  const tooltip = Array.from(document.body.querySelectorAll<HTMLElement>('[role="tooltip"]')).find(
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

function setSelectValue(select: HTMLSelectElement | null | undefined, value: string) {
  if (!select) throw new Error("Expected a saved lists dropdown.");
  select.value = value;
  select.dispatchEvent(new Event("change", { bubbles: true }));
}
