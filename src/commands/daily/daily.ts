import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  MessageFlags,
  InteractionContextType,
  Interaction,
  PermissionsBitField,
  ComponentType,
} from "discord.js";
import { getDailyProblem } from "../../services/leetcode-service.js";
import ProblemContainer from "../../components/leetcode/problem-container.js";
import GuildService from "../../services/guild-service.js";
import {
  DailyServerSettings,
  DailyServerSettingsButtonHandling,
  DailyServerSettingsChannelHandling,
} from "../../components/settings/daily-server-settings.js";

const DAILY_COMMAND = "daily";
const DAILY_SEND_COMMAND = "send";
const DAILY_SETTINGS_COMMAND = "settings";

const guildService = new GuildService();

export const data = new SlashCommandBuilder()
  .setName(DAILY_COMMAND)
  .setDescription("Daily leetcode commands")
  .addSubcommand((subCommand) =>
    subCommand
      .setName(DAILY_SEND_COMMAND)
      .setDescription("Post the daily problem in chat")
      .addBooleanOption((option) =>
        option
          .setName("compact")
          .setDescription("Show a more compact version of the problem, overrides user preference")
      )
  )
  .addSubcommand((subCommand) =>
    subCommand.setName(DAILY_SETTINGS_COMMAND).setDescription("Settings related to automated daily posting")
  )
  .setContexts([InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel]);

export async function execute(interaction: ChatInputCommandInteraction) {
  const subCommand = interaction.options.getSubcommand(true);
  if (subCommand === DAILY_SEND_COMMAND) {
    await executeSend(interaction);
  } else if (subCommand === DAILY_SETTINGS_COMMAND) {
    await executeSettings(interaction);
  } else {
    console.error(`Subcommand ${subCommand} does not exist... somehow`);
    await interaction.reply({
      content: "You managed to somehow call a subcommand that doesn't exist... oops? Logged.",
      flags: MessageFlags.Ephemeral,
    });
  }
}

async function executeSend(interaction: ChatInputCommandInteraction) {
  const dailyProblem = await getDailyProblem();
  if (!dailyProblem) {
    await interaction.editReply(
      "Could not fetch the daily problem (likely not quite out yet). Please try again later."
    );
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

async function executeSettings(interaction: ChatInputCommandInteraction) {
  if (interaction.inGuild()) {
    await postGuildSettings(interaction);
  } else {
    await interaction.reply("Not implemented");
  }
}

async function postGuildSettings(interaction: ChatInputCommandInteraction) {
  if (!interaction.inGuild()) throw Error("Guild settings called in non-guild");
  const response = await interaction.deferReply({
    withResponse: true,
  });
  const settings = await guildService.getGuildSettings(interaction.guildId);
  await interaction.editReply({
    components: DailyServerSettings({ settings }),
    flags: MessageFlags.IsComponentsV2,
  });
  const interactionFilter = (i: Interaction) =>
    i.memberPermissions?.has(PermissionsBitField.Flags.ManageGuild) ?? false;
  const buttonCollector = response.resource?.message?.createMessageComponentCollector({
    filter: interactionFilter,
    componentType: ComponentType.Button,
    time: 3600000, // 1 hour
  });

  const channelCollector = response.resource?.message?.createMessageComponentCollector({
    filter: interactionFilter,
    componentType: ComponentType.ChannelSelect,
    time: 3600000, // 1 hour
  });

  buttonCollector?.on("collect", async (i) => {
    await DailyServerSettingsButtonHandling(i, guildService);
  });

  channelCollector?.on("collect", async (i) => {
    await DailyServerSettingsChannelHandling(i, guildService);
  });
}
