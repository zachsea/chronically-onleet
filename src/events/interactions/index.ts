import path from "node:path";
import fs from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { BaseInteraction } from "discord.js";

type InteractionModuleShape = {
  interactionId: string;
  execute: (interaction: BaseInteraction) => Promise<void> | void;
};

const interactionTypeMap: Record<string, string> = {
  buttons: "ButtonInteraction",
};

function isInteractionModule(mod: unknown): mod is InteractionModuleShape {
  if (!mod || typeof mod !== "object") return false;
  const asRecord = mod as Record<string, unknown>;
  return typeof asRecord.interactionId === "string" && typeof asRecord.execute === "function";
}

let cache: Record<string, Map<string, InteractionModuleShape>> | null = null;

export async function getInteractionHandlers() {
  // files will not change after initial run through
  if (cache) return cache;

  cache = {};
  const basePath = path.dirname(fileURLToPath(import.meta.url));

  // group interactions by their subdirs
  const subdirs = fs
    .readdirSync(basePath, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const subdir of subdirs) {
    const subPath = path.join(basePath, subdir);
    const files = fs.readdirSync(subPath).filter((f) => f.endsWith(".ts") || f.endsWith(".js"));

    const interactionType = interactionTypeMap[subdir] ?? subdir;
    const map = new Map<string, InteractionModuleShape>();

    for (const file of files) {
      const filePath = path.join(subPath, file);
      const interactionModule: unknown = await import(pathToFileURL(filePath).href);

      if (isInteractionModule(interactionModule)) {
        map.set(interactionModule.interactionId, interactionModule);
      }
    }

    cache[interactionType] = map;
  }

  return cache;
}
