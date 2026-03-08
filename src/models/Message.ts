import { Schema, model, type InferSchemaType } from "mongoose";

const messageSchema = new Schema(
  {
    message: { type: String, required: true },
    insertedAt: { type: Date, required: true, default: Date.now }
  },
  { timestamps: true }
);

export type MessageDocument = InferSchemaType<typeof messageSchema>;
export const MessageModel = model("Message", messageSchema);
