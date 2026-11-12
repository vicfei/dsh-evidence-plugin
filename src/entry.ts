// Event → ledger transition mapping. The ONE seam to verify against the generated Cordis
// catalog of @deepseek-ai/dsh (`session/event` + `agent/*` exact signatures).

export interface Transition {
  kind: string;
  payload: Record<string, unknown>;
}

export function toTransition(ev: Record<string, unknown>): Transition | null {
  const type = String(ev.type ?? ev.event ?? "");
  if (!type) return null;
  const { type: _t, event: _e, ...rest } = ev;
  return { kind: `dsh/${type}`, payload: rest };
}
