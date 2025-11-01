import Guild from "../models/guild.js";
import Delivery from "../models/delivery.js";

class GuildService {
  async createGuild(guildId: string) {
    // init with sensible defaults
    const newGuild = new Guild({ guildId });
    try {
      await newGuild.save();
    } catch (err) {
      console.error(`Failed to save new guild with id ${guildId}:`, err);
    }
    return newGuild;
  }

  async getGuild(guildId: string) {
    const existingGuild = await Guild.findOne({ guildId });
    if (existingGuild) return existingGuild;
    return await this.createGuild(guildId);
  }

  async getDailyEnabled(guildId: string) {
    const guild = await this.getGuild(guildId);
    if (!guild) throw Error("Guild not found");
    return guild.daily.config.enabled;
  }

  async setDailyEnabled(guildId: string, enabled: boolean) {
    const guild = await this.getGuild(guildId);
    if (!guild) throw Error("Guild not found");
    guild.daily.config.enabled = enabled;
    try {
      await guild.save();
    } catch (err) {
      console.error(`Failed to save daily.enabled for guild ${guildId}:`, err);
      throw err;
    }
  }

  async getDailyOffsetMinutes(guildId: string) {
    const guild = await this.getGuild(guildId);
    if (!guild) throw Error("Guild not found");
    return guild.daily.config.offsetMinutes;
  }

  async setDailyOffsetMinutes(guildId: string, minutes: number) {
    const guild = await this.getGuild(guildId);
    if (!guild) throw Error("Guild not found");
    guild.daily.config.offsetMinutes = minutes;
    try {
      await guild.save();
    } catch (err) {
      console.error(`Failed to save daily.offsetMinutes for guild ${guildId}:`, err);
      throw err;
    }

    // align today's pending delivery if moving to a later time and it hasn't sent yet
    try {
      if (!guild.daily.config.enabled) return;
      if (!guild.daily.channelId) return;

      const now = new Date();
      const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60000);
      const scheduledAt = new Date(dayStart.getTime() + minutes * 60000);

      const existing = await Delivery.findOne({
        targetId: guildId,
        targetType: "guild",
        scheduledDate: { $gte: dayStart, $lt: dayEnd },
      });

      if (!existing) {
        // no delivery yet today, create one for today at new time
        const when = scheduledAt <= now ? now : scheduledAt;
        await Delivery.create({ targetId: guildId, targetType: "guild", scheduledDate: when, status: "pending" });
        return;
      }

      if (existing.status === "pending") {
        if (existing.scheduledDate < scheduledAt && now < scheduledAt) {
          // moved later, push forward
          existing.scheduledDate = scheduledAt;
          await existing.save();
        } else if (scheduledAt <= now && existing.scheduledDate > now) {
          // moved earlier, pull to now for immediate send
          existing.scheduledDate = now;
          await existing.save();
        }
      }
    } catch (err) {
      console.error(`Failed aligning today's delivery after guild offset change (${guildId}):`, err);
    }
  }

  async getDailyThreadsEnabled(guildId: string) {
    const guild = await this.getGuild(guildId);
    if (!guild) throw Error("Guild not found");
    return guild.daily.useThreads;
  }

  async setDailyThreadsEnabled(guildId: string, enabled: boolean) {
    const guild = await this.getGuild(guildId);
    if (!guild) throw Error("Guild not found");
    guild.daily.useThreads = enabled;
    try {
      await guild.save();
    } catch (err) {
      console.error(`Failed to save daily.useThreads for guild ${guildId}:`, err);
      throw err;
    }
  }

  async getDailyChannelId(guildId: string) {
    const guild = await this.getGuild(guildId);
    if (!guild) throw Error("Guild not found");
    return guild.daily.channelId;
  }

  async setDailyChannelId(guildId: string, channelId: string) {
    const guild = await this.getGuild(guildId);
    if (!guild) throw Error("Guild not found");
    guild.daily.channelId = channelId;
    try {
      await guild.save();
    } catch (err) {
      console.error(`Failed to save daily.channelId for guild ${guildId}:`, err);
      throw err;
    }
  }

  async getDailyRolePingEnabled(guildId: string) {
    const guild = await this.getGuild(guildId);
    if (!guild) throw Error("Guild not found");
    return guild.daily.useRolePing;
  }

  async setDailyRolePingEnabled(guildId: string, enabled: boolean) {
    const guild = await this.getGuild(guildId);
    if (!guild) throw Error("Guild not found");
    guild.daily.useRolePing = enabled;
    try {
      await guild.save();
    } catch (err) {
      console.error(`Failed to save daily.useRolePing for guild ${guildId}:`, err);
      throw err;
    }
  }

  async getDailyRolePingId(guildId: string) {
    const guild = await this.getGuild(guildId);
    if (!guild) throw Error("Guild not found");
    return guild.daily.roleId;
  }

  async setDailyRolePingId(guildId: string, roleId: string) {
    const guild = await this.getGuild(guildId);
    if (!guild) throw Error("Guild not found");
    guild.daily.roleId = roleId;
    try {
      await guild.save();
    } catch (err) {
      console.error(`Failed to save daily.roleId for guild ${guildId}:`, err);
      throw err;
    }
  }

  async getDailyCompactEnabled(guildId: string) {
    const guild = await this.getGuild(guildId);
    if (!guild) throw Error("Guild not found");
    return guild.daily.useCompact;
  }

  async setDailyCompactEnabled(guildId: string, enabled: boolean) {
    const guild = await this.getGuild(guildId);
    if (!guild) throw Error("Guild not found");
    guild.daily.useCompact = enabled;
    try {
      await guild.save();
    } catch (err) {
      console.error(`Failed to save daily.useCompact for guild ${guildId}:`, err);
      throw err;
    }
  }

  // return all setting objects as one
  async getGuildSettings(guildId: string) {
    const guild = await this.getGuild(guildId);
    if (!guild) throw Error("Guild not found");
    return {
      daily: {
        channelId: guild.daily.channelId,
        useThreads: guild.daily.useThreads,
        config: guild.daily.config,
        useCompact: guild.daily.useCompact,
        useRolePing: guild.daily.useRolePing,
        roleId: guild.daily.roleId,
      },
    };
  }
}

export default GuildService;
