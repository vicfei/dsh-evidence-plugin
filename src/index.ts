// dsh-evidence-plugin — the evidence ledger from dsh-super-agent, inside DeepSeek Harness.
// Every session transition lands in a hash-chained, append-only ledger in YOUR git repo:
// tamper-evident by construction.
//
// This module is the CORDIS ADAPTER: it translates the harness's session/event stream into
// normalized EvidenceEvents and feeds EvidenceCore (v0.3 P1 EventSource seam). The engine
// lives in core.ts and knows nothing about Cordis — the same seam carries the OAR adapter
// (src/adapters/oar.ts).
//
// Contract (verified against dsh-loopx-plugin's observer):
//   ctx.on('session/created' | 'session/event' | 'session/disposed', ...)
//   'session/event' receives (session, event) — the event is the SECOND argument.

import type { Context } from "@deepseek-ai/cordis";
import Schema from "@deepseek-ai/schemastery";
import { EvidenceCore } from "./core.js";

export const name = "dsh-evidence-plugin";

export const inject: readonly string[] = [];

export const Config = Schema.object({
  repo: Schema.string().default("").description("absolute path to the evidence git repo (empty = disabled)"),
});

export interface Config {
  repo: string;
}

export function apply(ctx: Context, config: Config): void {
  const log = ctx.logger;
  if (!config.repo) {
    log.warn("evidence: config.repo empty — ledger disabled");
    return;
  }
  const core = new EvidenceCore({ repo: config.repo, log: { info: (m) => log.info(`evidence: ${m}`), warn: (m) => log.warn(`evidence: ${m}`) } });

  ctx.on("session/created" as never, ((session: unknown) => {
    core.handle({ sessionId: String((session as { id?: unknown })?.id ?? "unknown"), phase: "created" });
  }) as never);

  ctx.on("session/event" as never, ((session: unknown, event: { type?: unknown }) => {
    core.handle({
      sessionId: String((session as { id?: unknown })?.id ?? "unknown"),
      phase: "event",
      type: String(event?.type ?? ""),
      data: (event ?? {}) as Record<string, unknown>,
    });
  }) as never);

  ctx.on("session/disposed" as never, ((session: unknown) => {
    core.handle({ sessionId: String((session as { id?: unknown })?.id ?? "unknown"), phase: "disposed" }); // flushes
  }) as never);

  ctx.effect(() => {
    // the core owns its dirty-flush timer; the harness lifecycle owns its teardown
    return () => core.close();
  });
}
