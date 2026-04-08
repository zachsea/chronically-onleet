import { MessageFlags, ModalSubmitInteraction } from "discord.js";
import ReminderService from "../../../services/reminder-service.js";
import { reminderSettingsComponent } from "../../../components/settings/reminder-settings.js";

const reminderService = new ReminderService();

export const interactionId = "modal:user-reminder";
export const execute = async (interaction: ModalSubmitInteraction) => {
  if (!interaction.user.id) {
    throw Error("User reminder modal called without user id in interaction");
  }
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  // extract and validate time offset
  const hours = parseInt(interaction.fields.getStringSelectValues("select:reminder-hour")[0]) || 0;
  const minutes = parseInt(interaction.fields.getStringSelectValues("select:reminder-minute")[0]) || 0;
  const totalMinutes = Math.min(Math.max(0, hours * 60 + minutes), 60 * 24 - 1);

  // calculate absolute trigger time (now + offset)
  const now = new Date();
  const triggersAt = new Date(now.getTime() + totalMinutes * 60000);

  try {
    await reminderService.setReminder(interaction.user.id, triggersAt);
  } catch (error) {
    console.error(error);
    await interaction.editReply({ content: "An error occurred, this has been logged." });
    return;
  }

  const source = interaction.customId.split(":").at(-1);
  const isFromSettings = source !== "daily";

  // if from settings, try to update the original message
  if (isFromSettings) {
    try {
      const channel = await interaction.user.createDM();
      const message = await channel?.messages.fetch(source as string);

      if (message) {
        const reminder = await reminderService.getReminder(interaction.user.id);
        if (reminder) {
          await message.edit({
            content: null,
            components: reminderSettingsComponent({ reminder, messageId: source as string }),
            flags: MessageFlags.IsComponentsV2,
          });
        }
      }
    } catch (err) {
      console.debug("Could not update reminder settings message:", err instanceof Error ? err.message : err);
    }
  }

  // calculate discord timestamp for display
  const unixSeconds = Math.floor(triggersAt.getTime() / 1000);
  await interaction.editReply({
    content: `**One-time reminder set for <t:${unixSeconds}:f>**`,
  });
};
