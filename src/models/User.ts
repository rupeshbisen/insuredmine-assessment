import { Schema, model, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    firstName: { type: String, required: true, index: true },
    dob: { type: Date },
    address: { type: String },
    phoneNumber: { type: String, index: true },
    state: { type: String },
    zipCode: { type: String },
    email: { type: String, index: true },
    gender: { type: String },
    userType: { type: String },
    agentId: { type: Schema.Types.ObjectId, ref: "Agent", index: true }
  },
  { timestamps: true }
);

userSchema.index({ firstName: 1, email: 1, phoneNumber: 1 }, { unique: true, sparse: true });

export type UserDocument = InferSchemaType<typeof userSchema>;
export const UserModel = model("User", userSchema);
