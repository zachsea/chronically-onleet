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
  DailyServerSettingsRoleHandling,
} from "../../components/settings/daily-server-settings.js";
import UserService from "../../services/user-service.js";
import { DailyUserSettings, DailyUserSettingsButtonHandling } from "../../components/settings/daily-user-settings.js";
import { isOnlyUserInstalled } from "../../utils/discord.js";

const DAILY_COMMAND = "daily";
const DAILY_SEND_COMMAND = "send";
const DAILY_SETTINGS_COMMAND = "settings";

const guildService = new GuildService();
const userService = new UserService();

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
  const useCompact = interaction.options.getBoolean("compact", false) ?? false;
  await interaction.deferReply();
  const dailyProblem = await getDailyProblem();
  if (!dailyProblem) {
    await interaction.editReply(
      "Could not fetch the daily problem (likely not quite out yet). Please try again later."
    );
    return;
  }
  // use the components to display the problem for now
  const components = ProblemContainer(dailyProblem, useCompact, true);
  try {
    await interaction.editReply({ content: null, components, flags: MessageFlags.IsComponentsV2 });
  } catch (error) {
    console.error("Error editing reply:", error);
  }
}

async function executeSettings(interaction: ChatInputCommandInteraction) {
  if (interaction.inGuild()) {
    if (isOnlyUserInstalled(interaction)) {
      await interaction.reply({
        content:
          "You must install the application to this guild to post dailies, this command was ran from a user installed context.\n**If you wish to have dailies in your DMs, run this command from a DM with the bot**",
        flags: MessageFlags.Ephemeral,
      });
    } else {
      // permission check
      if (!interaction.memberPermissions.has(PermissionsBitField.Flags.ManageGuild)) {
        await interaction.reply({
          content: "You must have the `Manage Server` permission to use this command in this context",
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await postGuildSettings(interaction);
      }
    }
  } else if (interaction.context == InteractionContextType.BotDM) {
    await postUserSettings(interaction);
  } else {
    await interaction.reply({
      content: `This context is not supported. Daily messages can be configured in the following locations:\n- Servers\n- The bot's DM ${interaction.client.user.toString()} (either share a server or install me in your user for this!)`,
      flags: MessageFlags.Ephemeral,
    });
  }
}

async function postGuildSettings(interaction: ChatInputCommandInteraction) {
  if (!interaction.inGuild()) throw Error("Guild settings called in non-guild");
  const response = await interaction.deferReply({
    withResponse: true,
  });
  const settings = await guildService.getGuildSettings(interaction.guildId);
  await interaction.editReply({
    components: await DailyServerSettings({ settings, interaction }),
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

  const roleCollector = response.resource?.message?.createMessageComponentCollector({
    filter: interactionFilter,
    componentType: ComponentType.RoleSelect,
    time: 3600000, // 1 hour
  });

  buttonCollector?.on("collect", async (i) => {
    try {
      await DailyServerSettingsButtonHandling(i, guildService);
    } catch (error) {
      console.error(error);
      await i.followUp({
        content: "There was an unexpected error for that interaction, sorry!",
        flags: MessageFlags.Ephemeral,
      });
    }
  });

  channelCollector?.on("collect", async (i) => {
    try {
      await DailyServerSettingsChannelHandling(i, guildService);
    } catch (error) {
      console.error(error);
      await i.followUp({
        content: "There was an unexpected error for that interaction, sorry!",
        flags: MessageFlags.Ephemeral,
      });
    }
  });

  roleCollector?.on("collect", async (i) => {
    try {
      await DailyServerSettingsRoleHandling(i, guildService);
    } catch (error) {
      console.error(error);
      await i.followUp({
        content: "There was an unexpected error for that interaction, sorry!",
        flags: MessageFlags.Ephemeral,
      });
    }
  });
}

async function postUserSettings(interaction: ChatInputCommandInteraction) {
  if (interaction.context != InteractionContextType.BotDM) throw Error("User button handler called on non-DM context");
  const response = await interaction.deferReply({
    withResponse: true,
  });
  const settings = await userService.getUserSettings(interaction.user.id);
  await interaction.editReply({
    components: DailyUserSettings({ settings, interaction }),
    flags: MessageFlags.IsComponentsV2,
  });

  const buttonCollector = response.resource?.message?.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 3600000, // 1 hour
  });

  buttonCollector?.on("collect", async (i) => {
    await DailyUserSettingsButtonHandling(i, userService);
  });
}
