import { ChatInputCommandInteraction, InteractionContextType, MessageFlags, SlashCommandBuilder } from "discord.js";
import Delivery from "../../models/delivery.js";

export const data = new SlashCommandBuilder()
  .setName("trigger")
  .setDescription("Trigger a context (zach only)")
  .addStringOption((option) => option.setName("context_id").setDescription("context").setRequired(false))
  .setContexts([InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel]);

export async function execute(interaction: ChatInputCommandInteraction) {
  if (interaction.user.id !== "106188449643544576") {
    await interaction.reply({ content: "You cannot use this!", flags: MessageFlags.Ephemeral });
    return;
  }
  const newDelivery = new Delivery({
    targetId: interaction.inGuild() ? interaction.guildId : interaction.user.id,
    targetType: interaction.context == InteractionContextType.Guild ? "guild" : "user",
    scheduledDate: Date.now(),
  });
  await newDelivery.save();
  await interaction.reply("Queued daily message for next poll");
}
