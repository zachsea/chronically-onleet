import {
  ButtonBuilder,
  ButtonStyle,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ActionRowBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
} from "discord.js";
import { Problem } from "leetcode-query";
import TurndownService from "turndown";
import leetcodeTurndown from "../../lib/leetcode-turndown/index.js";
import { imageMarkerRegex } from "../../lib/leetcode-turndown/images.js";

const turndownService: TurndownService = new TurndownService();
turndownService.use(leetcodeTurndown);

const addHTMLContent = (content: string) => {
  const components: (MediaGalleryBuilder | TextDisplayBuilder)[] = [];
  const blocks = content.split(imageMarkerRegex);
  blocks.forEach((block) => {
    if (URL.canParse(block)) {
      components.push(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(block)));
    } else {
      components.push(new TextDisplayBuilder().setContent(block));
    }
  });
  return components;
};

export default function ProblemForumPost(problem: Problem, useCompact = false) {
  const transformedContent = turndownService.turndown(problem.content);
  let content: (MediaGalleryBuilder | TextDisplayBuilder)[] = [];

  if (!useCompact) {
    content = addHTMLContent(transformedContent);
  }

  return [
    ...content,
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true),
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel("Open Problem")
        .setStyle(ButtonStyle.Link)
        .setURL(`https://leetcode.com/problems/${problem.titleSlug}/`),
      new ButtonBuilder()
        .setLabel("Remind me...")
        .setCustomId("set-reminder:daily")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true)
        .setEmoji("⏰")
    ),
  ];
}
