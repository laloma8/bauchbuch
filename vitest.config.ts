import os from "node:os";
import { defineConfig } from "vitest/config";

// Size the worker pool to this machine: leave one CPU for the OS and the agent,
// and roughly 512 MB of free memory per worker.
const cpuWorkers = Math.max(1, os.cpus().length - 1);
const memoryWorkers = Math.max(1, Math.floor(os.freemem() / (512 * 1024 * 1024)));

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    pool: "threads",
    maxWorkers: Math.min(cpuWorkers, memoryWorkers),
    testTimeout: 5000,
    hookTimeout: 5000,
    watch: false,
  },
});
