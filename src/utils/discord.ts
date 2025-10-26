import { Interaction } from "discord.js";

export function isOnlyUserInstalled(interaction: Interaction) {
  return interaction.authorizingIntegrationOwners[1] && !interaction.authorizingIntegrationOwners[0];
}
