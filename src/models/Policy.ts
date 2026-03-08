import { Schema, model, type InferSchemaType } from "mongoose";

const policySchema = new Schema(
  {
    policyNumber: { type: String, required: true, unique: true, index: true },
    policyStartDate: { type: Date },
    policyEndDate: { type: Date },
    policyCategoryCollectionId: { type: Schema.Types.ObjectId, ref: "Lob", required: true, index: true },
    companyCollectionId: { type: Schema.Types.ObjectId, ref: "Carrier", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true }
  },
  { timestamps: true }
);

export type PolicyDocument = InferSchemaType<typeof policySchema>;
export const PolicyModel = model("Policy", policySchema);
