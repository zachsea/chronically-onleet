import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder,
} from "discord.js";
import { ReminderDocument } from "../../models/reminder.js";

interface ReminderSettingsProps {
  reminder: ReminderDocument | null;
  messageId: string;
}

export function reminderSettingsComponent({ reminder, messageId }: ReminderSettingsProps) {
  let mainContainer = new ContainerBuilder().addTextDisplayComponents(
    new TextDisplayBuilder().setContent("### Extra Reminder")
  );

  mainContainer = mainContainer.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
  );

  // status section
  if (reminder) {
    const unixSeconds = Math.floor(reminder.triggersAt.getTime() / 1000);
    const timeStr = `<t:${unixSeconds}:f>`;

    mainContainer = mainContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent("**Extra reminder active**"),
      new TextDisplayBuilder().setContent(`You'll be notified at: ${timeStr}`)
    );

    // buttons for editing/canceling
    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setLabel("Edit").setCustomId(`reminder:edit:${messageId}`).setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setLabel("Cancel").setCustomId(`reminder:cancel:${messageId}`).setStyle(ButtonStyle.Danger)
    );

    return [mainContainer, actionRow];
  } else {
    mainContainer = mainContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent("**No extra reminder set**"),
      new TextDisplayBuilder().setContent("Set an extra reminder to get a DM notification for today's problem.")
    );

    // button for setting
    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel("Set Reminder")
        .setCustomId(`reminder:set:${messageId}`)
        .setStyle(ButtonStyle.Success)
    );

    return [mainContainer, actionRow];
  }
}
