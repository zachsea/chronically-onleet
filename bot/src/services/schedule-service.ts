import Delivery from "../models/delivery.js";
import Guild, { GuildDocument } from "../models/guild.js";
import User, { UserDocument } from "../models/user.js";

interface ScheduleServiceOptions {
  pollIntervalMs?: number;
  processingStuckMs?: number;
}

class ScheduleService {
  options: ScheduleServiceOptions;
  private isProcessing = false;

  constructor(options: ScheduleServiceOptions = {}) {
    this.options = options;
  }

  async start() {
    const pollInterval = this.options.pollIntervalMs ?? 60000;
    console.log("[ScheduleService] Starting schedule service...");
    // run immediately on startup, then interval
    await this.processSchedules();
    setInterval(() => this.processSchedules().catch(console.error), pollInterval);
  }

  private getUtcDayStart(date: Date): Date {
    const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
    return d;
  }

  private addMinutesUtc(base: Date, minutes: number): Date {
    return new Date(base.getTime() + minutes * 60000);
  }

  private getUtcDayEnd(date: Date): Date {
    const start = this.getUtcDayStart(date);
    return new Date(start.getTime() + 24 * 60 * 60000);
  }

  private async recoverStuckDeliveries() {
    const thresholdMs = this.options.processingStuckMs ?? 10 * 60000;
    const cutoff = new Date(Date.now() - thresholdMs);
    const res = await Delivery.updateMany(
      { status: "processing", updatedAt: { $lt: cutoff } },
      { $set: { status: "pending" } }
    );
    if (res.modifiedCount) {
      console.debug(`[ScheduleService] Recovered ${res.modifiedCount} stuck deliveries (set to pending)`);
    }
  }

  private async ensureTodayDeliveryForGuild(
    guildId: string,
    channelId: string | null,
    offsetMinutes: number,
    enabled: boolean,
    createdAt: Date,
    updatedAt: Date
  ) {
    if (!enabled) return;
    if (!channelId) return;

    const now = new Date();
    const dayStart = this.getUtcDayStart(now);
    const dayEnd = this.getUtcDayEnd(now);
    const scheduledAt = this.addMinutesUtc(dayStart, offsetMinutes);

    // align/inspect existing delivery for this UTC day
    const existing = await Delivery.findOne({
      targetId: guildId,
      targetType: "guild",
      scheduledDate: { $gte: dayStart, $lt: dayEnd },
    });

    if (existing) {
      // if still pending and offset changed to later time, move it forward
      if (existing.status === "pending" && existing.scheduledDate.getTime() !== scheduledAt.getTime()) {
        if (now < scheduledAt && existing.scheduledDate < scheduledAt) {
          existing.scheduledDate = scheduledAt;
          await existing.save();
        }
      }
      return;
    }

    // decide whether to backfill for today if missed
    if (now < scheduledAt) {
      await Delivery.create({
        targetId: guildId,
        targetType: "guild",
        scheduledDate: scheduledAt,
        status: "pending",
      });
      return;
    }

    // missed schedule time already, only backfill if this configuration existed before today.
    const configExistedBeforeToday = createdAt < dayStart || updatedAt < dayStart;
    if (configExistedBeforeToday) {
      await Delivery.create({
        targetId: guildId,
        targetType: "guild",
        scheduledDate: now,
        status: "pending",
      });
    }
  }

  private async ensureTodayDeliveryForUser(
    userId: string,
    offsetMinutes: number,
    enabled: boolean,
    createdAt: Date,
    updatedAt: Date
  ) {
    if (!enabled) return;

    const now = new Date();
    const dayStart = this.getUtcDayStart(now);
    const dayEnd = this.getUtcDayEnd(now);
    const scheduledAt = this.addMinutesUtc(dayStart, offsetMinutes);

    const existing = await Delivery.findOne({
      targetId: userId,
      targetType: "user",
      scheduledDate: { $gte: dayStart, $lt: dayEnd },
    });

    if (existing) {
      if (existing.status === "pending" && existing.scheduledDate.getTime() !== scheduledAt.getTime()) {
        if (now < scheduledAt && existing.scheduledDate < scheduledAt) {
          existing.scheduledDate = scheduledAt;
          await existing.save();
        }
      }
      return;
    }

    if (now < scheduledAt) {
      await Delivery.create({
        targetId: userId,
        targetType: "user",
        scheduledDate: scheduledAt,
        status: "pending",
      });
      return;
    }

    const configExistedBeforeToday = createdAt < dayStart || updatedAt < dayStart;
    if (configExistedBeforeToday) {
      await Delivery.create({
        targetId: userId,
        targetType: "user",
        scheduledDate: now,
        status: "pending",
      });
    }
  }

  private async processSchedules() {
    if (this.isProcessing) return;
    this.isProcessing = true;
    try {
      await this.recoverStuckDeliveries();

      const guilds: GuildDocument[] = await Guild.find({ "daily.config.enabled": true });
      const users: UserDocument[] = await User.find({ "daily.config.enabled": true });

      await Promise.all(
        guilds.map((g) =>
          this.ensureTodayDeliveryForGuild(
            g.guildId,
            g.daily.channelId ?? null,
            g.daily.config.offsetMinutes ?? 0,
            true,
            g.createdAt as Date,
            g.updatedAt as Date
          )
        )
      );

      await Promise.all(
        users.map((u) =>
          this.ensureTodayDeliveryForUser(
            u.userId,
            u.daily.config.offsetMinutes ?? 0,
            true,
            u.createdAt as Date,
            u.updatedAt as Date
          )
        )
      );
    } catch (err) {
      console.error("[ScheduleService] Error while processing schedules:", err);
    } finally {
      this.isProcessing = false;
    }
  }
}

export default ScheduleService;
