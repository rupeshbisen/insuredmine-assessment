import "dotenv/config";
import cluster from "node:cluster";
import { cpus } from "node:os";
import { startServer } from "./server";

if (cluster.isPrimary) {
  const workerCount = 1;

  for (let index = 0; index < workerCount; index += 1) {
    cluster.fork();
  }

  cluster.on("message", (worker, message: { type?: string; utilization?: number }) => {
    if (message?.type === "high_cpu") {
      console.log(
        `Worker ${worker.process.pid} crossed CPU usage ${message.utilization?.toFixed(2)}%. Restarting worker...`
      );
      worker.kill();
      cluster.fork();
    }
  });

  cluster.on("exit", (worker) => {
    if (!worker.exitedAfterDisconnect) {
      console.log(`Worker ${worker.process.pid} exited unexpectedly. Spawning a new worker...`);
      cluster.fork();
    }
  });

  console.log(`Primary process ${process.pid} online. CPUs available: ${cpus().length}`);
} else {
  startServer().catch((error) => {
    console.error("Server failed to start", error);
    process.exit(1);
  });
}
