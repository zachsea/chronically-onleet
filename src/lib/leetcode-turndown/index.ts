import TurndownService from "turndown";
import examples from "./examples.js";
import superscripts from "./superscripts.js";
import images from "./images.js";
import quotes from "./quotes.js";

export default function leetcodeTurndown(turndownService: TurndownService) {
  turndownService.use([examples, superscripts, images, quotes]);
  return turndownService;
}
