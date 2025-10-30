import { Collection, Events, MessageFlags, BaseInteraction } from "discord.js";
import { Command } from "../types/command.js";
import { getInteractionHandlers } from "./interactions/index.js";

const handlers = await getInteractionHandlers();

export const name = Events.InteractionCreate;
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
      console.error(`Error executing ${interaction.commandName}`, error);
      const replyContent = {
        content: "There was an error while executing this command!",
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(replyContent);
      } else {
        await interaction.reply(replyContent);
      }
    }

    return;
  }

  // find handler by prefix
  function findHandler<K extends keyof typeof handlers>(type: K, customId: string) {
    const map = handlers[type];
    if (!map) return null;

    for (const [id, handler] of map.entries()) {
      if (customId === id || customId.startsWith(id + ":")) {
        return handler;
      }
    }
    return null;
  }

  if (interaction.isButton()) {
    const handler = findHandler("ButtonInteraction", interaction.customId);
    if (!handler) return;

    try {
      await handler.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "Sorry, there was an unexpected error for that button... seems like a bug!",
        flags: MessageFlags.Ephemeral,
      });
    }
  } else if (interaction.isModalSubmit()) {
    const handler = findHandler("ModalSubmitInteraction", interaction.customId);
    if (!handler) return;

    try {
      await handler.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "Sorry, there was an unexpected error for that modal submission... seems like a bug!",
        flags: MessageFlags.Ephemeral,
      });
    }
  }
}
