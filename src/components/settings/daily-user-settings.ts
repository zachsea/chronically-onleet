import {
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder,
} from "discord.js";
import SettingsLayout from "./settings-layout.js";
import ToggleButton from "../toggle-button.js";
import { UserSettings } from "../../types/user-settings.js";

interface DailyUserSettingsProps {
  settings: UserSettings;
}

export function DailyUserSettings({ settings }: DailyUserSettingsProps) {
  const dailySettings: ContainerBuilder[] = [
    new ContainerBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent("### Messages"))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true))
      .addSectionComponents(
        new SectionBuilder()
          .setButtonAccessory(
            ToggleButton({
              isEnabled: settings.daily.config.enabled,
              customIdEnable: "settings::user-toggle-compact-enable",
              customIdDisable: "settings::user-toggle-compact-disable",
            })
          )
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent("**Post compact problems**"),
            new TextDisplayBuilder().setContent("Default to using compact when posting problems")
          )
      )
      .addTextDisplayComponents(new TextDisplayBuilder().setContent("### Daily Messages"))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true))
      .addSectionComponents(
        new SectionBuilder()
          .setButtonAccessory(
            ToggleButton({
              isEnabled: settings.daily.config.enabled,
              customIdEnable: "settings::user-daily-toggle-active-enable",
              customIdDisable: "settings::user-daily-toggle-active-disable",
            })
          )
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent("**Post daily challenges**"),
            new TextDisplayBuilder().setContent("Send a message for each daily leetcode challenge")
          )
      ),
  ];

  dailySettings[0]
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true))
    .addSectionComponents(
      new SectionBuilder()
        .setButtonAccessory(
          ToggleButton({
            isEnabled: settings.daily.useCompact,
            customIdEnable: "settings::user-daily-toggle-compact-enable",
            customIdDisable: "settings::user-daily-toggle-compact-disable",
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
            .setCustomId("settings::user-daily-offset-modal")
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
