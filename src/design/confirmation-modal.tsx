import { Button } from "./button";
import "./confirmation-modal.css";
import { Modal } from "./modal";

export type ConfirmationModalProps = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmationModal({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  return (
    <Modal title={title} description={message} role="alertdialog" onClose={onCancel}>
      <div data-toolbox-confirmation-actions="">
        <Button data-toolbox-modal-initial-focus="" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button tone={tone} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
