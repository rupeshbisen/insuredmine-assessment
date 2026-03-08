import { MessageModel } from "../models/Message";
import { ScheduledMessageModel } from "../models/ScheduledMessage";

export function startScheduledMessageProcessor(intervalMs = 30_000): NodeJS.Timeout {
  return setInterval(async () => {
    const dueMessages = await ScheduledMessageModel.find({
      status: "pending",
      scheduledAt: { $lte: new Date() }
    }).limit(100);

    for (const scheduledMessage of dueMessages) {
      await MessageModel.create({
        message: scheduledMessage.message,
        insertedAt: new Date()
      });

      scheduledMessage.status = "sent";
      scheduledMessage.sentAt = new Date();
      await scheduledMessage.save();
    }
  }, intervalMs);
}
