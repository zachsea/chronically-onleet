import {
  ChatInputCommandInteraction,
  InteractionContextType,
  SlashCommandBuilder,
  MessageFlags,
  ComponentType,
  Interaction,
  PermissionsBitField,
} from "discord.js";
import GuildService from "../../services/guild-service.js";
import { ServerSettings } from "../../components/settings/server-settings.js";
import { UserSettings } from "../../components/settings/user-settings.js";

const guildService = new GuildService();

export const data = new SlashCommandBuilder()
  .setName("settings")
  .setDescription("View or change bot behavior settings")
  .setContexts([InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel])
  .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild);

export async function execute(interaction: ChatInputCommandInteraction) {
  let response;
  if (interaction.context !== InteractionContextType.Guild || !interaction.guildId) {
    response = await interaction.reply({
      components: UserSettings(),
      flags: MessageFlags.IsComponentsV2,
      withResponse: true,
    });
  } else {
    const settings = await guildService.getGuildSettings(interaction.guildId);

    response = await interaction.reply({
      components: ServerSettings({ settings }),
      flags: MessageFlags.IsComponentsV2,
      withResponse: true,
    });
  }

  // page changing logic

  const interactionFilter = (i: Interaction) => i.user.id === interaction.user.id;

  const buttonCollector = response.resource?.message?.createMessageComponentCollector({
    filter: interactionFilter,
    componentType: ComponentType.Button,
    time: 3600000, // 1 hour
  });

  const channelCollector = response.resource?.message?.createMessageComponentCollector({
    filter: interactionFilter,
    componentType: ComponentType.ChannelSelect,
    time: 3600000, // 1 hour
  });

  const paintServerSettings = async (i: Interaction) => {
    if (!i.guildId) return;
    const settings = await guildService.getGuildSettings(i.guildId);
    await interaction.editReply({
      components: ServerSettings({ settings }),
      flags: MessageFlags.IsComponentsV2,
    });
  };

  buttonCollector?.on("collect", async (i) => {
    // acknowledge
    await i.deferUpdate();
    // check if same user, we already made sure they had certain permissions by here
    const selection = i.customId;
    // change page on original response, separate guild/non-guild responses
    if (interaction.context === InteractionContextType.Guild && i.guildId) {
      if (selection == "settings::server-config") {
        await paintServerSettings(i);
      } else if (selection == "settings::guild-daily-toggle-active-enable") {
        await guildService.setDailyEnabled(i.guildId, true);
        await paintServerSettings(i);
      } else if (selection == "settings::guild-daily-toggle-active-disable") {
        await guildService.setDailyEnabled(i.guildId, false);
        await paintServerSettings(i);
      } else if (selection == "settings::guild-daily-toggle-threads-enable") {
        await guildService.setDailyThreadsEnabled(i.guildId, true);
        await paintServerSettings(i);
      } else if (selection == "settings::guild-daily-toggle-threads-disable") {
        await guildService.setDailyThreadsEnabled(i.guildId, false);
        await paintServerSettings(i);
      } else if (selection == "settings::guild-daily-toggle-compact-enable") {
        await guildService.setDailyCompactEnabled(i.guildId, true);
        await paintServerSettings(i);
      } else if (selection == "settings::guild-daily-toggle-compact-disable") {
        await guildService.setDailyCompactEnabled(i.guildId, false);
        await paintServerSettings(i);
      } else if (selection == "settings::user-config") {
        await interaction.editReply({
          components: UserSettings(),
          flags: MessageFlags.IsComponentsV2,
        });
      }
    } else {
      if (selection == "settings::user-config") {
        await interaction.editReply({
          components: UserSettings(),
          flags: MessageFlags.IsComponentsV2,
        });
      }
    }
  });

  channelCollector?.on("collect", async (i) => {
    await i.deferUpdate();
    const selection = i.values[0];

    if (interaction.context === InteractionContextType.Guild && i.guildId) {
      if (selection) {
        // add more validation logic here
        await guildService.setDailyChannelId(i.guildId, selection);
        await paintServerSettings(i);
      }
    }
  });
}
