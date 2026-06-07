import { attachComponent } from "veles";

import { Desktop } from "./desktop";
import { Theme } from "./theme";

const container = document.getElementById("app");

function App() {
  return (
    <>
      <Desktop />
      <Theme />
    </>
  );
}

if (container) {
  attachComponent({
    htmlElement: container,
    component: <App />,
  });
}
