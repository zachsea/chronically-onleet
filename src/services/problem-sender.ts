import {
  ChannelType,
  MessageFlags,
  TextChannel,
  Client,
  User,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
} from "discord.js";
import { Problem } from "leetcode-query";
import ProblemForumPost from "../components/leetcode/problem-forum-post.js";
import ProblemContainer from "../components/leetcode/problem-container.js";

export interface SendProblemOptions {
  channelId: string;
  useThreads?: boolean;
  threadName?: string;
  blame?: User;
  useCompact?: boolean;
  roleId?: string;
}

export async function sendProblemToChannel(client: Client, options: SendProblemOptions, problem: Problem) {
  const { channelId, useThreads = false, threadName, blame, useCompact = false } = options;

  const dateString = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  const defaultThreadName = `Daily LeetCode Problem ${dateString}`;

  const channel = await client.channels.fetch(channelId);

  if (!channel) {
    throw new Error(`Channel ${channelId} not found`);
  }

  const role = options.roleId ? await (channel as TextChannel).guild.roles.fetch(options.roleId) : null;

  // create forum post if selected context is a forum
  if (channel.type === ChannelType.GuildForum) {
    let components = ProblemForumPost(problem, useCompact);
    // add a "blame" field if available
    if (blame) {
      const blameField = new TextDisplayBuilder({ content: `Posted by ${blame.toString()}` });
      components = [
        blameField,
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true),
        ...components,
      ];
    } else if (role) {
      const pingField = new TextDisplayBuilder({ content: `${role.toString()}` });
      components = [
        pingField,
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true),
        ...components,
      ];
    }
    const titleSuffix = options.blame ? "" : ` - ${dateString}`;
    const messageContentForum = {
      name: `${problem.questionFrontendId}. ${problem.title}${titleSuffix}`,
      message: {
        components,
        flags: MessageFlags.IsComponentsV2,
      },
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
      // don't ping if there's a blame since that's a non-daily
      `${!blame && role && role.mentionable ? `${role.toString()}:` : ""} Use this thread to discuss the problem and share your solutions. Created by ${blame?.toString() ?? "daily scheduler."}`
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
