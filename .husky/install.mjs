import { chmodSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function ensureExecutable(dir) {
  if (!existsSync(dir)) return;

  for (const name of readdirSync(dir)) {
    if (name === "_" || name === "README.md") continue;

    const fullPath = join(dir, name);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      ensureExecutable(fullPath);
      continue;
    }

    try {
      chmodSync(fullPath, 0o755);
    } catch {
      // Windows and some filesystems may ignore or reject chmod; safe to continue.
    }
  }
}

if (process.env.HUSKY === "0") {
  process.exit(0);
}

const husky = (await import("husky")).default;
const message = husky();
if (message) {
  console.log(message);
}

ensureExecutable(join(process.cwd(), ".husky"));
