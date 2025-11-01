import User from "../models/user.js";
import Delivery from "../models/delivery.js";

class UserService {
  async createUser(userId: string) {
    // init with sensible defaults
    const newUser = new User({ userId });
    try {
      await newUser.save();
    } catch (err) {
      console.error(`Failed to save new user with id ${userId}:`, err);
      throw err;
    }
    return newUser;
  }

  async getUser(userId: string) {
    const existingUser = await User.findOne({ userId });
    if (existingUser) return existingUser;
    return await this.createUser(userId);
  }

  async getDailyEnabled(userId: string) {
    const user = await this.getUser(userId);
    if (!user) throw Error("User not found");
    return user.daily.config.enabled;
  }

  async setDailyEnabled(userId: string, enabled: boolean) {
    const user = await this.getUser(userId);
    if (!user) throw Error("User not found");
    user.daily.config.enabled = enabled;
    try {
      await user.save();
    } catch (err) {
      console.error(`Failed to save daily.enabled for user ${userId}:`, err);
      throw err;
    }
  }

  async getDailyOffsetMinutes(userId: string) {
    const user = await this.getUser(userId);
    if (!user) throw Error("User not found");
    return user.daily.config.offsetMinutes;
  }

  async setDailyOffsetMinutes(userId: string, minutes: number) {
    const user = await this.getUser(userId);
    if (!user) throw Error("User not found");
    user.daily.config.offsetMinutes = minutes;
    try {
      await user.save();
    } catch (err) {
      console.error(`Failed to save daily.offsetMinutes for user ${userId}:`, err);
      throw err;
    }

    // align today's pending delivery if moving to a later time and it hasn't sent yet
    try {
      if (!user.daily.config.enabled) return;

      const now = new Date();
      const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60000);
      const scheduledAt = new Date(dayStart.getTime() + minutes * 60000);

      const existing = await Delivery.findOne({
        targetId: userId,
        targetType: "user",
        scheduledDate: { $gte: dayStart, $lt: dayEnd },
      });

      if (!existing) {
        // no delivery yet today, create one for today at new time
        const when = scheduledAt <= now ? now : scheduledAt;
        await Delivery.create({ targetId: userId, targetType: "user", scheduledDate: when, status: "pending" });
        return;
      }

      if (existing.status === "pending") {
        // if moved later and still in future, push forward
        if (existing.scheduledDate < scheduledAt && now < scheduledAt) {
          existing.scheduledDate = scheduledAt;
          await existing.save();
        }
        // if moved earlier and new time already passed, pull to now for immediate send
        else if (scheduledAt <= now && existing.scheduledDate > now) {
          existing.scheduledDate = now;
          await existing.save();
        }
      }
    } catch (err) {
      console.error(`Failed aligning today's delivery after user offset change (${userId}):`, err);
    }
  }

  async getDailyCompactEnabled(userId: string) {
    const user = await this.getUser(userId);
    if (!user) throw Error("User not found");
    return user.daily.useCompact;
  }

  async setDailyCompactEnabled(userId: string, enabled: boolean) {
    const user = await this.getUser(userId);
    if (!user) throw Error("User not found");
    user.daily.useCompact = enabled;
    try {
      await user.save();
    } catch (err) {
      console.error(`Failed to save daily.useCompact for user ${userId}:`, err);
      throw err;
    }
  }

  async getUserCompactEnabled(userId: string) {
    const user = await this.getUser(userId);
    if (!user) throw Error("User not found");
    return user.useCompact;
  }

  async setUserCompactEnabled(userId: string, enabled: boolean) {
    const user = await this.getUser(userId);
    if (!user) throw Error("User not found");
    user.useCompact = enabled;
    try {
      await user.save();
    } catch (err) {
      console.error(`Failed to save daily.useCompact for user ${userId}:`, err);
      throw err;
    }
  }

  // return all setting objects as one
  async getUserSettings(userId: string) {
    const user = await this.getUser(userId);
    if (!user) throw Error("User not found");
    return {
      daily: {
        config: user.daily.config,
        useCompact: user.daily.useCompact,
      },
      useCompact: user.useCompact,
    };
  }
}

export default UserService;
