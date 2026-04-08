import {
  ButtonInteraction,
  MessageFlags,
  ModalBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  LabelBuilder,
} from "discord.js";
import ReminderService from "../../../services/reminder-service.js";
import { reminderSettingsComponent } from "../../../components/settings/reminder-settings.js";

const reminderService = new ReminderService();

export const interactionId = "reminder";
export const execute = async (interaction: ButtonInteraction) => {
  const parts = interaction.customId.split(":");
  const action = parts[1]; // set, cancel, edit
  const source = parts[2]; // daily or messageId

  if (action === "set" || action === "edit") {
    try {
      const reminder = await reminderService.getReminder(interaction.user.id);

      // create reminder time selection modal with source encoded in customId
      const modal = new ModalBuilder()
        .setCustomId(`modal:user-reminder:${source}`)
        .setTitle(action === "set" ? "Extra Reminder - When?" : "Edit Extra Reminder");

      // hour select
      const currentHours = reminder ? Math.floor((reminder.triggersAt.getTime() - new Date().getTime()) / 3600000) : 0;
      const hourLabel = new LabelBuilder().setLabel("Hours from now (0-23)").setStringSelectMenuComponent(
        new StringSelectMenuBuilder().setCustomId("select:reminder-hour").addOptions(
          Array.from({ length: 24 }, (_, i) =>
            new StringSelectMenuOptionBuilder()
              .setLabel(String(i).padStart(2, "0"))
              .setValue(String(i))
              .setDefault(i === Math.max(0, currentHours))
          )
        )
      );

      // minute select
      const currentMinutes = reminder
        ? Math.floor(((reminder.triggersAt.getTime() - new Date().getTime()) % 3600000) / 60000)
        : 0;
      const minuteLabel = new LabelBuilder()
        .setLabel("Minutes from now (0-59, 5-min intervals)")
        .setStringSelectMenuComponent(
          new StringSelectMenuBuilder().setCustomId("select:reminder-minute").addOptions(
            Array.from({ length: 12 }, (_, i) =>
              new StringSelectMenuOptionBuilder()
                .setLabel(String(i * 5).padStart(2, "0"))
                .setValue(String(i * 5))
                .setDefault(i * 5 === Math.max(0, currentMinutes))
            )
          )
        );

      modal.addLabelComponents(hourLabel, minuteLabel);
      await interaction.showModal(modal);
    } catch (error) {
      console.error("Error opening reminder modal:", error);
      await interaction.reply({
        content: "Failed to open reminder settings",
        flags: MessageFlags.Ephemeral,
      });
    }
  } else if (action === "cancel") {
    try {
      await reminderService.cancelReminder(interaction.user.id);

      // If from settings (source is messageId), try to update the DM
      if (source !== "daily") {
        await interaction.deferUpdate();
        const components = reminderSettingsComponent({ reminder: null, messageId: source });
        await interaction.message.edit({
          content: null,
          components: components,
          flags: MessageFlags.IsComponentsV2,
        });
      } else {
        // If from problem post, just send ephemeral
        await interaction.reply({
          content: "Reminder cancelled!",
          flags: MessageFlags.Ephemeral,
        });
      }
    } catch (error) {
      console.error("Error canceling reminder:", error);
      await interaction.reply({ content: "Failed to cancel reminder", flags: MessageFlags.Ephemeral });
    }
  }
};
