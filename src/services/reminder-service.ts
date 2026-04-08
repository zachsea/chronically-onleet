import Reminder from "../models/reminder.js";

class ReminderService {
  async setReminder(userId: string, triggersAt: Date) {
    if (!(triggersAt instanceof Date) || isNaN(triggersAt.getTime())) {
      throw new Error("triggersAt must be a valid Date");
    }

    try {
      const reminder = await Reminder.findOneAndUpdate({ userId }, { userId, triggersAt }, { upsert: true, new: true });
      return reminder;
    } catch (err) {
      console.error(`Failed to set reminder for user ${userId}:`, err);
      throw err;
    }
  }

  async cancelReminder(userId: string) {
    try {
      const result = await Reminder.deleteOne({ userId });
      return result.deletedCount > 0;
    } catch (err) {
      console.error(`Failed to cancel reminder for user ${userId}:`, err);
      throw err;
    }
  }

  async getReminder(userId: string) {
    try {
      const reminder = await Reminder.findOne({ userId });
      return reminder;
    } catch (err) {
      console.error(`Failed to get reminder for user ${userId}:`, err);
      throw err;
    }
  }

  async getPendingReminders() {
    try {
      const now = new Date();
      const reminders = await Reminder.find({ triggersAt: { $lte: now } });
      return reminders;
    } catch (err) {
      console.error("Failed to get pending reminders:", err);
      throw err;
    }
  }

  async getAllReminders() {
    try {
      return await Reminder.find();
    } catch (err) {
      console.error("Failed to get all reminders:", err);
      throw err;
    }
  }
}

export default ReminderService;
