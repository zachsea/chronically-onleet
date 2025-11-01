import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelSelectMenuInteraction,
  ChannelType,
  ContainerBuilder,
  Interaction,
  InteractionContextType,
  LabelBuilder,
  MessageActionRowComponentBuilder,
  MessageFlags,
  ModalBuilder,
  PermissionFlagsBits,
  RoleSelectMenuBuilder,
  RoleSelectMenuInteraction,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextDisplayBuilder,
} from "discord.js";
import { GuildSettings } from "../../types/guild-settings.js";
import ToggleButton from "../toggle-button.js";
import SettingsLayout from "./settings-layout.js";
import GuildService from "../../services/guild-service.js";
import formatOffset from "../../utils/formatOffset.js";

interface DailyServerSettingsProps {
  settings: GuildSettings;
  interaction: Interaction;
}

export async function DailyServerSettings({ settings, interaction }: DailyServerSettingsProps) {
  const selectedChannel = settings.daily.channelId
    ? await interaction.guild?.channels.fetch(settings.daily.channelId)
    : null;
  const selectedRole = settings.daily.roleId ? await interaction.guild?.roles.fetch(settings.daily.roleId) : null;

  let mainContainer = new ContainerBuilder().addTextDisplayComponents(
    new TextDisplayBuilder().setContent("### Daily Messages")
  );

  const dailyToggleRow = new SectionBuilder()
    .setButtonAccessory(
      ToggleButton({
        isEnabled: settings.daily.config.enabled,
        customIdEnable: "settings:guild-daily-toggle-active-enable",
        customIdDisable: "settings:guild-daily-toggle-active-disable",
      })
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("**Post daily challenges**"),
      new TextDisplayBuilder().setContent("Send a message for each daily leetcode challenge")
    );

  const channelSelectBuilder = new ChannelSelectMenuBuilder()
    .setPlaceholder("Daily channel or forum...")
    .setCustomId("settings:guild-daily-select-channel")
    .addChannelTypes([ChannelType.GuildText, ChannelType.GuildForum]);

  if (settings.daily.channelId) {
    channelSelectBuilder.setDefaultChannels([settings.daily.channelId]);
  }

  const dailyChannelRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(channelSelectBuilder);

  let dailyChannelWarningRow: TextDisplayBuilder | null = null;

  // check for unselected channel or insufficient permissions
  if (!selectedChannel) {
    dailyChannelWarningRow = new TextDisplayBuilder().setContent(
      `**A channel must be selected before dailies will be sent!**`
    );
  } else {
    const canSendMsg = selectedChannel?.permissionsFor(interaction.client.user)?.has(PermissionFlagsBits.SendMessages);
    const canViewCnl = selectedChannel?.permissionsFor(interaction.client.user)?.has(PermissionFlagsBits.ViewChannel);
    if (!canViewCnl) {
      dailyChannelWarningRow = new TextDisplayBuilder().setContent(`**I don't have permission to view that channel!**`);
    } else if (!canSendMsg) {
      if (selectedChannel.type === ChannelType.GuildForum) {
        dailyChannelWarningRow = new TextDisplayBuilder().setContent(
          `**I don't have permission to make posts there!**\nMake sure I have the \`Send Messages\` permission`
        );
      } else {
        dailyChannelWarningRow = new TextDisplayBuilder().setContent(
          `**I don't have permissions to send messages there!**\nMake sure I have the \`Send Messages\` permission`
        );
      }
    }
  }

  const dailyThreadRow = new SectionBuilder()
    .setButtonAccessory(
      ToggleButton({
        isEnabled: settings.daily.useThreads,
        customIdEnable: "settings:guild-daily-toggle-threads-enable",
        customIdDisable: "settings:guild-daily-toggle-threads-disable",
      })
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("**Use threads**"),
      new TextDisplayBuilder().setContent(
        "To use a forum, select it from the above dropdown.\nThis option is ignored for forums"
      )
    );

  let dailyThreadWarningRow: TextDisplayBuilder | null = null;

  if (selectedChannel) {
    const canCreateThread = selectedChannel
      ?.permissionsFor(interaction.client.user)
      ?.has(PermissionFlagsBits.CreatePublicThreads);

    if (!canCreateThread) {
      dailyThreadWarningRow = new TextDisplayBuilder().setContent(
        `**I don't have permission to create threads in the selected channel!**\nMake sure I have the \`Created Public Threads\` permission there`
      );
    }
  }

  const dailyRoleToggleRow = new SectionBuilder()
    .setButtonAccessory(
      ToggleButton({
        isEnabled: settings.daily.useRolePing,
        customIdEnable: "settings:guild-daily-toggle-role-ping-enable",
        customIdDisable: "settings:guild-daily-toggle-role-ping-disable",
      })
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("**Mention role**"),
      new TextDisplayBuilder().setContent("Enable if a role should be pinged when dailies are posted")
    );

  const roleSelectBuilder = new RoleSelectMenuBuilder()
    .setPlaceholder("Role to ping...")
    .setCustomId("settings:guild-daily-select-role");

  if (settings.daily.roleId) {
    roleSelectBuilder.setDefaultRoles([settings.daily.roleId]);
  }

  const dailyRoleSelectRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(roleSelectBuilder);

  let dailyRoleSelectWarning: TextDisplayBuilder | null = null;

  if (selectedRole && settings.daily.roleId && !selectedRole.mentionable) {
    dailyRoleSelectWarning = new TextDisplayBuilder().setContent(`**I can't mention this role!**`);
  }

  const dailyCompactRow = new SectionBuilder()
    .setButtonAccessory(
      ToggleButton({
        isEnabled: settings.daily.useCompact,
        customIdEnable: "settings:guild-daily-toggle-compact-enable",
        customIdDisable: "settings:guild-daily-toggle-compact-disable",
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
        .setCustomId("settings:guild-daily-offset-modal")
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
    // channel
    mainContainer = mainContainer.addActionRowComponents(dailyChannelRow);

    if (dailyChannelWarningRow) {
      mainContainer = mainContainer.addTextDisplayComponents(dailyChannelWarningRow);
    }

    // don't show thread option for forum channels
    if (!(selectedChannel && selectedChannel.type === ChannelType.GuildForum)) {
      mainContainer = mainContainer
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true))
        .addSectionComponents(dailyThreadRow);

      if (dailyThreadWarningRow) {
        mainContainer = mainContainer.addTextDisplayComponents(dailyThreadWarningRow);
      }
    }

    // mentions
    mainContainer = mainContainer
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true))
      .addSectionComponents(dailyRoleToggleRow);

    if (settings.daily.useRolePing) {
      mainContainer.addActionRowComponents(dailyRoleSelectRow);

      if (dailyRoleSelectWarning) {
        mainContainer = mainContainer.addTextDisplayComponents(dailyRoleSelectWarning);
      }
    }

    // compact
    mainContainer = mainContainer
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true))
      .addSectionComponents(dailyCompactRow);

    // offset
    mainContainer = mainContainer
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true))
      .addSectionComponents(dailyOffsetRow);
  }

  const components = SettingsLayout({
    rows: [mainContainer],
  });

  return components;
}

