// dsh-evidence-plugin — the evidence ledger from dsh-super-agent, inside DeepSeek Harness.
// Every session transition lands in a hash-chained append-only ledger in YOUR git repo:
// tamper-evident by construction (edit any row and the chain breaks; truncate the tail and
// the head anchor breaks). Trust is not a claim — it's a chain you can verify.

import type { Context } from "@deepseek-ai/cordis";
import { EvidenceLedger } from "./ledger.ts";
import { toTransition } from "./entry.ts";

export const name = "dsh-evidence-plugin";

export const inject = ["dsh"];

export interface Config {
  /** Absolute path to the evidence git repo. */
  repo: string;
  /** Commit after every N transitions (0 = no auto-commit). */
  commitEvery: number;
}

export const Config: Config = { repo: "", commitEvery: 50 } as unknown as Config;

export function apply(ctx: Context, config: Config): void {
  const log = ctx.logger;
  if (!config.repo) {
    log.warn("evidence: config.repo empty — ledger disabled");
    return;
  }
  const ledger = new EvidenceLedger(config.repo);
  let sinceCommit = 0;
  ctx.on(
    "session/event" as never,
    (ev: Record<string, unknown>) => {
      const t = toTransition(ev);
      if (!t) return;
      try {
        const row = ledger.emit(t.kind, t.payload);
        if (row.id % 100 === 1) log.info(`evidence: row #${row.id} (${t.kind})`);
        sinceCommit++;
      } catch (e) {
        log.warn(`evidence: emit failed: ${e instanceof Error ? e.message : String(e)}`);
      }
    } as never,
  );
  // Commit cadence: piggyback a timer effect; offline tolerated (ledger stays local).
  ctx.effect(() => {
    const timer = setInterval(() => {
      if (sinceCommit === 0) return;
      sinceCommit = 0;
      import("./git.ts").then(({ commitEvidence }) =>
        commitEvidence(config.repo).catch((e) => log.warn(`evidence: commit failed: ${e}`)),
      );
    }, 60_000);
    return () => clearInterval(timer);
  });
}
