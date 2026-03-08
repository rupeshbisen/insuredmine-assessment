import fs from "node:fs";
import path from "node:path";
import { Worker } from "node:worker_threads";
import { config } from "../config";

type ImportWorkerResponse = {
  success: boolean;
  summary?: {
    totalRows: number;
    agents: number;
    users: number;
    accounts: number;
    lobs: number;
    carriers: number;
    policies: number;
  };
  error?: string;
};

export async function importPolicyFile(filePath: string): Promise<NonNullable<ImportWorkerResponse["summary"]>> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const candidateWorkerPaths = [
    path.join(process.cwd(), "dist", "workers", "importWorker.js"),
    path.join(process.cwd(), "workers", "importWorker.js")
  ];

  const workerFilePath = candidateWorkerPaths.find((workerPath) => fs.existsSync(workerPath));

  if (!workerFilePath) {
    throw new Error(
      `Worker not found. Checked: ${candidateWorkerPaths.join(", ")}. Run 'npm run build' from project root first.`
    );
  }

  return new Promise((resolve, reject) => {
    const worker = new Worker(workerFilePath, {
      workerData: {
        filePath,
        mongoUri: config.mongoUri
      }
    });

    worker.on("message", (response: ImportWorkerResponse) => {
      if (!response.success || !response.summary) {
        reject(new Error(response.error ?? "Import failed"));
        return;
      }
      resolve(response.summary);
    });

    worker.on("error", reject);
    worker.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
}
