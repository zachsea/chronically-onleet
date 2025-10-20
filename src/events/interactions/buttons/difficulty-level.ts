import { ButtonInteraction, MessageFlags } from "discord.js";

export const interactionId = "difficulty:level";
export const execute = async (interaction: ButtonInteraction) => {
  await interaction.reply({ content: "This is a cosmetic button, sorry!", flags: MessageFlags.Ephemeral });
};
