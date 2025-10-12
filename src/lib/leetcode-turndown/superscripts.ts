import TurndownService from "turndown";
import toSuperscript from "../../utils/toSuperscript.js";

export default function superscripts(turndownService: TurndownService) {
  turndownService.addRule("superscripts", {
    filter: "sup",
    replacement: (content) => toSuperscript(content),
  });
}
