import { MessageFlags, ModalSubmitInteraction } from "discord.js";
import UserService from "../../../services/user-service.js";
import { DailyUserSettings } from "../../../components/settings/daily-user-settings.js";

const userService = new UserService();

export const interactionId = "modal:user-daily-offset";
export const execute = async (interaction: ModalSubmitInteraction) => {
  if (!interaction.user.id) {
    throw Error("User offset modal called without user id in interaction");
    return;
  }
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  // do actual update
  const hours = parseInt(interaction.fields.getStringSelectValues("select:daily-offset-hour")[0]);
  const minutes = parseInt(interaction.fields.getStringSelectValues("select:daily-offset-minute")[0]);
  const totalMinutes = Math.min(Math.max(0, hours * 60 + minutes), 60 * 24 - 1);

  try {
    await userService.setDailyOffsetMinutes(interaction.user.id, totalMinutes);
  } catch (error) {
    console.error(error);
    await interaction.editReply({ content: `An error occurred, this has been logged.` });
    return;
  }

  // respond
  const settings = await userService.getUserSettings(interaction.user.id);
  const msgId = interaction.customId.split(":").at(-1);
  const channel = await interaction.user.createDM();
  const message = await channel?.messages.fetch(msgId as string);

  if (message) {
    await message.edit({
      content: null,
      components: DailyUserSettings({ settings, interaction }),
      flags: MessageFlags.IsComponentsV2,
    });
  }

  await interaction.editReply({ content: `Offset updated.` });
};
