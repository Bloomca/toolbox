import { getAppDefinition } from "../apps/manifest";
import { SpinnyApp } from "../apps/spinny";
import { mountStandaloneApp } from "../shell/standalone-app";

mountStandaloneApp({
  name: getAppDefinition("spinny").name,
  component: <SpinnyApp />,
});
