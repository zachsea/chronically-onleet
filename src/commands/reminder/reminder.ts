import { ChatInputCommandInteraction, InteractionContextType, SlashCommandBuilder, MessageFlags } from "discord.js";
import ReminderService from "../../services/reminder-service.js";
import { reminderSettingsComponent } from "../../components/settings/reminder-settings.js";

const reminderService = new ReminderService();

export const data = new SlashCommandBuilder()
  .setName("reminder")
  .setDescription("Manage your extra reminder for the daily problem")
  .setContexts([InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel]);

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  try {
    const reminder = await reminderService.getReminder(interaction.user.id);

    const components = reminderSettingsComponent({
      reminder,
      messageId: (await interaction.fetchReply()).id,
    });

    await interaction.editReply({
      content: null,
      components: components,
      flags: MessageFlags.IsComponentsV2,
    });
  } catch (error) {
    console.error("Error in reminder command:", error);
    await interaction.editReply({ content: "An error occurred while fetching your reminder settings." });
  }
}
