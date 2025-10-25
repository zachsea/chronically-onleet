import User from "../models/user.js";

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
