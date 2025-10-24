import mongoose, { HydratedDocument, InferSchemaType } from "mongoose";
import MessageConfigSchema from "./message-config.js";

const UserSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    // daily problem settings and fault tolerance, reoccurs
    daily: {
      type: new mongoose.Schema({
        config: { type: MessageConfigSchema, required: true },
        useCompact: { type: Boolean, default: false },
        lastSuccessfulDelivery: { type: Date, default: null },
        lastAttemptedDelivery: { type: Date, default: null },
      }),
      required: true,
      default: {},
    },
    // user is allowed one additional daily reminder, manually set
    reminder: {
      config: MessageConfigSchema,
      useCompact: { type: Boolean, default: false },
      lastSuccessfulDelivery: { type: Date, default: null },
      lastAttemptedDelivery: { type: Date, default: null },
    },
    useCompact: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);
User.createCollection().catch((err) => {
  console.error("Error creating User collection:", err);
});

type UserType = InferSchemaType<typeof UserSchema>;
export type UserDocument = HydratedDocument<UserType>;

export default User;
