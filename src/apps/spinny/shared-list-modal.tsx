import { createState } from "veles";

import { Button } from "../../design/button";
import { Modal } from "../../design/modal";
import { TextInput } from "../../design/text-input";
import styles from "./shared-list-modal.module.css";

export function SharedListModal({ link, onClose }: { link: string; onClose: () => void }) {
  const copied$ = createState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      copied$.set(true);
    } catch (error) {
      console.error("Could not copy shared list link.", error);
    }
  }

  return (
    <Modal
      title="List shared successfully"
      description="Send this link to someone so they can open the shared list."
      size="wide"
      onClose={onClose}
    >
      <div class={styles.linkField}>
        <TextInput aria-label="Shared list link" disabled value={link} />
        <Button
          class={styles.copyButton}
          variant="ghost"
          data-toolbox-modal-initial-focus=""
          onClick={() => void copyLink()}
        >
          {copied$.render((copied) => (copied ? "Copied" : "Copy"))}
        </Button>
      </div>
      <div class={styles.actions}>
        <Button onClick={onClose}>Close</Button>
      </div>
    </Modal>
  );
}
