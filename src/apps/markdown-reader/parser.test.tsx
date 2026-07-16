/** @vitest-environment happy-dom */

import { afterEach, describe, expect, test } from "vitest";
import { attachComponent } from "veles";

import { Mardown } from "./parser";

let unmount: (() => void) | undefined;

function renderMarkdown(source: string): HTMLElement {
  const container = document.createElement("div");
  document.body.append(container);
  unmount = attachComponent({
    htmlElement: container,
    component: <Mardown source={source} />,
  });
  return container;
}

afterEach(() => {
  unmount?.();
  unmount = undefined;
  document.body.replaceChildren();
});

describe("Markdown", () => {
  test("renders a basic document", () => {
    const container = renderMarkdown(`# Document

A paragraph with **strong**, *emphasis*, ~~deleted~~, \`inline code\`, and a [link](https://example.com).\\
Second line.

---

- First item
- Second item

\`\`\`ts
const value = 1;
\`\`\``);

    const article = container.querySelector("article");
    expect(article?.querySelector("h1")?.textContent).toBe("Document");
    expect(article?.querySelector("p")?.textContent).toBe(
      "A paragraph with strong, emphasis, deleted, inline code, and a link.Second line.",
    );
    expect(article?.querySelector("strong")?.textContent).toBe("strong");
    expect(article?.querySelector("em")?.textContent).toBe("emphasis");
    expect(article?.querySelector("del")?.textContent).toBe("deleted");
    expect(article?.querySelector("p > code")?.textContent).toBe("inline code");
    expect(article?.querySelector("a")?.getAttribute("href")).toBe("https://example.com");
    expect(article?.querySelector("br")).not.toBeNull();
    expect(article?.querySelector("hr")).not.toBeNull();
    expect(
      Array.from(article?.querySelectorAll("ul li") ?? [], (item) => item.textContent),
    ).toEqual(["First item", "Second item"]);
    expect(article?.querySelector("pre > code")?.textContent).toBe("const value = 1;");
  });

  test("renders headings at the corresponding level", () => {
    const container = renderMarkdown("# First\n\n### Third\n\n###### Sixth");

    expect(container.querySelector("h1")?.textContent).toBe("First");
    expect(container.querySelector("h3")?.textContent).toBe("Third");
    expect(container.querySelector("h6")?.textContent).toBe("Sixth");
  });

  test("renders basic inline formatting", () => {
    const container = renderMarkdown(
      "Text with **bold**, *emphasis*, ~~deleted~~, and `inline code`.",
    );

    expect(container.querySelector("strong")?.textContent).toBe("bold");
    expect(container.querySelector("em")?.textContent).toBe("emphasis");
    expect(container.querySelector("del")?.textContent).toBe("deleted");
    expect(container.querySelector("code")?.textContent).toBe("inline code");
  });

  test("renders ordered and unordered lists", () => {
    const container = renderMarkdown("- One\n- Two\n\n1. First\n2. Second");

    expect(Array.from(container.querySelectorAll("ul li"), (item) => item.textContent)).toEqual([
      "One",
      "Two",
    ]);
    expect(Array.from(container.querySelectorAll("ol li"), (item) => item.textContent)).toEqual([
      "First",
      "Second",
    ]);
  });

  test("drops raw HTML and does not create links for unsafe protocols", () => {
    const container = renderMarkdown(
      '[safe](https://example.com) [unsafe](javascript:alert("x"))\n\n<script>alert("x")</script>',
    );

    const links = container.querySelectorAll("a");
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute("href")).toBe("https://example.com");
    expect(container.querySelector("script")).toBeNull();
    expect(container.textContent).toContain("unsafe");
    expect(container.textContent).not.toContain('alert("x")');
  });
});
