import { createState } from "veles";

type Theme = {
  id: string;
  backgroundColour: string;
};

type State = {
  activeTheme: Theme;
};

const defaultTheme: Theme = {
  id: "light",
  backgroundColour: "#b9cce9",
};

export const themeState$ = createState<State>({
  activeTheme: defaultTheme,
});

export function applyTheme(theme: Theme) {
  document.documentElement.style.setProperty("--bg-colour", theme.backgroundColour);
}
