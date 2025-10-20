import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags, InteractionContextType } from "discord.js";
import { getDailyProblem } from "../../services/leetcode-service.js";
import ProblemContainer from "../../components/leetcode/problem-container.js";

// temp

export const data = new SlashCommandBuilder()
  .setName("daily")
  .setDescription("Get the daily LeetCode problem")
  .addBooleanOption((option) =>
    option.setName("compact").setDescription("Show a more compact version of the problem, overrides user preference")
  )
  .setContexts([InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel]);

export async function execute(interaction: ChatInputCommandInteraction) {
  console.log("Daily command invoked");
  // fetch daily problem from leetcode service
  await interaction.reply({ content: "Fetching daily problem..." });
  const dailyProblem = await getDailyProblem();
  if (!dailyProblem) {
    await interaction.editReply("Could not fetch the daily problem. Please try again later.");
    return;
  }
  // use the components to display the problem for now
  const components = ProblemContainer(dailyProblem);
  try {
    await interaction.editReply({ content: null, components, flags: MessageFlags.IsComponentsV2 });
  } catch (error) {
    console.error("Error editing reply:", error);
  }
}
