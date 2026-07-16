import { createState } from "veles";

import { Markdown } from "./parser";
import styles from "./style.module.css";

type DocumentState =
  | { status: "empty" }
  | { status: "loaded"; fileName: string; source: string }
  | { status: "error"; message: string };

const MARKDOWN_EXTENSIONS = [".md", ".markdown", ".mdown", ".mkd", ".mkdn"];

export function MarkdownReaderApp() {
  const document$ = createState<DocumentState>({ status: "empty" });
  const isDragging$ = createState(false);
  let dragDepth = 0;

  function hasFiles(event: DragEvent): boolean {
    const dataTransfer = event.dataTransfer;
    return (
      Array.from(dataTransfer?.types ?? []).includes("Files") ||
      (dataTransfer?.files.length ?? 0) > 0
    );
  }

  function onDragEnter(event: DragEvent) {
    if (!hasFiles(event)) return;

    event.preventDefault();
    dragDepth += 1;
    isDragging$.set(true);
  }

  function onDragOver(event: DragEvent) {
    if (!hasFiles(event)) return;

    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
  }

  function onDragLeave(event: DragEvent) {
    if (!hasFiles(event)) return;

    event.preventDefault();
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0) isDragging$.set(false);
  }

  async function onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    dragDepth = 0;
    isDragging$.set(false);

    const file = event.dataTransfer?.files[0];
    if (!file) return;

    if (!isMarkdownFile(file)) {
      document$.set({ status: "error", message: "Please drop a Markdown document." });
      return;
    }

    try {
      document$.set({ status: "loaded", fileName: file.name, source: await file.text() });
    } catch {
      document$.set({ status: "error", message: `Could not read ${file.name}.` });
    }
  }

  return (
    <div
      class={styles.app}
      data-markdown-drop-target="true"
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {document$.render((document) => {
        switch (document.status) {
          case "empty":
            return (
              <div class={styles.emptyState}>
                <strong>Drop a Markdown document</strong>
              </div>
            );
          case "error":
            return (
              <div class={styles.emptyState}>
                <strong>{document.message}</strong>
                <span>Drop another file to try again.</span>
              </div>
            );
          case "loaded":
            return (
              <div class={styles.document} aria-label={document.fileName}>
                <Markdown source={document.source} />
              </div>
            );
        }
      })}
      {isDragging$.render((isDragging) =>
        isDragging ? (
          <div class={styles.dropOverlay} role="status">
            Drop the Markdown document to open it
          </div>
        ) : null,
      )}
    </div>
  );
}

function isMarkdownFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    file.type === "text/markdown" ||
    MARKDOWN_EXTENSIONS.some((extension) => name.endsWith(extension))
  );
}
