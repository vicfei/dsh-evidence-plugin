import { mkdtempSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { EvidenceLedger, GENESIS } from "../src/ledger.ts";
import { toTransition } from "../src/entry.ts";

let dir: string;
beforeEach(() => (dir = mkdtempSync(join(tmpdir(), "evidence-"))));
afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe("EvidenceLedger", () => {
  it("chains rows and verifies clean", () => {
    const l = new EvidenceLedger(dir);
    l.emit("engine.boot", { pid: 1 });
    l.emit("session/event", { type: "assistant/message" });
    const v = l.verify();
    expect(v).toEqual({ ok: true, count: 2 });
    expect(l.head()).not.toBe(GENESIS);
  });

  it("detects a row edited after the fact", () => {
    const l = new EvidenceLedger(dir);
    l.emit("a", {});
    l.emit("b", {});
    const file = join(dir, "evidence", "ledger.jsonl");
    const rows = readFileSync(file, "utf8").split("\n").filter(Boolean).map((r) => JSON.parse(r));
    rows[0].payload = '{"forged":true}';
    writeFileSync(file, rows.map((r) => JSON.stringify(r)).join("\n") + "\n");
    const v = l.verify();
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.reason).toContain("row 1");
  });

  it("detects tail truncation via the head anchor", () => {
    const l = new EvidenceLedger(dir);
    l.emit("a", {});
    l.emit("b", {});
    const file = join(dir, "evidence", "ledger.jsonl");
    const rows = readFileSync(file, "utf8").split("\n").filter(Boolean);
    writeFileSync(file, rows[0] + "\n"); // chop the last row, leave the anchor
    const v = l.verify();
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.reason).toContain("truncated");
  });

  it("empty ledger with a stale anchor is flagged", () => {
    const l = new EvidenceLedger(dir);
    l.emit("a", {});
    writeFileSync(join(dir, "evidence", "ledger.jsonl"), "");
    const v = l.verify();
    expect(v.ok).toBe(false);
  });

  it("toTransition strips the event type and prefixes the kind", () => {
    const t = toTransition({ type: "assistant/message", foo: 1 });
    expect(t).toEqual({ kind: "dsh/assistant/message", payload: { foo: 1 } });
    expect(toTransition({})).toBeNull();
  });
});
