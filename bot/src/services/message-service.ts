import { ChannelType, MessageFlags, ShardingManager, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import mongoose from "mongoose";
import Delivery, { DeliveryDocument } from "../models/delivery.js";
import Guild, { GuildDocument } from "../models/guild.js";
import User, { UserDocument } from "../models/user.js";
import { getDailyProblem } from "./leetcode-service.js";
import { Problem } from "leetcode-query";
import ProblemContainer from "../components/leetcode/problem-container.js";
import { SendProblemOptions } from "./problem-sender.js";
import GuildService from "./guild-service.js";
import ReminderService from "./reminder-service.js";

interface MessageServiceOptions {
  pollIntervalMs?: number;
}

class MessageService {
  manager: ShardingManager;
  options: MessageServiceOptions;
  guildService: GuildService;
  reminderService: ReminderService;

  constructor(manager: ShardingManager, options: MessageServiceOptions = {}) {
    this.manager = manager;
    this.options = options;
    this.guildService = new GuildService();
    this.reminderService = new ReminderService();
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

      // we need to chill so discord doesn't get mad
      await new Promise((resolve) => setTimeout(resolve, 250));
    });

    await this.processReminders();
  }

  private async sendDelivery(delivery: DeliveryDocument, daily: Problem) {
    if (delivery.targetType == "guild") {
      const guild = await Guild.findOne({ guildId: delivery.targetId });
      if (!guild) throw Error(`Guild ${delivery.targetId} not found`);
      await this.sendToGuild(guild, daily);
    } else if (delivery.targetType == "user") {
      const user = await User.findOne({ userId: delivery.targetId });
      if (!user) throw Error(`User ${delivery.targetId} not found`);
      await this.sendToUser(user, daily);
    }
  }

  async sendToGuild(guild: GuildDocument, problem: Problem) {
    if (!guild.daily.channelId) {
      throw new Error("Somehow, daily was scheduled without a channel id to send to");
    }
    const options: SendProblemOptions = {
      channelId: guild.daily.channelId,
      useThreads: guild.daily.useThreads,
      useCompact: guild.daily.useCompact,
      roleId: guild.daily.roleId,
      isDaily: true,
    };

    // get the absolute path to the module
    const { fileURLToPath } = await import("url");
    const path = await import("path");
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const problemSenderPath = path.join(__dirname, "./problem-sender.js");

    type BroadcastResult =
      | { success: true; shardId: number | null; roleNotFound?: boolean }
      | { success: false; error: string; shardId: number | null };

    const result = (await this.manager.broadcastEval(
      async (bot, context) => {
        try {
          /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */
          const { sendProblemToChannel } = await import(context.problemSenderPath);
          await sendProblemToChannel(bot, context.options, context.problem);

          // verify role still exists if roleId was provided
          let roleNotFound = false;
          if (context.options.roleId) {
            try {
              const channel = await bot.channels.fetch(context.options.channelId);
              // Only check roles for guild channels (not DMs)
              if (channel && "guild" in channel && channel.guild) {
                await channel.guild.roles.fetch(context.options.roleId);
              }
            } catch {
              roleNotFound = true;
            }
          }

          return { success: true, shardId: bot.shard?.ids?.[0] ?? null, roleNotFound };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return { success: false, error: errorMessage, shardId: bot.shard?.ids?.[0] ?? null };
        }
      },
      {
        context: { problem, options, problemSenderPath },
      }
    )) as BroadcastResult[];

    const successfulShard = result.find((r): r is Extract<BroadcastResult, { success: true }> => r?.success === true);

    if (successfulShard) {
      console.info(`Message sent via shard ${successfulShard.shardId}`);

      // check if role was not found and clear it if it was
      if (successfulShard.roleNotFound && options.roleId) {
        console.warn(`Role ${options.roleId} no longer exists for guild ${guild.guildId}, clearing roleId`);
        try {
          await this.guildService.clearDailyRolePingId(guild.guildId);
        } catch (clearErr) {
          console.error(`Failed to clear roleId for guild ${guild.guildId}:`, clearErr);
        }
      }
    } else {
      const errors = result.filter((r) => r?.success === false);

      // check for channel not found errors and clear invalid channel ID if it was
      let channelNotFound = false;

      errors.forEach((err) => {
        console.error(`Shard ${err.shardId} error: ${err.error}`);
        if (err.error?.startsWith("CHANNEL_NOT_FOUND:")) {
          channelNotFound = true;
        }
      });

      // clear invalid channel ID
      if (channelNotFound) {
        console.warn(`Channel ${options.channelId} no longer exists for guild ${guild.guildId}, clearing channelId`);
        try {
          await this.guildService.clearDailyChannelId(guild.guildId);
        } catch (clearErr) {
          console.error(`Failed to clear channelId for guild ${guild.guildId}:`, clearErr);
        }
        console.error(`Channel ${options.channelId} not found in any shard`);
        throw Error("No shard sent a successful message for the delivery");
      }

      console.error(`Failed to send message to guild ${guild.guildId}`);
      throw Error("No shard sent a successful message for the delivery");
    }
  }

  async sendToUser(user: UserDocument, problem: Problem) {
    if (!user.userId) {
      throw new Error("Somehow, daily was scheduled without a user id to send to");
    }
    const userId = user.userId;

    const messageContent = {
      components: ProblemContainer(problem, user.daily.useCompact, true),
      flags: MessageFlags.IsComponentsV2,
    } as const;

    const result = await this.manager.broadcastEval(
      async (bot, context) => {
        const user = await bot.users.fetch(context.userId);
        if (user) {
          await user.send(context.messageContent);
          return { success: true, shardId: bot.shard?.ids?.[0] ?? null };
        }

        return null;
      },
      { context: { userId, ChannelType, messageContent } }
    );

    const successfulShard = result.find((r) => r !== null);

    if (successfulShard) {
      console.info(`Message sent via shard ${successfulShard.shardId}`);
    } else {
      console.error(`User ${userId} not found in any shard`);
      throw Error("No shard sent a successful message for the delivery");
    }
  }

  private async processReminders() {
    try {
      const reminders = await this.reminderService.getPendingReminders();
      const dailyProblem = await getDailyProblem();
      const problemUrl = dailyProblem
        ? `https://leetcode.com/problems/${dailyProblem.titleSlug}/`
        : "https://leetcode.com/problems/";
      const maxAttempts = 3;

      for (const reminder of reminders) {
        try {
          reminder.attemptCount += 1;
          await reminder.save();

          await this.sendReminderToUser(reminder.userId, problemUrl);
          await this.reminderService.cancelReminder(reminder.userId);
          console.debug(`Reminder sent to ${reminder.userId} and deleted`);
          // chill
          await new Promise((resolve) => setTimeout(resolve, 250));
        } catch (err) {
          if (reminder.attemptCount >= maxAttempts) {
            console.error(`Reminder for ${reminder.userId} failed after ${maxAttempts} attempts, giving up:`, err);
            await this.reminderService.cancelReminder(reminder.userId);
          } else {
            console.error(
              `Failed to send reminder to ${reminder.userId} (attempt ${reminder.attemptCount}/${maxAttempts}):`,
              err
            );
          }
        }
      }
    } catch (err) {
      console.error("Error processing reminders:", err);
    }
  }

  private async sendReminderToUser(userId: string, problemUrl: string) {
    const result = await this.manager.broadcastEval<
      { success: true; shardId: number | null } | null,
      { userId: string; problemUrl: string }
    >(
      async (bot, context) => {
        const user = await bot.users.fetch(context.userId);
        if (user) {
          const button = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setLabel("Open Daily Problem").setStyle(ButtonStyle.Link).setURL(context.problemUrl)
          );
          await user.send({
            content: "Your reminder for today's daily problem.",
            components: [button],
          });
          return { success: true, shardId: bot.shard?.ids?.[0] ?? null };
        }

        return null;
      },
      { context: { userId, problemUrl } }
    );

    const successfulShard = result.find((r) => r !== null);

    if (!successfulShard) {
      throw Error(`User ${userId} not found in any shard`);
    }
  }
}

export default MessageService;
