import {
  ChannelType,
  MessageFlags,
  TextChannel,
  Client,
  User,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  GuildForumThreadCreateOptions,
  PermissionFlagsBits,
} from "discord.js";
import { Problem } from "leetcode-query";
import ProblemForumPost from "../components/leetcode/problem-forum-post.js";
import ProblemContainer from "../components/leetcode/problem-container.js";
import { createMissingForumTags, dailyTag, getDifficultyForumTag } from "../utils/discord.js";

export interface SendProblemOptions {
  channelId: string;
  useThreads?: boolean;
  threadName?: string;
  blame?: User;
  useCompact?: boolean;
  roleId?: string;
  isDaily?: boolean;
}

export async function sendProblemToChannel(client: Client, options: SendProblemOptions, problem: Problem) {
  const { channelId, useThreads = false, threadName, blame, useCompact = false, roleId, isDaily = false } = options;

  const dateString = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  const defaultThreadName = `Daily LeetCode Problem ${dateString}`;

  let channel;
  try {
    channel = await client.channels.fetch(channelId);
  } catch {
    throw new Error(`CHANNEL_NOT_FOUND:${channelId}`);
  }

  if (!channel) {
    throw new Error(`CHANNEL_NOT_FOUND:${channelId}`);
  }

  let role = null;
  if (roleId && channel.type !== ChannelType.DM) {
    try {
      role = await (channel as TextChannel).guild.roles.fetch(roleId);
    } catch {
      console.warn(`Role ${roleId} not found for channel ${channelId}, continuing without role ping`);
      role = null;
    }
  }

  // create forum post if selected context is a forum
  if (channel.type === ChannelType.GuildForum) {
    // try to create tags if they don't already exist
    let tagCreationError = false;
    const botMember = await channel.guild.members.fetchMe();

    if (botMember.permissionsIn(channel).has(PermissionFlagsBits.ManageChannels)) {
      try {
        await createMissingForumTags(channel);
      } catch (error) {
        console.error("Failed to create missing forum tags:", error);
        tagCreationError = true;
      }
    } else {
      tagCreationError = true;
    }

    let components = ProblemForumPost(problem, useCompact);

    // add a "blame" field if available
    if (blame) {
      const blameField = new TextDisplayBuilder({ content: `Posted by ${blame.toString()}` });
      components = [
        blameField,
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true),
        ...components,
      ];
    } else if (isDaily && role) {
      const pingField = new TextDisplayBuilder({ content: `${role.toString()}` });
      components = [
        pingField,
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true),
        ...components,
      ];
    }
    const titleSuffix = options.blame ? "" : ` - ${dateString}`;
    const appliedTags: string[] = [];

    if (isDaily) {
      const dailyTagId = channel.availableTags.find((tag) => tag.name === dailyTag.name)?.id;
      if (dailyTagId) appliedTags.push(dailyTagId);
    }

    if (problem.difficulty) {
      const difficultyTag = getDifficultyForumTag(problem.difficulty);
      const difficultyTagId = channel.availableTags.find((tag) => tag.name === difficultyTag?.name)?.id;
      if (difficultyTagId) appliedTags.push(difficultyTagId);
    }

    // add error message if tags couldn't be created
    if (tagCreationError) {
      const errorField = new TextDisplayBuilder({
        content: `**Missing permissions to create tags**\nI tried to create some tags to use with this forum post, but I don't have permissions to manage this channel.`,
      });
      components = [
        ...components,
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true),
        errorField,
      ];
    }
    const messageContentForum: GuildForumThreadCreateOptions = {
      name: `${problem.questionFrontendId}. ${problem.title}${titleSuffix}`,
      message: {
        components,
        flags: MessageFlags.IsComponentsV2,
      },
      appliedTags,
      reason: `Created by ${blame ? blame.username : "scheduler"}`,
    } as const;

    await channel.threads.create(messageContentForum);
    return;
  }

  // send the raw message in the channel, and follow up with a thread if desired

  if (useThreads) {
    const messageContent = {
      components: ProblemContainer(problem, useCompact),
      flags: MessageFlags.IsComponentsV2,
    } as const;

    const message = await (channel as TextChannel).send(messageContent);
    const thread = await message.startThread({
      name: threadName || defaultThreadName,
    });
    await thread.send(
      `${isDaily && role && role.mentionable ? `${role.toString()}:` : ""} Use this thread to discuss the problem and share your solutions. Created by ${blame?.toString() ?? "daily scheduler."}`
    );
  } else {
    // boring no-thread no-forum message
    const components = [
      new TextDisplayBuilder({ content: `## Daily for ${dateString}` }),
      ...ProblemContainer(problem, useCompact),
    ];

    if (role && role.mentionable) {
      const pingField = new TextDisplayBuilder({ content: `${role.toString()}` });
      components.push(pingField);
    }

    await (channel as TextChannel).send({ components, flags: MessageFlags.IsComponentsV2 });
  }
}
