import { Schema, model, type InferSchemaType } from "mongoose";

const scheduledMessageSchema = new Schema(
  {
    message: { type: String, required: true },
    scheduledAt: { type: Date, required: true, index: true },
    status: { type: String, enum: ["pending", "sent"], default: "pending", index: true },
    sentAt: { type: Date }
  },
  { timestamps: true }
);

export type ScheduledMessageDocument = InferSchemaType<typeof scheduledMessageSchema>;
export const ScheduledMessageModel = model("ScheduledMessage", scheduledMessageSchema);
