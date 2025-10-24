import { ChannelType, MessageFlags, ShardingManager, TextChannel } from "discord.js";
import mongoose from "mongoose";
import Delivery, { DeliveryDocument } from "../models/delivery.js";
import Guild, { GuildDocument } from "../models/guild.js";
import User, { UserDocument } from "../models/user.js";
import Group, { GroupDocument } from "../models/group.js";
import { getDailyProblem } from "./leetcode-service.js";
import DailyForumPost from "../components/leetcode/daily-forum-post.js";
import { Problem } from "leetcode-query";
import ProblemContainer from "../components/leetcode/problem-container.js";

interface MessageServiceOptions {
  pollIntervalMs?: number;
}

class MessageService {
  manager: ShardingManager;
  options: MessageServiceOptions;

  constructor(manager: ShardingManager, options: MessageServiceOptions = {}) {
    this.manager = manager;
    this.options = options;
    if (!mongoose.connection.readyState) {
      throw new Error("MongoDB is not connected");
    }
  }

  async start() {
    const pollInterval = this.options.pollIntervalMs ?? 5000;
    console.log("[MessageService] Starting message service...");
    setInterval(() => this.processMessages(), pollInterval);
  }

  private async processMessages() {
    const now = new Date();
    const pending = await Delivery.find({ status: "pending", scheduledDate: { $lte: now } });

    const daily = await getDailyProblem();
    if (!daily) {
      console.debug("Daily not yet updated, postponed processing");
      return; // we don't have the next daily yet, try again on next interval
    }

    pending.forEach(async (delivery) => {
      delivery.status = "processing";
      delivery.attemptCount += 1;
      delivery.messageDate = now;
      await delivery.save();

      try {
        await this.sendDelivery(delivery, daily);
        delivery.status = "sent";
        await delivery.save();
        console.debug(`Delivery sent to ${delivery.targetId}`);
      } catch (err) {
        delivery.status = "failed";
        if (err instanceof Error) {
          delivery.error = err.message;
        } else {
          delivery.error = String(err);
        }
        console.error(err);
        await delivery.save();

        if (delivery.attemptCount < 5) {
          console.debug(`Delivery to ${delivery.targetId} failed, retrying...`);
          delivery.status = "pending";
          await delivery.save();
        } else {
          console.debug(`Delivery to ${delivery.targetId} failed`);
        }
      }
    });
  }

  private async sendDelivery(delivery: DeliveryDocument, daily: Problem) {
    if (delivery.targetType == "guild") {
      const guild = await Guild.findOne({ guildId: delivery.targetId });
      if (!guild) throw Error(`Guild ${delivery.targetId} not found`);

      await this.sendToGuild(guild, daily);
    } else if (delivery.targetType == "user") {
      const user = await User.findOne({ guildId: delivery.targetId });
      if (!user) throw Error(`User ${delivery.targetId} not found`);

      await this.sendToUser(user, daily);
    } else if (delivery.targetType == "group") {
      const group = await Group.findOne({ groupId: delivery.targetId });
      if (!group) throw Error(`User ${delivery.targetId} not found`);

      await this.sendToGroup(group, daily);
    }
  }

  private async sendToGuild(guild: GuildDocument, daily: Problem) {
    if (!guild.daily.channelId) {
      throw new Error("Somehow, daily was scheduled without a channel id to send to");
    }
    const channelId = guild.daily.channelId;
    const useThreads = guild.daily.useThreads ?? false;

    const messageContentForum = {
      name: `${daily.questionFrontendId}. ${daily.title} - ${new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      })}`,
      message: {
        components: DailyForumPost(daily),
        flags: MessageFlags.IsComponentsV2,
      },
      reason: `Daily for ${new Date().toISOString().slice(0, 10)}`,
    } as const;

    const messageContent = {
      components: ProblemContainer(daily),
      flags: MessageFlags.IsComponentsV2,
    } as const;

    const result = await this.manager.broadcastEval(
      async (bot, context) => {
        const channel = bot.channels.cache.get(context.channelId);

        // Create forum post if selected context is a forum
        if (channel && channel.type == context.ChannelType.GuildForum) {
          await channel.threads.create({
            name: context.messageContentForum.name,
            message: context.messageContentForum.message,
            reason: context.messageContentForum.reason,
          });
          return { success: true, shardId: bot.shard?.ids?.[0] ?? null };
        }
        // Send the raw message in the channel, and follow up with a thread if desired
        if (channel) {
          const message = await (channel as TextChannel).send(context.messageContent);
          if (context.useThreads) {
            const thread = await message.startThread({
              name: `Daily LeetCode Problem ${new Date().toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
                timeZone: "UTC",
              })}`,
            });
            await thread.send("Use this thread to discuss the problem and share your solutions.");
          }
          return { success: true, shardId: bot.shard?.ids?.[0] ?? null };
        }

        return null;
      },
      { context: { channelId, useThreads, ChannelType, messageContentForum, messageContent } }
    );

    const successfulShard = result.find((r) => r !== null);

    if (successfulShard) {
      console.info(`Message sent via shard ${successfulShard.shardId}`);
    } else {
      console.error(`Channel ${channelId} not found in any shard`);
      throw Error("No shard sent a successful message for the delivery");
    }
  }

  private async sendToUser(_user: UserDocument, _daily: Problem) {
    throw Error("Not implemented");
  }

  private async sendToGroup(_group: GroupDocument, _daily: Problem) {
    throw Error("Not implemented");
  }
}

export default MessageService;
