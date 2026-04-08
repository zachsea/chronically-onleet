import mongoose, { HydratedDocument, InferSchemaType } from "mongoose";

const ReminderSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    triggersAt: { type: Date, required: true, index: true },
    attemptCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Reminder = mongoose.model("Reminder", ReminderSchema);
Reminder.createCollection().catch((err) => {
  console.error("Error creating Reminder collection:", err);
});

type ReminderType = InferSchemaType<typeof ReminderSchema>;
export type ReminderDocument = HydratedDocument<ReminderType>;

export default Reminder;
