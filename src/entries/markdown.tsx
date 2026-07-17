import { getAppDefinition } from "../apps/manifest";
import { MarkdownReaderApp } from "../apps/markdown-reader";
import { mountStandaloneApp } from "../shell/standalone-app";

mountStandaloneApp({
  name: getAppDefinition("markdown-reader").name,
  component: <MarkdownReaderApp />,
});
