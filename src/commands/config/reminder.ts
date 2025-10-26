// reminder parent, sub command to set a one-time reminder about the daily, sub command to view that reminder
import { ChatInputCommandInteraction, InteractionContextType, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("reminder")
  .setDescription("Set or view a one-time reminder for the daily problem")
  .addSubcommand((subcommand) =>
    subcommand.setName("set").setDescription("Set a one-time reminder for the next daily problem")
  )
  .addSubcommand((subcommand) => subcommand.setName("view").setDescription("View your currently set reminder"))
  .addSubcommand((subcommand) => subcommand.setName("clear").setDescription("Clear your currently set reminder"))

  .setContexts([InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel]);

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.reply("Reminder command is under development.");
}
