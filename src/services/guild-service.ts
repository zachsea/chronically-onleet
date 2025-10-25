import Guild from "../models/guild.js";

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
      },
    };
  }
}

export default GuildService;
