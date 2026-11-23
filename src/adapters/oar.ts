// OAR adapter (v0.3 P1) — Open Agent Runtime (botiverse/oar) feeding the same EvidenceCore.
// Zero-dependency: the host owns the OAR session and hands it in duck-typed. Mapping uses
// the same event vocabulary as the agentdiary OAR adapter (probed against record-stream.md),
// so both plugins speak identical event names across harnesses.

import type { EvidenceCore } from "../core.js";

export interface OarEvent {
  seq?: number;
  agentPath?: unknown;
  kind?: string;
  text?: string;
  tool?: string;
  outcome?: string;
  [key: string]: unknown;
}

export interface OarSessionLike {
  events(callback: (ev: OarEvent) => void): unknown;
}

export interface AttachOarOptions {
  sessionId?: string;
}

const LIFECYCLE = new Set(["released", "disposed", "runtime_exited"]);

/** Attach an OAR session to an EvidenceCore. Returns an unsubscribe handle. */
export function attachOar(session: OarSessionLike, core: EvidenceCore, opts: AttachOarOptions = {}): () => void {
  const sessionId = opts.sessionId ?? "oar-session";
  core.handle({ sessionId, phase: "created" });
  session.events((ev: OarEvent) => {
    const kind = String(ev.kind ?? "");
    if (LIFECYCLE.has(kind)) {
      core.handle({ sessionId, phase: "disposed" });
      return;
    }
    const data: Record<string, unknown> = { kind, ...(ev.tool ? { tool: ev.tool } : {}), ...(ev.text ? { text: ev.text } : {}), ...(ev.outcome ? { outcome: ev.outcome } : {}) };
    core.handle({ sessionId, phase: "event", type: kind || "unknown", data });
  });
  return () => core.handle({ sessionId, phase: "disposed" });
}
