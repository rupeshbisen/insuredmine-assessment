export {};

declare global {
  namespace NodeJS {
    interface Process {
      send?: (message: { type: string; utilization?: number }) => void;
    }
  }
}