async function paintServerSettings(
  interaction: ChannelSelectMenuInteraction | ButtonInteraction | RoleSelectMenuInteraction,
  guildService: GuildService
) {
  if (!interaction.guildId) return;
  const settings = await guildService.getGuildSettings(interaction.guildId);
  await interaction.editReply({
    components: await DailyServerSettings({ settings, interaction }),
    flags: MessageFlags.IsComponentsV2,
  });
}

export async function DailyServerSettingsButtonHandling(interaction: ButtonInteraction, guildService: GuildService) {
  if (!interaction.inGuild()) throw Error("Guild button handler called on non-guild interaction");
  const selection = interaction.customId;
  // check for modal calls before deferring!
  if (selection == "settings:guild-daily-offset-modal") {
    // consider abstracting
    if (!interaction.inGuild()) return; // handle better
    if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) return; // handle better

    const offsetMinutes = await guildService.getDailyOffsetMinutes(interaction.guildId);
    const currentHours = Math.floor(offsetMinutes / 60);
    const currentMinutes = Math.floor(offsetMinutes % 60);

    const modal = new ModalBuilder()
      .setCustomId(`modal:guild-daily-offset:${interaction.message.id}`)
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
  // definitely not a modal call, handle normally now
  await interaction.deferUpdate();
  if (selection == "settings:guild-daily-toggle-active-enable") {
    await guildService.setDailyEnabled(interaction.guildId, true);
  } else if (selection == "settings:guild-daily-toggle-active-disable") {
    await guildService.setDailyEnabled(interaction.guildId, false);
  } else if (selection == "settings:guild-daily-toggle-threads-enable") {
    await guildService.setDailyThreadsEnabled(interaction.guildId, true);
  } else if (selection == "settings:guild-daily-toggle-threads-disable") {
    await guildService.setDailyThreadsEnabled(interaction.guildId, false);
  } else if (selection == "settings:guild-daily-toggle-compact-enable") {
    await guildService.setDailyCompactEnabled(interaction.guildId, true);
  } else if (selection == "settings:guild-daily-toggle-compact-disable") {
    await guildService.setDailyCompactEnabled(interaction.guildId, false);
  } else if (selection == "settings:guild-daily-toggle-role-ping-enable") {
    await guildService.setDailyRolePingEnabled(interaction.guildId, true);
  } else if (selection == "settings:guild-daily-toggle-role-ping-disable") {
    await guildService.setDailyRolePingEnabled(interaction.guildId, false);
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

export async function DailyServerSettingsRoleHandling(
  interaction: RoleSelectMenuInteraction,
  guildService: GuildService
) {
  await interaction.deferUpdate();
  const selection = interaction.values[0];

  if (interaction.context === InteractionContextType.Guild && interaction.guildId) {
    if (selection) {
      // add more validation logic here
      await guildService.setDailyRolePingId(interaction.guildId, selection);
      await paintServerSettings(interaction, guildService);
    }
  }
}
