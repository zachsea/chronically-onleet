import TurndownService, { Node } from "turndown";

export default function examples(turndownService: TurndownService) {
  turndownService.addRule("exampleBlock", {
    filter: function (node: Node) {
      return node.nodeName === "DIV" && (node as HTMLElement).classList.contains("example-block");
    },
    replacement: function (content: string | null) {
      const trimmed = content == null ? "" : content.trim();
      return trimmed.replace(/\n{3,}/g, "\n\n") + "\n\n";
    },
  });
  turndownService.addRule("exampleIoAsCode", {
    filter: function (node: Node) {
      return node.nodeName === "SPAN" && (node as HTMLElement).classList.contains("example-io");
    },
    replacement: function (content: string | null) {
      const trimmed = content == null ? "" : content.trim();
      // remove existing escapes that aren't for backticks
      const escaped = trimmed.replace(/\\(?!`)(.)|\\$/g, "$1");
      return "`" + escaped + "`";
    },
  });
}
