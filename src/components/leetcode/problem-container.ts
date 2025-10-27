import {
  ContainerBuilder,
  SectionBuilder,
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

const addHTMLContent = (parentBuilder: ContainerBuilder, content: string) => {
  const blocks = content.split(imageMarkerRegex);
  return blocks.reduce((builder, block) => {
    if (URL.canParse(block)) {
      return builder.addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(block))
      );
    }
    return builder.addTextDisplayComponents(new TextDisplayBuilder().setContent(block));
  }, parentBuilder);
};

export default function ProblemContainer(problem: Problem, useCompact = false) {
  const transformedContent = turndownService.turndown(problem.content);
  let contentContainer = new ContainerBuilder().addSectionComponents(
    new SectionBuilder()
      .setButtonAccessory(
        new ButtonBuilder()
          .setStyle(
            problem.difficulty === "Easy"
              ? ButtonStyle.Success
              : problem.difficulty === "Medium"
                ? ButtonStyle.Primary
                : ButtonStyle.Danger
          )
          .setLabel(problem.difficulty ?? "Unknown")
          .setCustomId("difficulty:level")
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${problem.questionFrontendId}\\. ${problem.title}`)
      )
  );

  if (!useCompact) {
    contentContainer.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
    );
    contentContainer = addHTMLContent(contentContainer, transformedContent);
  }

  return [
    contentContainer,
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
