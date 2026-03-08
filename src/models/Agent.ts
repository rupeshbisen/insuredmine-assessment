import { Schema, model, type InferSchemaType } from "mongoose";

const agentSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, index: true }
  },
  { timestamps: true }
);

export type AgentDocument = InferSchemaType<typeof agentSchema>;
export const AgentModel = model("Agent", agentSchema);
