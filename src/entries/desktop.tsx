import { Desktop } from "../desktop";
import { mountApplication } from "../shell/mount";
import { Theme } from "../theme";

mountApplication(
  <>
    <Desktop />
    <Theme />
  </>,
);
