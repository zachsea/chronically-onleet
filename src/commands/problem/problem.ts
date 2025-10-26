import { ChatInputCommandInteraction, InteractionContextType, MessageFlags, SlashCommandBuilder } from "discord.js";
import { getProblemByQuery } from "../../services/leetcode-service.js";
import ProblemContainer from "../../components/leetcode/problem-container.js";

export const data = new SlashCommandBuilder()
  .setName("problem")
  .setDescription("Fetch a specific problem by its ID, slug, or keyword")
  .addStringOption((option) =>
    option.setName("query").setDescription("The ID, slug, keyword, or URL of the problem to fetch").setRequired(true)
  )
  .addBooleanOption((option) =>
    option.setName("compact").setDescription("Show a more compact version of the problem, overrides user preference")
  )
  .setContexts([InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel]);

export async function execute(interaction: ChatInputCommandInteraction) {
  const problemId = interaction.options.getString("query", true);

  await interaction.reply({ content: `Fetching problem ${problemId}...` });

  const problem = await getProblemByQuery(problemId);
  if (!problem) {
    await interaction.editReply(`Could not find problem with query "${problemId}". Please try again.`);
    return;
  }

  if (problem.isPaidOnly) {
    await interaction.editReply(
      `The problem "${problem.title}" is a paid-only problem and cannot be fetched. Please try another problem.`
    );
    return;
  }

  if (!problem.content || problem.content.trim() === "") {
    await interaction.editReply(
      `The problem "${problem.title}" does not have any content available. Please try another problem.`
    );
    return;
  }

  const components = ProblemContainer(problem);
  try {
    await interaction.editReply({ content: null, components, flags: MessageFlags.IsComponentsV2 });
  } catch (error) {
    console.error("Error editing reply:", error);
    await interaction.editReply("An error occurred while displaying the problem. Please try again later.");
  }
}
