import { ShardingManager } from "discord.js";
import path from "path";
import MessageService from "./services/message-service.js";
import mongoose from "mongoose";
import { redis } from "./lib/redis-client.js";
import { env } from "./env.js";
import ScheduleService from "./services/schedule-service.js";

const botFile = path.join(new URL(".", import.meta.url).pathname, "bot.js");
const manager = new ShardingManager(botFile);

const connectMongo = async () => {
  mongoose.set("bufferCommands", false);
  mongoose.set("autoCreate", false);
  try {
    await mongoose.connect(env.MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 5000,
      retryWrites: true,
    });
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
};

const connectRedis = async () => {
  await redis.connect();
};

manager.on("shardCreate", (shard) => {
  console.log(`[Manager] Launched shard ${shard.id}`);
  shard.env = Object.assign({}, shard.env ?? {}, { SHARD_ID: String(shard.id) });
});

await manager.spawn().then(async () => {
  // startup services
  await connectRedis();
  await connectMongo();
  const messageService = new MessageService(manager, { pollIntervalMs: env.MESSAGE_POLL_SECONDS * 1000 });
  await messageService.start();
  const scheduleService = new ScheduleService({ pollIntervalMs: env.SCHEDULE_POLL_SECONDS * 1000 });
  await scheduleService.start();
});
