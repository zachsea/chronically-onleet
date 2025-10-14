import { ShardingManager } from "discord.js";
import path from "path";

const botFile = path.join(new URL(".", import.meta.url).pathname, "bot.js");
const manager = new ShardingManager(botFile);

manager.on("shardCreate", (shard) => console.log(`Launched shard ${shard.id}`));

await manager.spawn();
