import TurndownService from "turndown";
import toSuperscript from "../../utils/to-superscript.js";

export default function superscripts(turndownService: TurndownService) {
  turndownService.addRule("superscripts", {
    filter: "sup",
    replacement: (content) => toSuperscript(content),
  });
}
