import { ChatInputCommandInteraction, InteractionContextType, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("settings")
  .setDescription("View or change bot behavior settings")
  .setContexts([InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel]);

export async function execute(interaction: ChatInputCommandInteraction) {
  console.log("Settings command invoked");

  await interaction.reply("Settings command is under development.");
}
