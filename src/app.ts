import fs from "node:fs";
import path from "node:path";
import Fastify from "fastify";
import multipart from "@fastify/multipart";
import { config } from "./config";
import { importPolicyFile } from "./services/importService";
import { PolicyModel } from "./models/Policy";
import { UserModel } from "./models/User";
import { parseScheduleDate } from "./utils/date";
import { ScheduledMessageModel } from "./models/ScheduledMessage";

export function buildApp() {
  const app = Fastify({ logger: true });

  app.register(multipart);

  app.get("/health", async () => ({ status: "ok" }));

  app.post("/api/upload", async (request, reply) => {
    let importFilePath: string | undefined;

    if (request.isMultipart()) {
      const file = await request.file();
      if (!file) {
        return reply.status(400).send({ error: "Missing file in multipart body" });
      }

      const uploadDir = path.join(process.cwd(), "uploads");
      fs.mkdirSync(uploadDir, { recursive: true });
      const targetPath = path.join(uploadDir, `${Date.now()}-${file.filename}`);
      await new Promise<void>((resolve, reject) => {
        const writeStream = fs.createWriteStream(targetPath);
        file.file.pipe(writeStream);
        writeStream.on("finish", () => resolve());
        writeStream.on("error", reject);
        file.file.on("error", reject);
      });
      importFilePath = targetPath;
    } else {
      const body = request.body as { filePath?: string } | undefined;
      importFilePath = body?.filePath ?? config.defaultUploadPath;
    }

    if (!importFilePath) {
      return reply.status(400).send({
        error: "Provide multipart file upload or a JSON body with filePath"
      });
    }

    const summary = await importPolicyFile(importFilePath);
    return reply.send({ message: "Import completed", summary });
  });

  app.get("/api/policies/search", async (request, reply) => {
    const query = request.query as { username?: string };
    if (!query.username) {
      return reply.status(400).send({ error: "username query param is required" });
    }

    const users = await UserModel.find({
      firstName: { $regex: `^${query.username}$`, $options: "i" }
    });

    if (users.length === 0) {
      return reply.send({ username: query.username, policies: [] });
    }

    const userIds = users.map((user) => user._id);
    const policies = await PolicyModel.find({ userId: { $in: userIds } })
      .populate("policyCategoryCollectionId", "categoryName")
      .populate("companyCollectionId", "companyName")
      .populate("userId", "firstName email phoneNumber");

    return reply.send({ username: query.username, policies });
  });

  app.get("/api/policies/aggregate-by-user", async () => {
    const aggregated = await PolicyModel.aggregate([
      {
        $group: {
          _id: "$userId",
          policyCount: { $sum: 1 },
          policies: {
            $push: {
              policyNumber: "$policyNumber",
              policyStartDate: "$policyStartDate",
              policyEndDate: "$policyEndDate"
            }
          }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 0,
          userId: "$user._id",
          firstName: "$user.firstName",
          email: "$user.email",
          phoneNumber: "$user.phoneNumber",
          policyCount: 1,
          policies: 1
        }
      }
    ]);

    return { totalUsers: aggregated.length, data: aggregated };
  });

  app.post("/api/messages/schedule", async (request, reply) => {
    const body = request.body as { message?: string; day?: string; time?: string };

    if (!body.message || !body.day || !body.time) {
      return reply.status(400).send({ error: "message, day, and time are required" });
    }

    const scheduledAt = parseScheduleDate(body.day, body.time);
    if (scheduledAt < new Date()) {
      return reply.status(400).send({ error: "Scheduled date/time must be in the future" });
    }

    const scheduled = await ScheduledMessageModel.create({
      message: body.message,
      scheduledAt,
      status: "pending"
    });

    return reply.status(201).send({
      message: "Scheduled successfully",
      scheduledMessageId: scheduled._id,
      scheduledAt
    });
  });

  return app;
}
