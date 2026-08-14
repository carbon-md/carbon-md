import { cmdSyncClaude } from "./sync-claude.js";
import { cmdSyncHermes } from "./sync-hermes.js";

export async function cmdSync(cwd: string, argv: string[]): Promise<number> {
  const target = argv[0];
  if (target === "claude-code") {
    return cmdSyncClaude(cwd, argv.slice(1));
  }
  if (target === "hermes") {
    return cmdSyncHermes(cwd, argv.slice(1));
  }
  console.error("Usage: carbon-md sync <claude-code|hermes> [options]");
  console.error("Supported sync targets:");
  console.error("  npx carbon-md sync claude-code [--all | --dir <path>] [--dry-run]");
  console.error("  npx carbon-md sync hermes [--db <path>] [--dry-run]");
  return 1;
}
