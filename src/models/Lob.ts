import { Schema, model, type InferSchemaType } from "mongoose";

const lobSchema = new Schema(
  {
    categoryName: { type: String, required: true, unique: true, index: true }
  },
  { timestamps: true }
);

export type LobDocument = InferSchemaType<typeof lobSchema>;
export const LobModel = model("Lob", lobSchema);
