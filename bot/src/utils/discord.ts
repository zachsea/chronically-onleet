import { ChannelType, ForumChannel, Interaction } from "discord.js";

export const easyTag = { name: "Easy", emoji: { id: null, name: "🟢" } };
export const mediumTag = { name: "Medium", emoji: { id: null, name: "🟡" } };
export const hardTag = { name: "Hard", emoji: { id: null, name: "🔴" } };
export const dailyTag = { name: "Daily", emoji: { id: null, name: "📅" } };

export function isOnlyUserInstalled(interaction: Interaction) {
  return interaction.authorizingIntegrationOwners[1] && !interaction.authorizingIntegrationOwners[0];
}

export async function createMissingForumTags(channel: ForumChannel) {
  if (channel.type !== ChannelType.GuildForum) return;

  const desiredTags = [easyTag, mediumTag, hardTag, dailyTag];
  const existingTags = channel.availableTags;

  // check case-insensitively to avoid duplicates
  const existingTagNames = new Set(existingTags.map((tag) => tag.name.toLowerCase()));

  const tagsToAdd = desiredTags.filter((desiredTag) => !existingTagNames.has(desiredTag.name.toLowerCase()));

  if (tagsToAdd.length === 0) return;

  await channel.setAvailableTags([...existingTags, ...tagsToAdd]);
}

export function getDifficultyForumTag(name: string) {
  return {
    easy: easyTag,
    medium: mediumTag,
    hard: hardTag,
  }[name.toLowerCase()];
}
