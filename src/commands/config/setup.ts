import { ChatInputCommandInteraction, InteractionContextType, SlashCommandBuilder } from "discord.js";
import TurndownService from "turndown";
import leetcodeTurndown from "../../lib/leetcode-turndown/index.js";

export const data = new SlashCommandBuilder()
  .setName("setup")
  .setDescription("Onboarding process for posting daily problems")
  .setContexts([InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel]);

export async function execute(interaction: ChatInputCommandInteraction) {
  // console.log("Setup command invoked");
  // await interaction.reply("Setup command is under development.");
  const turndownService = new TurndownService();
  turndownService.use(leetcodeTurndown);
  await interaction.reply(
    turndownService.turndown(
      '<p><strong>Input:</strong> <span class="example-io">skill = [1,5,2,4], mana = [5,1,4,2]</span></p>'
    )
  );
}
