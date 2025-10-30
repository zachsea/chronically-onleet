import {
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChannelSelectMenuInteraction,
  ContainerBuilder,
  Interaction,
  InteractionContextType,
  LabelBuilder,
  MessageFlags,
  ModalBuilder,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextDisplayBuilder,
} from "discord.js";
import { UserSettings } from "../../types/user-settings.js";
import ToggleButton from "../toggle-button.js";
import SettingsLayout from "./settings-layout.js";
import UserService from "../../services/user-service.js";
import formatOffset from "../../utils/formatOffset.js";

interface DailyUserSettingsProps {
  settings: UserSettings;
  interaction?: Interaction;
}

export function DailyUserSettings({ settings }: DailyUserSettingsProps) {
  let mainContainer = new ContainerBuilder().addTextDisplayComponents(
    new TextDisplayBuilder().setContent("### Daily Messages")
  );

  const dailyToggleRow = new SectionBuilder()
    .setButtonAccessory(
      ToggleButton({
        isEnabled: settings.daily.config.enabled,
        customIdEnable: "settings:user-daily-toggle-active-enable",
        customIdDisable: "settings:user-daily-toggle-active-disable",
      })
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("**Post daily challenges**"),
      new TextDisplayBuilder().setContent("Send a message for each daily leetcode challenge")
    );

  const dailyCompactRow = new SectionBuilder()
    .setButtonAccessory(
      ToggleButton({
        isEnabled: settings.daily.useCompact,
        customIdEnable: "settings:user-daily-toggle-compact-enable",
        customIdDisable: "settings:user-daily-toggle-compact-disable",
      })
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("**Post compact message**"),
      new TextDisplayBuilder().setContent("Significantly cuts down the description size of the daily problem post")
    );

  const dailyOffsetRow = new SectionBuilder()
    .setButtonAccessory(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Secondary)
        .setLabel("Launch")
        .setCustomId("settings:user-daily-offset-modal")
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("**Configure Offset**"),
      new TextDisplayBuilder().setContent(
        `Opens modal for configuring the daily post time offset.\nCurrently set to \`${formatOffset(settings.daily.config.offsetMinutes)}\` from release`
      )
    );

  // piecing the embed together

  mainContainer = mainContainer
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true))
    .addSectionComponents(dailyToggleRow);

  // no reason to show anything daily related if its disabled

  if (settings.daily.config.enabled) {
    mainContainer = mainContainer
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true))
      .addSectionComponents(dailyCompactRow);

    mainContainer = mainContainer
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true))
      .addSectionComponents(dailyOffsetRow);
  }

  const components = SettingsLayout({
    rows: [mainContainer],
  });

  return components;
}

async function paintUserSettings(
  interaction: ChannelSelectMenuInteraction | ButtonInteraction,
  userService: UserService
) {
  const settings = await userService.getUserSettings(interaction.user.id);
  await interaction.editReply({
    components: DailyUserSettings({ settings, interaction }),
    flags: MessageFlags.IsComponentsV2,
  });
}

export async function DailyUserSettingsButtonHandling(interaction: ButtonInteraction, userService: UserService) {
  if (interaction.context != InteractionContextType.BotDM) throw Error("User button handler called on non-DM context");
  const selection = interaction.customId;
  // check for modal calls before deferring!
  if (selection == "settings:user-daily-offset-modal") {
    // consider abstracting
    if (interaction.inGuild()) return; // handle better

    const offsetMinutes = await userService.getDailyOffsetMinutes(interaction.user.id);
    const currentHours = Math.floor(offsetMinutes / 60);
    const currentMinutes = Math.floor(offsetMinutes % 60);

    const modal = new ModalBuilder()
      .setCustomId(`modal:user-daily-offset:${interaction.message.id}`)
      .setTitle("Daily Offset");
    const hourLabel = new LabelBuilder().setLabel("Offset hour").setStringSelectMenuComponent(
      new StringSelectMenuBuilder().setCustomId("select:daily-offset-hour").addOptions(
        Array.from({ length: 24 }, (_, i) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(String(i).padStart(2, "0"))
            .setValue(String(i))
            .setDefault(i == currentHours)
        )
      )
    );
    const minuteLabel = new LabelBuilder().setLabel("Offset minute").setStringSelectMenuComponent(
      new StringSelectMenuBuilder().setCustomId("select:daily-offset-minute").addOptions(
        Array.from({ length: 12 }, (_, i) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(String(i * 5).padStart(2, "0"))
            .setValue(String(i * 5))
            .setDefault(i == currentMinutes)
        )
      )
    );
    modal.addLabelComponents(hourLabel, minuteLabel);
    await interaction.showModal(modal);
    return;
  }
  await interaction.deferUpdate();
  if (selection == "settings:user-daily-toggle-active-enable") {
    await userService.setDailyEnabled(interaction.user.id, true);
  } else if (selection == "settings:user-daily-toggle-active-disable") {
    await userService.setDailyEnabled(interaction.user.id, false);
  } else if (selection == "settings:user-daily-toggle-compact-enable") {
    await userService.setDailyCompactEnabled(interaction.user.id, true);
  } else if (selection == "settings:user-daily-toggle-compact-disable") {
    await userService.setDailyCompactEnabled(interaction.user.id, false);
  }
  // refresh
  await paintUserSettings(interaction, userService);
}
