import { spawn } from "node:child_process";

const args = process.argv.slice(2);
const command = process.platform === "win32" ? "astro.cmd" : "astro";

const child = spawn(command, args, {
  env: {
    ...process.env,
    ASTRO_TELEMETRY_DISABLED: "1"
  },
  stdio: "inherit"
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

child.on("error", (error) => {
  console.error(error.message);
  process.exit(1);
});
