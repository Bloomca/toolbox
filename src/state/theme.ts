import { createState } from "veles";

type Theme = {
  id: string;
  backgroundColour: string;
  iconSelectColour: string;
  windowBackgroundColour: string;
};

type State = {
  activeTheme: Theme;
};

const defaultTheme: Theme = {
  id: "light",
  backgroundColour: "#b9cce9",
  iconSelectColour: "#6161b8",
  windowBackgroundColour: "rgb(207 219 127)",
};

export const themeState$ = createState<State>({
  activeTheme: defaultTheme,
});

export function applyTheme(theme: Theme) {
  document.documentElement.style.setProperty("--bg-colour", theme.backgroundColour);
  document.documentElement.style.setProperty("--icon-select-colour", theme.iconSelectColour);
  document.documentElement.style.setProperty(
    "--window-background-colour",
    theme.windowBackgroundColour,
  );
}
