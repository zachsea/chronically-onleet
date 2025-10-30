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
}

export async function sendProblemToChannel(client: Client, options: SendProblemOptions, problem: Problem) {
  const { channelId, useThreads = false, threadName, blame, useCompact = false } = options;

  const defaultThreadName = `Daily LeetCode Problem ${new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })}`;

  const channel = client.channels.cache.get(channelId);

  if (!channel) {
    throw new Error(`Channel ${channelId} not found`);
  }

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
    }
    const dateString = new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
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
  const messageContent = {
    components: ProblemContainer(problem, useCompact),
    flags: MessageFlags.IsComponentsV2,
  } as const;

  const message = await (channel as TextChannel).send(messageContent);

  if (useThreads) {
    const thread = await message.startThread({
      name: threadName || defaultThreadName,
    });
    await thread.send(
      `Use this thread to discuss the problem and share your solutions. Created by ${blame?.toString() ?? "daily scheduler."}`
    );
  }
}
