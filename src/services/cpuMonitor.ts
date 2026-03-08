import os from "node:os";

type CpuMonitorOptions = {
  thresholdPercent: number;
  intervalMs: number;
  onThresholdCrossed: (utilization: number) => void;
};

export function startCpuMonitor(options: CpuMonitorOptions): NodeJS.Timeout {
  let lastCpu = process.cpuUsage();
  let lastTime = process.hrtime.bigint();
  let triggered = false;

  return setInterval(() => {
    const currentCpu = process.cpuUsage();
    const currentTime = process.hrtime.bigint();

    const userDelta = currentCpu.user - lastCpu.user;
    const systemDelta = currentCpu.system - lastCpu.system;
    const elapsedNs = Number(currentTime - lastTime);

    lastCpu = currentCpu;
    lastTime = currentTime;

    if (elapsedNs <= 0) {
      return;
    }

    const elapsedSec = elapsedNs / 1_000_000_000;
    const processCpuSec = (userDelta + systemDelta) / 1_000_000;
    const utilization = (processCpuSec / (elapsedSec * os.cpus().length)) * 100;

    if (utilization > options.thresholdPercent && !triggered) {
      triggered = true;
      options.onThresholdCrossed(utilization);
    }

    if (utilization <= options.thresholdPercent) {
      triggered = false;
    }
  }, options.intervalMs);
}
