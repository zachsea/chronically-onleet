import {
  ChannelType,
  ChatInputCommandInteraction,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { getProblemByQuery } from "../../services/leetcode-service.js";
import ProblemContainer from "../../components/leetcode/problem-container.js";
import { sendProblemToChannel } from "../../services/problem-sender.js";
import { isOnlyUserInstalled } from "../../utils/discord.js";

export const data = new SlashCommandBuilder()
  .setName("problem")
  .setDescription("Fetch a specific problem by its ID, slug, or keyword")
  .addSubcommand((subCommand) =>
    subCommand
      .setName("send")
      .setDescription("Send the details of a given LeetCode problem")
      .addStringOption((option) =>
        option.setName("query").setDescription("The ID, slug, or URL of the problem to fetch").setRequired(true)
      )
      .addBooleanOption((option) =>
        option
          .setName("compact")
          .setDescription("Show a more compact version of the problem, overrides user preference")
      )
  )
  .addSubcommand((subCommand) =>
    subCommand
      .setName("post")
      .setDescription("Create a thread or forum post for sharing solutions to a LeetCode problem")
      .addStringOption((option) =>
        option
          .setName("query")
          .setDescription("The ID, slug, keyword, or URL of the problem to fetch")
          .setRequired(true)
      )
      .addChannelOption((option) =>
        option
          .setName("channel")
          .setDescription("Channel to post the thread or create the forum post in")
          .addChannelTypes([ChannelType.GuildText, ChannelType.GuildForum])
          .setRequired(true)
      )
      .addBooleanOption((option) =>
        option
          .setName("compact")
          .setDescription("Show a more compact version of the problem, overrides user preference")
      )
  )
  .setContexts([InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel]);

export async function execute(interaction: ChatInputCommandInteraction) {
  const subCommand = interaction.options.getSubcommand(true);

  if (subCommand === "post") {
    await executePost(interaction);
  } else if (subCommand === "send") {
    await executeSend(interaction);
  }
}

export async function executePost(interaction: ChatInputCommandInteraction) {
  const problemQuery = interaction.options.getString("query", true);
  const useCompact = interaction.options.getBoolean("compact", false) ?? false;

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  if (!interaction.inGuild() || isOnlyUserInstalled(interaction)) {
    await interaction.editReply(`This command only works in guild installed contexts`);
    return;
  }

  const problem = await getProblemByQuery(problemQuery);

  if (!problem) {
    await interaction.editReply(`Could not find problem with query "${problemQuery}". Please try again.`);
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

  const channel = interaction.options.getChannel("channel", true);
  const targetChannelId = channel.id;

  if (!targetChannelId) {
    await interaction.editReply(`Could not determine the channel to post in. Please try again.`);
    return;
  }

  // Fetch the full channel object to check permissions
  const targetChannel = await interaction.guild?.channels.fetch(targetChannelId);
  if (!targetChannel) {
    await interaction.editReply(`Could not fetch channel information. Please try again.`);
    return;
  }

  // Check user permissions
  const userPermissions = targetChannel.permissionsFor(interaction.user);

  if (!userPermissions?.has(PermissionFlagsBits.SendMessages)) {
    await interaction.editReply(
      `You don't have permission to send messages in <#${targetChannelId}>. You need the **Send Messages** permission.`
    );
    return;
  }

  if (!userPermissions?.has(PermissionFlagsBits.CreatePublicThreads)) {
    await interaction.editReply(`You don't have permission to create threads/posts in <#${targetChannelId}>.`);
    return;
  }

  const botPermissions = targetChannel.permissionsFor(interaction.client.user);

  if (!botPermissions?.has(PermissionFlagsBits.SendMessages)) {
    await interaction.editReply(
      `I don't have permission to send messages in <#${targetChannelId}>. Please ensure I have the **Send Messages** permission.`
    );
    return;
  }

  if (targetChannel.type !== ChannelType.GuildForum && !botPermissions?.has(PermissionFlagsBits.CreatePublicThreads)) {
    await interaction.editReply(`I don't have permission to create threads/posts in <#${targetChannelId}>.`);
    return;
  }

  try {
    await sendProblemToChannel(
      interaction.client,
      {
        channelId: targetChannelId,
        useThreads: true,
        threadName: `${problem.questionFrontendId}. ${problem.title} - Discussion`,
        blame: interaction.user,
        useCompact,
      },
      problem
    );

    await interaction.editReply(`Successfully posted problem "${problem.title}" to <#${targetChannelId}>`);
  } catch (error) {
    console.error("Error posting problem:", error);
    await interaction.editReply(
      "An error occurred while posting the problem. Please check my permissions and try again."
    );
  }
}

export async function executeSend(interaction: ChatInputCommandInteraction) {
  const problemQuery = interaction.options.getString("query", true);
  const useCompact = interaction.options.getBoolean("compact", false) ?? false;

  await interaction.deferReply();

  const problem = await getProblemByQuery(problemQuery);
  if (!problem) {
    await interaction.editReply(`Could not find problem with query "${problemQuery}". Please try again.`);
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

  const components = ProblemContainer(problem, useCompact, false);
  await interaction.editReply({
    content: null,
    components,
    flags: MessageFlags.IsComponentsV2,
  });
}
