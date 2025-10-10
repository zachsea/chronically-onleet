import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("random")
  .setDescription("Replies with a random LeetCode problem");

export async function execute(interaction: ChatInputCommandInteraction) {
  console.log("Random command invoked");
  await interaction.reply({
    embeds: [
      {
        title: "Random LeetCode Problem",
        description: "(not implemented)",
        color: 0x00ff00,
      },
    ],
  });
}
