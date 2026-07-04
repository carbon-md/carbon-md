import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import YAML from "yaml";

export interface Money {
  amount: number;
  currency: string;
}

export interface CarbonPolicy {
  carbon_md: string;
  policy: {
    contribution_target: number;
    portfolio: "removal-weighted" | "balanced" | "custom";
    monthly_budget_max: Money;
    approval_above: Money;
  };
  reporting: {
    mode: "local" | "hosted";
    public_ledger: boolean;
  };
  methodology: string;
}

export const POLICY_FILENAME = "carbon.md";

export function findPolicyPath(cwd: string): string | null {
  const p = join(cwd, POLICY_FILENAME);
  return existsSync(p) ? p : null;
}

const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---/;

export function parsePolicy(path: string): CarbonPolicy {
  const content = readFileSync(path, "utf8");
  const m = content.match(FRONT_MATTER);
  if (!m) {
    throw new Error(`${path} has no YAML front-matter block (--- ... ---).`);
  }
  const data = YAML.parse(m[1]);
  validate(data, path);
  return data as CarbonPolicy;
}

function validate(d: any, path: string): void {
  const fail = (msg: string) => {
    throw new Error(`Invalid ${path}: ${msg}`);
  };
  if (!d || typeof d !== "object") fail("front-matter is not a mapping");
  if (typeof d.carbon_md !== "string") fail("missing 'carbon_md' version string");
  const p = d.policy;
  if (!p) fail("missing 'policy' block");
  if (typeof p.contribution_target !== "number" || p.contribution_target < 0)
    fail("'policy.contribution_target' must be a number >= 0 (e.g. 1.1)");
  for (const key of ["monthly_budget_max", "approval_above"]) {
    const v = p[key];
    if (!v || typeof v.amount !== "number" || typeof v.currency !== "string")
      fail(`'policy.${key}' must be { amount: <number>, currency: <string> }`);
  }
  if (typeof d.methodology !== "string") fail("missing 'methodology' string");
}
