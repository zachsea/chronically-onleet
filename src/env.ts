import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    DISCORD_CLIENT_ID: z.string().min(1),
    DISCORD_TOKEN: z.string().min(1),
    MONGODB_URI: z.string().min(1),
    REDIS_URI: z.string().min(1).optional(),
    MESSAGE_POLL_SECONDS: z.int().min(1).optional().default(5),
  },
  emptyStringAsUndefined: true,
  runtimeEnvStrict: {
    DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
    DISCORD_TOKEN: process.env.DISCORD_TOKEN,
    MONGODB_URI: process.env.MONGODB_URI,
    REDIS_URI: process.env.REDIS_URI,
    MESSAGE_POLL_SECONDS: process.env.MESSAGE_POLL_SECONDS,
  },
});
