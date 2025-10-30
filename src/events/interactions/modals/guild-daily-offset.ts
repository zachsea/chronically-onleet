import { MessageFlags, ModalSubmitInteraction } from "discord.js";
import { DailyServerSettings } from "../../../components/settings/daily-server-settings.js";
import GuildService from "../../../services/guild-service.js";

const guildService = new GuildService();

export const interactionId = "modal:guild-daily-offset";
export const execute = async (interaction: ModalSubmitInteraction) => {
  if (!interaction.guildId) {
    throw Error("Guild offset modal called without guild id in interaction");
    return;
  }
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  // do actual update
  const hours = parseInt(interaction.fields.getStringSelectValues("select:daily-offset-hour")[0]);
  const minutes = parseInt(interaction.fields.getStringSelectValues("select:daily-offset-minute")[0]);
  const totalMinutes = Math.min(Math.max(0, hours * 60 + minutes), 60 * 24 - 1);

  try {
    await guildService.setDailyOffsetMinutes(interaction.guildId, totalMinutes);
  } catch (error) {
    console.error(error);
    await interaction.editReply({ content: `An error occurred, this has been logged.` });
    return;
  }

  // respond
  const settings = await guildService.getGuildSettings(interaction.guildId);
  const msgId = interaction.customId.split(":").at(-1);
  const message = await interaction.channel?.messages.fetch(msgId as string);
  if (message) {
    await message.edit({
      content: null,
      components: DailyServerSettings({ settings, interaction }),
      flags: MessageFlags.IsComponentsV2,
    });
  }
  await interaction.editReply({ content: `Offset updated.` });
};
