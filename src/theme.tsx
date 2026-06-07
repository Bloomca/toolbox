import { themeState$, applyTheme } from "./state/theme";

export function Theme() {
  themeState$.trackSelected((value) => value.activeTheme, applyTheme);

  return null;
}
