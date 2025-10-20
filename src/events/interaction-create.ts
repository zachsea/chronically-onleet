import { Collection, Events, MessageFlags, BaseInteraction } from "discord.js";
import { Command } from "../types/command.js";
import { getInteractionHandlers } from "./interactions/index.js";

const handlers = await getInteractionHandlers();

export const name: Events = Events.InteractionCreate;
export const once = false;
export async function execute(interaction: BaseInteraction) {
  if (interaction.isChatInputCommand()) {
    const commands = interaction.client.commands as Collection<string, Command>;
    const command = commands?.get(interaction.commandName);
    if (!command) {
      console.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`Error executing ${interaction.commandName}`);
      if (error instanceof Error) console.error(error.stack ?? error.message);
      else console.error(error);

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "There was an error while executing this command!",
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.reply({
          content: "There was an error while executing this command!",
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  } else if (interaction.isButton()) {
    const handler = handlers.ButtonInteraction?.get(interaction.customId);
    if (!handler) {
      await interaction.reply({
        content: "Sorry, there wasn't any handling logic for that button... seems like a bug!",
        flags: MessageFlags.Ephemeral,
      });
    } else {
      try {
        await handler.execute(interaction);
      } catch (error) {
        console.error(error);
        await interaction.reply({
          content: "Sorry, there was an unexpected error for that button... seems like a bug!",
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  }
}
