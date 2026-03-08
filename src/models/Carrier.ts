import { Schema, model, type InferSchemaType } from "mongoose";

const carrierSchema = new Schema(
  {
    companyName: { type: String, required: true, unique: true, index: true }
  },
  { timestamps: true }
);

export type CarrierDocument = InferSchemaType<typeof carrierSchema>;
export const CarrierModel = model("Carrier", carrierSchema);
