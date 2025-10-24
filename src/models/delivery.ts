import mongoose, { HydratedDocument, InferSchemaType } from "mongoose";

const DeliverySchema = new mongoose.Schema(
  {
    targetId: { type: String, required: true, index: true },
    targetType: { type: String, required: true, enum: ["user", "guild", "group"], index: true },
    messageDate: { type: Date, index: true, required: false, default: null },
    scheduledDate: { type: Date, required: true, index: true },
    status: {
      type: String,
      required: true,
      enum: ["pending", "processing", "sent", "failed"],
      default: "pending",
      index: true,
    },
    error: { type: String, default: null },
    attemptCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

DeliverySchema.index({ targetId: 1, targetType: 1, messageDate: 1 }, { unique: true });
DeliverySchema.index({ status: 1, scheduledDate: 1 });

const Delivery = mongoose.model("Delivery", DeliverySchema);
Delivery.createCollection().catch((err) => {
  console.error("Error creating Delivery collection:", err);
});

type DeliveryType = InferSchemaType<typeof DeliverySchema>;
export type DeliveryDocument = HydratedDocument<DeliveryType>;

export default Delivery;
