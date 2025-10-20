import { Events, Guild } from "discord.js";
import GuildService from "../services/guild-service.js";

export const name: Events = Events.GuildCreate;
export const once = true;
export async function execute(guild: Guild) {
  const guildService = new GuildService();
  try {
    await guildService.createGuild(guild.id);
    console.debug(`Created guild ${guild.id}`);
  } catch (error) {
    console.error(error);
  }
}
