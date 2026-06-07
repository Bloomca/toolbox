import { attachComponent } from "veles";

import { Desktop } from "./desktop";

const container = document.getElementById("app");

function App() {
  return <Desktop />;
}

if (container) {
  attachComponent({
    htmlElement: container,
    component: <App />,
  });
}
