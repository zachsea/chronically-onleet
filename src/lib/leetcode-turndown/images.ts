import TurndownService from "turndown";

export const imageMarkerRegex = /__IMAGE\[(.+?)\]__/g;

export default function images(turndownService: TurndownService) {
  turndownService.addRule("images", {
    filter: "img",
    replacement: (_, node) => {
      const htmlNode = node as HTMLElement;
      const src = htmlNode.getAttribute("src") || "";
      return `__IMAGE[${src}]__`;
    },
  });
}
