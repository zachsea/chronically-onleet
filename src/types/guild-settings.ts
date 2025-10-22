import GuildService from "../services/guild-service.js";

export type GuildSettings = Awaited<ReturnType<typeof GuildService.prototype.getGuildSettings>>;
