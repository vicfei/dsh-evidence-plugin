// Event → ledger transition mapping. The ONE seam to verify against the generated Cordis
// catalog of @deepseek-ai/dsh (`session/event` + `agent/*` exact signatures).
export function toTransition(ev) {
    const type = String(ev.type ?? ev.event ?? "");
    if (!type)
        return null;
    const { type: _t, event: _e, ...rest } = ev;
    return { kind: `dsh/${type}`, payload: rest };
}
//# sourceMappingURL=entry.js.map