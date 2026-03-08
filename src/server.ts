import { buildApp } from "./app";
import { config } from "./config";
import { connectDb, disconnectDb } from "./db";
import { startCpuMonitor } from "./services/cpuMonitor";
import { startScheduledMessageProcessor } from "./services/scheduler";

export async function startServer(): Promise<void> {
  await connectDb();
  const app = buildApp();

  const schedulerInterval = startScheduledMessageProcessor();

  startCpuMonitor({
    thresholdPercent: config.cpuThresholdPercent,
    intervalMs: config.cpuCheckIntervalMs,
    onThresholdCrossed: (utilization) => {
      app.log.warn(`CPU threshold crossed: ${utilization.toFixed(2)}%`);
      if (process.send) {
        process.send({ type: "high_cpu", utilization });
      }
    }
  });

  await app.listen({ port: config.port, host: "0.0.0.0" });

  const shutdown = async () => {
    clearInterval(schedulerInterval);
    await app.close();
    await disconnectDb();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
