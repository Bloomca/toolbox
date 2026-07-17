import { ConfirmationProvider } from "../design/confirmation";
import { Theme } from "../theme";
import { mountApplication, type MountableComponent } from "./mount";

export type StandaloneAppOptions = {
  name: string;
  component: MountableComponent;
};

type StandaloneAppProps = Pick<StandaloneAppOptions, "component">;

export function StandaloneApp({ component }: StandaloneAppProps) {
  return (
    <>
      <Theme />
      <main class="standalone-app">
        <ConfirmationProvider>
          <div class="standalone standalone-app-container">{component}</div>
        </ConfirmationProvider>
      </main>
    </>
  );
}

export function mountStandaloneApp({ name, component }: StandaloneAppOptions): () => void {
  document.title = `${name} · Toolbox`;
  return mountApplication(<StandaloneApp component={component} />);
}
