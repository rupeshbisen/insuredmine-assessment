import mongoose from "mongoose";
import { config } from "./config";

export async function connectDb(uri = config.mongoUri): Promise<void> {
  if (mongoose.connection.readyState === 1) {
    return;
  }
  await mongoose.connect(uri);
}

export async function disconnectDb(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
