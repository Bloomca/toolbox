import { createElement } from "veles";

import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";

import type { RootContent, Parent, Heading } from "mdast";

const markdownParser = unified().use(remarkParse).use(remarkGfm);

export function Mardown({ source }: { source: string }) {
  const tree = markdownParser.parse(source);

  return (
    <article class="markdown">
      {tree.children.map((node) => (
        <MarkdownNode node={node} />
      ))}
    </article>
  );
}

function MarkdownNode({ node }: { node: RootContent }) {
  switch (node.type) {
    case "text":
      return node.value;
    case "paragraph":
      return <p>{renderChildren(node)}</p>;
    case "heading":
      return renderHeading(node);
    case "strong":
      return <strong>{renderChildren(node)}</strong>;
    case "emphasis":
      return <em>{renderChildren(node)}</em>;
    case "delete":
      return <del>{renderChildren(node)}</del>;
    case "inlineCode":
      return <code>{node.value}</code>;
    case "code":
      return (
        <pre>
          <code>{node.value}</code>
        </pre>
      );
    case "break":
      return <br />;
    case "thematicBreak":
      return <hr />;
    case "list": {
      const content = renderChildren(node);
      return node.ordered ? <ol>{content}</ol> : <ul>{content}</ul>;
    }
    case "listItem":
      return <li>{renderChildren(node)}</li>;
    case "link": {
      const link = safeHref(node.url);

      return link ? (
        <a href={link} target="_blank" rel="noopener noreferrer">
          {renderChildren(node)}
        </a>
      ) : (
        <span>{renderChildren(node)}</span>
      );
    }
    case "definition":
      return null;
    case "html":
      return null;
    default:
      return null;
  }
}

function renderChildren(node: Parent) {
  return node.children.map((child) => <MarkdownNode node={child} />);
}

function renderHeading(node: Heading) {
  const tag = `h${node.depth}` as const;
  return createElement(tag, { children: renderChildren(node) });
}

const ALLOWED_PROTOCOLS = ["http:", "https:", "mailto:"];
function safeHref(link: string): string | undefined {
  try {
    const url = new URL(link);
    if (ALLOWED_PROTOCOLS.includes(url.protocol)) return link;
  } catch {
    // invalid URL
  }

  return undefined;
}
