import mongoose from "mongoose";

const MessageConfigSchema = new mongoose.Schema(
  {
    offsetMinutes: { type: Number, min: 0, max: 1439, default: 0 },
    enabled: { type: Boolean, default: false },
  },
  { _id: false }
);
export default MessageConfigSchema;
