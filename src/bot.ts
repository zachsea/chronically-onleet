import { Client, GatewayIntentBits } from "discord.js";
import mongoose from "mongoose";
import { env } from "./env.js";
import { registerCommands } from "./commands/index.js";
import { registerEvents } from "./events/index.js";
import { redis } from "./lib/redis-client.js";

const replaceConsoleOutputPrefix = () => {
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalInfo = console.info;

  const shardId = process.env.SHARD_ID || 0; // "passed" by shardmanager, not in type-validated env
  const prefix = `[Shard ${shardId}]`;

  console.log = (...args) => originalLog(prefix, ...args);
  console.error = (...args) => originalError(prefix, ...args);
  console.warn = (...args) => originalWarn(prefix, ...args);
  console.info = (...args) => originalInfo(prefix, ...args);
};

const shutdownGracefully = async () => {
  console.log("Shutting down gracefully...");
  await mongoose.connection.close(false);
  console.log("MongoDB connection closed.");
  await redis.disconnect();
  console.log("Redis connection closed");
  await client.destroy();
  process.exit(0);
};

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

process.on("SIGINT", shutdownGracefully);
process.on("SIGTERM", shutdownGracefully);

// go!
replaceConsoleOutputPrefix();
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages] });
await connectRedis();
await connectMongo();
await registerEvents(client);
await registerCommands(client);
await client.login(env.DISCORD_TOKEN);
