export const config = {
  mongoUri: process.env.MONGO_URI ?? "mongodb://127.0.0.1:27017/insuredmine",
  port: Number(process.env.PORT ?? 3000),
  defaultUploadPath: process.env.DEFAULT_UPLOAD_PATH,
  cpuThresholdPercent: Number(process.env.CPU_THRESHOLD_PERCENT ?? 70),
  cpuCheckIntervalMs: Number(process.env.CPU_CHECK_INTERVAL_MS ?? 5000)
};
