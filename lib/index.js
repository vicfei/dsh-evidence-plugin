// dsh-evidence-plugin — the evidence ledger from dsh-super-agent, inside DeepSeek Harness.
// Every session transition lands in a hash-chained, append-only ledger in YOUR git repo:
// tamper-evident by construction.
//
// Contract (verified against dsh-loopx-plugin's observer):
//   ctx.on('session/created' | 'session/event' | 'session/disposed', ...)
//   'session/event' receives (session, event) — the event is the SECOND argument.
import Schema from "@deepseek-ai/schemastery";
import { EvidenceLedger } from "./ledger.js";
import { toTransition } from "./entry.js";
import { commitEvidence } from "./git.js";
export const name = "dsh-evidence-plugin";
export const inject = [];
export const Config = Schema.object({
    repo: Schema.string().default("").description("absolute path to the evidence git repo (empty = disabled)"),
});
export function apply(ctx, config) {
    const log = ctx.logger;
    if (!config.repo) {
        log.warn("evidence: config.repo empty — ledger disabled");
        return;
    }
    const ledger = new EvidenceLedger(config.repo);
    const sessionId = (s) => String(s?.id ?? "unknown");
    let dirty = false;
    ctx.on("session/created", ((session) => {
        ledger.emit("dsh/session-created", { session: sessionId(session) });
        dirty = true;
    }));
    ctx.on("session/event", ((session, event) => {
        const t = toTransition(event);
        if (!t)
            return;
        ledger.emit(t.kind, { session: sessionId(session), ...t.payload });
        dirty = true;
    }));
    ctx.on("session/disposed", ((session) => {
        ledger.emit("dsh/session-disposed", { session: sessionId(session) });
        dirty = true;
        commitEvidence(config.repo).catch((e) => log.warn(`evidence: commit failed: ${e}`));
    }));
    ctx.effect(() => {
        const timer = setInterval(() => {
            if (!dirty)
                return;
            dirty = false;
            commitEvidence(config.repo).catch((e) => log.warn(`evidence: commit failed: ${e}`));
        }, 60_000);
        return () => clearInterval(timer);
    });
    const v = ledger.verify();
    log.info(`evidence: ledger ${v.ok ? `intact (${v.count} rows)` : `BROKEN: ${v.reason}`}`);
}
//# sourceMappingURL=index.js.map