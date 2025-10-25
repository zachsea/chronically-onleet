import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelSelectMenuInteraction,
  ChannelType,
  ContainerBuilder,
  InteractionContextType,
  MessageActionRowComponentBuilder,
  MessageFlags,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder,
} from "discord.js";
import { GuildSettings } from "../../types/guild-settings.js";
import ToggleButton from "../toggle-button.js";
import SettingsLayout from "./settings-layout.js";
import GuildService from "../../services/guild-service.js";

interface DailyServerSettingsProps {
  settings: GuildSettings;
}

export function DailyServerSettings({ settings }: DailyServerSettingsProps) {
  const dailySettings: ContainerBuilder[] = [
    new ContainerBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent("### Daily Messages"))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true))
      .addSectionComponents(
        new SectionBuilder()
          .setButtonAccessory(
            ToggleButton({
              isEnabled: settings.daily.config.enabled,
              customIdEnable: "settings::guild-daily-toggle-active-enable",
              customIdDisable: "settings::guild-daily-toggle-active-disable",
            })
          )
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent("**Post daily challenges**"),
            new TextDisplayBuilder().setContent("Send a message for each daily leetcode challenge")
          )
      ),
  ];

  if (settings.daily.config.enabled) {
    dailySettings[0].addActionRowComponents(
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        new ChannelSelectMenuBuilder()
          .setPlaceholder("Daily channel or forum...")
          .setCustomId("settings::guild-daily-select-channel")
          .addChannelTypes([ChannelType.GuildText, ChannelType.GuildForum])
          .setDefaultChannels([settings.daily.channelId])
      )
    );
  }
  if (settings.daily.config.enabled && !settings.daily.channelId) {
    dailySettings[0].addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`\\*A channel must be selected before dailies will be sent!`)
    );
  }

  dailySettings[0]
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true))
    .addSectionComponents(
      new SectionBuilder()
        .setButtonAccessory(
          ToggleButton({
            isEnabled: settings.daily.useThreads,
            customIdEnable: "settings::guild-daily-toggle-threads-enable",
            customIdDisable: "settings::guild-daily-toggle-threads-disable",
          })
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent("**Use threads**"),
          new TextDisplayBuilder().setContent(
            "To use a forum, select it from the above dropdown.\nThis option is ignored for forums"
          )
        )
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true))
    .addSectionComponents(
      new SectionBuilder()
        .setButtonAccessory(
          ToggleButton({
            isEnabled: settings.daily.useCompact,
            customIdEnable: "settings::guild-daily-toggle-compact-enable",
            customIdDisable: "settings::guild-daily-toggle-compact-disable",
          })
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent("**Post compact message**"),
          new TextDisplayBuilder().setContent("Significantly cuts down the description size of the daily problem post")
        )
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true))
    .addSectionComponents(
      new SectionBuilder()
        .setButtonAccessory(
          new ButtonBuilder()
            .setStyle(ButtonStyle.Secondary)
            .setLabel("Launch")
            .setCustomId("settings::guild-daily-offset-modal")
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent("**Configure Offset**"),
          new TextDisplayBuilder().setContent(
            "Opens modal for configuring the daily post time offset.\nCurrently set to `+1:00` from release"
          )
        )
    );

  const components = SettingsLayout({
    rows: dailySettings,
  });

  return components;
}

async function paintServerSettings(
  interaction: ChannelSelectMenuInteraction | ButtonInteraction,
  guildService: GuildService
) {
  if (!interaction.guildId) return;
  const settings = await guildService.getGuildSettings(interaction.guildId);
  await interaction.editReply({
    components: DailyServerSettings({ settings }),
    flags: MessageFlags.IsComponentsV2,
  });
}

export async function DailyServerSettingsButtonHandling(interaction: ButtonInteraction, guildService: GuildService) {
  if (!interaction.inGuild()) throw Error("Guild button handler called on non-guild interaction");
  await interaction.deferUpdate();
  const selection = interaction.customId;
  if (selection == "settings::guild-daily-toggle-active-enable") {
    await guildService.setDailyEnabled(interaction.guildId, true);
  } else if (selection == "settings::guild-daily-toggle-active-disable") {
    await guildService.setDailyEnabled(interaction.guildId, false);
  } else if (selection == "settings::guild-daily-toggle-threads-enable") {
    await guildService.setDailyThreadsEnabled(interaction.guildId, true);
  } else if (selection == "settings::guild-daily-toggle-threads-disable") {
    await guildService.setDailyThreadsEnabled(interaction.guildId, false);
  } else if (selection == "settings::guild-daily-toggle-compact-enable") {
    await guildService.setDailyCompactEnabled(interaction.guildId, true);
  } else if (selection == "settings::guild-daily-toggle-compact-disable") {
    await guildService.setDailyCompactEnabled(interaction.guildId, false);
  }
  // refresh
  await paintServerSettings(interaction, guildService);
}

export async function DailyServerSettingsChannelHandling(
  interaction: ChannelSelectMenuInteraction,
  guildService: GuildService
) {
  await interaction.deferUpdate();
  const selection = interaction.values[0];

  if (interaction.context === InteractionContextType.Guild && interaction.guildId) {
    if (selection) {
      // add more validation logic here
      await guildService.setDailyChannelId(interaction.guildId, selection);
      await paintServerSettings(interaction, guildService);
    }
  }
}
