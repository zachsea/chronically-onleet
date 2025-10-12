import TurndownService from "turndown";

export default function quotes(turndownService: TurndownService) {
  turndownService.addRule("quoteIndents", {
    filter: "pre",
    replacement: (content) => {
      // remove trailing newlines and then replace newlines with quote formatting
      const trimmedContent = content.replace(/\n+$/, "");
      return `> ${trimmedContent.replace(/\n/g, "\n> ")}`;
    },
  });
}
