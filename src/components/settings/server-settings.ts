import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ContainerBuilder,
  MessageActionRowComponentBuilder,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder,
} from "discord.js";
import { GuildSettings } from "../../types/guild-settings.js";
import ToggleButton from "../toggle-button.js";
import SettingsLayout from "./settings-layout.js";

interface ServerSettingsProps {
  settings: GuildSettings;
}

export function ServerSettings({ settings }: ServerSettingsProps) {
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
            customIdEnable: "settings::daily-toggle-compact-enable",
            customIdDisable: "settings::daily-toggle-compact-disable",
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

  const buttons = [
    new ButtonBuilder().setLabel("User Settings").setCustomId("settings::user-config"),
    new ButtonBuilder().setLabel("Server Settings").setCustomId("settings::server-config"),
  ];

  const components = SettingsLayout({
    title: "Server Settings",
    buttons,
    currentPageButton: "settings::server-config",
    rows: dailySettings,
  });

  return components;
}
