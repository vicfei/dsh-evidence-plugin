import { spawnSync } from "node:child_process";

function git(root: string, args: string[]): string {
  return spawnSync("git", ["-C", root, ...args], { encoding: "utf8" }).stdout ?? "";
}

/** Commit the ledger; push best-effort. */
export async function commitEvidence(root: string): Promise<void> {
  git(root, ["add", "-A"]);
  if (!git(root, ["status", "--porcelain"]).trim()) return;
  git(root, ["-c", "user.name=dsh-evidence", "-c", "user.email=evidence@localhost", "commit", "-q", "-m", `evidence: ledger @ ${new Date().toISOString()}`]);
  try {
    git(root, ["pull", "--rebase", "-q"]);
    git(root, ["push", "-q"]);
  } catch {
    /* offline tolerated */
  }
}
