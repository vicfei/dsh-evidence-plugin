// dsh-evidence-plugin — the evidence ledger from dsh-super-agent, inside DeepSeek Harness.
// Every session transition lands in a hash-chained, append-only ledger in YOUR git repo:
// tamper-evident by construction.
//
// Contract (verified against dsh-loopx-plugin's observer):
//   ctx.on('session/created' | 'session/event' | 'session/disposed', ...)
//   'session/event' receives (session, event) — the event is the SECOND argument.

import type { Context } from "@deepseek-ai/cordis";
import { EvidenceLedger } from "./ledger.js";
import { toTransition } from "./entry.js";
import { commitEvidence } from "./git.js";

export const name = "dsh-evidence-plugin";

export const inject: readonly string[] = [];

export interface Config {
  /** Absolute path to the evidence git repo. */
  repo: string;
}

export const Config: Config = { repo: "" } as unknown as Config;

export function apply(ctx: Context, config: Config): void {
  const log = ctx.logger;
  if (!config.repo) {
    log.warn("evidence: config.repo empty — ledger disabled");
    return;
  }
  const ledger = new EvidenceLedger(config.repo);
  const sessionId = (s: unknown) => String((s as { id?: unknown })?.id ?? "unknown");
  let dirty = false;

  ctx.on("session/created" as never, ((session: unknown) => {
    ledger.emit("dsh/session-created", { session: sessionId(session) });
    dirty = true;
  }) as never);

  ctx.on("session/event" as never, ((session: unknown, event: { type?: unknown }) => {
    const t = toTransition(event as Record<string, unknown>);
    if (!t) return;
    ledger.emit(t.kind, { session: sessionId(session), ...t.payload });
    dirty = true;
  }) as never);

  ctx.on("session/disposed" as never, ((session: unknown) => {
    ledger.emit("dsh/session-disposed", { session: sessionId(session) });
    dirty = true;
    commitEvidence(config.repo).catch((e) => log.warn(`evidence: commit failed: ${e}`));
  }) as never);

  ctx.effect(() => {
    const timer = setInterval(() => {
      if (!dirty) return;
      dirty = false;
      commitEvidence(config.repo).catch((e) => log.warn(`evidence: commit failed: ${e}`));
    }, 60_000);
    return () => clearInterval(timer);
  });

  const v = ledger.verify();
  log.info(`evidence: ledger ${v.ok ? `intact (${v.count} rows)` : `BROKEN: ${v.reason}`}`);
}
