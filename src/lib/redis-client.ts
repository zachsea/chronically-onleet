import { RedisArgument, RedisClientType } from "@redis/client";
import { env } from "../env.js";
import { createClient } from "redis";

class RedisService {
  private client: RedisClientType | null = null;
  private ready = false;

  async connect(): Promise<void> {
    if (!env.REDIS_URI) {
      console.warn("[Redis] REDIS_URI not set - redis disabled");
      return;
    }

    try {
      this.client = createClient({ url: env.REDIS_URI });
      this.client.on("error", (err: unknown) => {
        console.error("[Redis] Error:", err);
        this.ready = false;
      });
      this.client.on("reconnecting", () => {
        console.log("[Redis] Reconnecting...");
      });

      await this.client.connect();
      this.ready = true;
      console.log("[Redis] Connected");
    } catch (err: unknown) {
      console.error("[Redis] Connection failed:", err);
      this.client = null;
      this.ready = false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.ready = false;
      console.log("[Redis] Disconnected");
    }
  }

  isReady(): boolean {
    return this.ready && this.client !== null;
  }

  private getClient(): RedisClientType {
    if (!this.client) {
      throw new Error("[Redis] Client not initialized");
    }
    return this.client;
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    if (!this.isReady()) return null;
    try {
      const raw = await this.getClient().get(key);
      return raw ? (raw as T) : null;
    } catch (err: unknown) {
      console.error("[Redis] get error for key", key, err);
      return null;
    }
  }

  async set(key: string, value: RedisArgument, ttlSeconds?: number): Promise<boolean> {
    if (!this.isReady()) return false;
    try {
      const options = ttlSeconds ? { EX: ttlSeconds } : undefined;
      await this.getClient().set(key, value, options);
      return true;
    } catch (err: unknown) {
      console.error("[Redis] set error for key", key, err);
      return false;
    }
  }

  async getJson<T = unknown>(key: string): Promise<T | null> {
    if (!this.isReady()) return null;
    try {
      const raw = await this.getClient().get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (err: unknown) {
      console.error("[Redis] get error for key", key, err);
      return null;
    }
  }

  async setJson(key: string, value: unknown, ttlSeconds?: number): Promise<boolean> {
    if (!this.isReady()) return false;
    try {
      const options = ttlSeconds ? { EX: ttlSeconds } : undefined;
      await this.getClient().set(key, JSON.stringify(value), options);
      return true;
    } catch (err: unknown) {
      console.error("[Redis] set error for key", key, err);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.isReady()) return false;
    try {
      const removed = await this.getClient().del(key);
      return removed > 0;
    } catch (err: unknown) {
      console.error("[Redis] del error for key", key, err);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isReady()) return false;
    try {
      return (await this.getClient().exists(key)) > 0;
    } catch (err: unknown) {
      console.error("[Redis] exists error for key", key, err);
      return false;
    }
  }

  async incr(key: string): Promise<number | null> {
    if (!this.isReady()) return null;
    try {
      return await this.getClient().incr(key);
    } catch (err: unknown) {
      console.error("[Redis] incr error for key", key, err);
      return null;
    }
  }

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    if (!this.isReady()) return false;
    try {
      const result = await this.getClient().expire(key, ttlSeconds);
      return typeof result === "number" ? result > 0 : Boolean(result);
    } catch (err: unknown) {
      console.error("[Redis] expire error for key", key, err);
      return false;
    }
  }

  async mget<T = unknown>(keys: string[]): Promise<(T | null)[]> {
    if (!this.isReady()) return keys.map(() => null);
    try {
      const values = await this.getClient().mGet(keys);
      return values.map((v) => (v ? (JSON.parse(v) as T) : null));
    } catch (err: unknown) {
      console.error("[Redis] mget error", err);
      return keys.map(() => null);
    }
  }

  async mset(pairs: Array<[string, unknown]>, ttlSeconds?: number): Promise<boolean> {
    if (!this.isReady()) return false;
    try {
      const pipeline = this.getClient().multi();
      for (const [key, value] of pairs) {
        if (ttlSeconds) {
          pipeline.set(key, JSON.stringify(value), { expiration: { type: "EX", value: ttlSeconds } });
        } else {
          pipeline.set(key, JSON.stringify(value));
        }
      }
      await pipeline.exec();
      return true;
    } catch (err: unknown) {
      console.error("[Redis] mset error", err);
      return false;
    }
  }
}

export const redis = new RedisService();
