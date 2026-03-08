import { Schema, model, type InferSchemaType } from "mongoose";

const userAccountSchema = new Schema(
  {
    accountName: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true }
  },
  { timestamps: true }
);

userAccountSchema.index({ accountName: 1, userId: 1 }, { unique: true });

export type UserAccountDocument = InferSchemaType<typeof userAccountSchema>;
export const UserAccountModel = model("UserAccount", userAccountSchema);
