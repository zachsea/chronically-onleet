import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { getDailyProblem } from "../../services/leetcode-service.js";

export const data = new SlashCommandBuilder()
  .setName("daily")
  .setDescription("Commands related to daily problems")
  .addSubcommand((subcommand) => subcommand.setName("get").setDescription("Get today's daily problem"));

export async function execute(interaction: ChatInputCommandInteraction) {
  console.log("Daily command invoked");
  if (interaction.options.getSubcommand() === "get") {
    await executeSubGet(interaction);
  } else {
    await interaction.reply("Unknown subcommand");
  }
}

export async function executeSubGet(interaction: ChatInputCommandInteraction) {
  // fetch daily problem from leetcode service
  const dailyProblem = await getDailyProblem();
  console.log("Fetched daily problem:", dailyProblem);
  await interaction.reply({
    embeds: [
      {
        title: "Daily LeetCode Problem",
        description: dailyProblem?.question.content || "(not implemented)",
        color: 0x00ff00,
      },
    ],
  });
}
