import mongoose, { HydratedDocument, InferSchemaType } from "mongoose";
import MessageConfigSchema from "./message-config.js";

const GuildSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, unique: true, index: true },

    daily: {
      type: new mongoose.Schema({
        channelId: { type: String, default: null },
        useThreads: { type: Boolean, default: false },
        config: { type: MessageConfigSchema, required: true, default: {} },
        useCompact: { type: Boolean, default: false },
        useRolePing: { type: Boolean, default: false },
        roleId: { type: String, default: null },
      }),
      required: true,
      default: {},
    },
  },
  { timestamps: true }
);

const Guild = mongoose.model("Guild", GuildSchema);
Guild.createCollection().catch((err) => {
  console.error("Error creating Guild collection:", err);
});

type GuildType = InferSchemaType<typeof GuildSchema>;
export type GuildDocument = HydratedDocument<GuildType>;

export default Guild;
