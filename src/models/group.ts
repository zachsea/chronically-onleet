import mongoose, { HydratedDocument, InferSchemaType } from "mongoose";
import MessageConfigSchema from "./message-config.js";

const GroupSchema = new mongoose.Schema(
  {
    groupId: { type: String, required: true, unique: true, index: true },
    // daily problem settings and fault tolerance, reoccurs
    daily: {
      type: new mongoose.Schema({
        config: { type: MessageConfigSchema, required: true },
        useCompact: { type: Boolean, default: false },
      }),
      required: true,
      default: {},
    },
  },
  { timestamps: true }
);

const Group = mongoose.model("Group", GroupSchema);
Group.createCollection().catch((err) => {
  console.error("Error creating Group collection:", err);
});

type GroupType = InferSchemaType<typeof GroupSchema>;
export type GroupDocument = HydratedDocument<GroupType>;

export default Group;
