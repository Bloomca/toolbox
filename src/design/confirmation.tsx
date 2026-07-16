import { createContext, createState, onUnmount, type State } from "veles";
import type { JSX } from "veles/jsx-runtime";

import { ConfirmationModal, type ConfirmationModalProps } from "./confirmation-modal";

export type ConfirmationOptions = Omit<ConfirmationModalProps, "onConfirm" | "onCancel">;
export type RequestConfirmation = (options: ConfirmationOptions) => Promise<boolean>;

type ConfirmationRequest = {
  options: ConfirmationOptions;
  resolve: (response: boolean) => void;
};

type ConfirmationController = {
  activeRequest$: State<ConfirmationRequest | null>;
  requestConfirmation: RequestConfirmation;
  respond: (request: ConfirmationRequest, response: boolean) => void;
  dispose: () => void;
};

type ConfirmationProviderProps = {
  children?: JSX.HTMLAttributes<HTMLDivElement>["children"];
};

const confirmationContext = createContext<ConfirmationController | undefined>();

export function ConfirmationProvider({ children }: ConfirmationProviderProps) {
  const controller = createConfirmationController();
  onUnmount(controller.dispose);

  return (
    <confirmationContext.Provider value={controller}>
      {children}
      <ConfirmationRenderer />
    </confirmationContext.Provider>
  );
}

/**
 * Reads the confirmation function for the current provider. Call this while the
 * consuming component is rendering, then retain the returned function for
 * event handlers and other asynchronous work.
 */
export function useConfirmation(): RequestConfirmation {
  const controller = confirmationContext.readContext();
  if (!controller) throw new Error("useConfirmation needs a ConfirmationProvider.");
  return controller.requestConfirmation;
}

function ConfirmationRenderer() {
  const controller = confirmationContext.readContext();
  if (!controller) throw new Error("ConfirmationRenderer needs a ConfirmationProvider.");

  return controller.activeRequest$.render((request) =>
    request ? (
      <ConfirmationModal
        {...request.options}
        onConfirm={() => controller.respond(request, true)}
        onCancel={() => controller.respond(request, false)}
      />
    ) : null,
  );
}

function createConfirmationController(): ConfirmationController {
  const activeRequest$ = createState<ConfirmationRequest | null>(null);
  const queue: ConfirmationRequest[] = [];
  let disposed = false;

  const requestConfirmation: RequestConfirmation = (options) => {
    if (disposed) return Promise.resolve(false);

    return new Promise<boolean>((resolve) => {
      const request = { options, resolve };
      if (activeRequest$.get()) queue.push(request);
      else activeRequest$.set(request);
    });
  };

  function respond(request: ConfirmationRequest, response: boolean) {
    if (activeRequest$.get() !== request) return;

    activeRequest$.set(queue.shift() ?? null);
    request.resolve(response);
  }

  function dispose() {
    if (disposed) return;
    disposed = true;

    const activeRequest = activeRequest$.get();
    const unresolvedRequests = activeRequest ? [activeRequest, ...queue] : [...queue];
    queue.length = 0;
    activeRequest$.set(null);
    unresolvedRequests.forEach((request) => request.resolve(false));
  }

  return { activeRequest$, requestConfirmation, respond, dispose };
}
