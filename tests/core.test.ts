// EvidenceCore + OAR adapter (v0.3 P1): the harness-agnostic seam — Cordis and OAR feed
// the same ledger; transitions, dirty-flush commits and verify integrity all preserved.

import { execSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EvidenceCore } from "../src/core.js";
import { attachOar } from "../src/adapters/oar.js";

let repo: string;
beforeEach(() => {
  repo = mkdtempSync(join(tmpdir(), "dsh-evcore-"));
  execSync("git init -q .", { cwd: repo });
  execSync('git -c user.email=t@t -c user.name=t commit --allow-empty -m init -q', { cwd: repo });
});

describe("EvidenceCore (direct feed)", () => {
  it("created/event/disposed land as hash-chained transitions; verify stays intact", () => {
    const core = new EvidenceCore({ repo, flushMs: 999_999 }); // no background noise
    core.handle({ sessionId: "s1", phase: "created" });
    core.handle({ sessionId: "s1", phase: "event", type: "tool/call", data: { name: "bash" } });
    core.handle({ sessionId: "s1", phase: "disposed" });
    const v = core.verify();
    expect(v.ok).toBe(true);
    expect(v.count).toBeGreaterThanOrEqual(3); // created + event + disposed (+ genesis-era rows)
  });
  it("disposed flushes: the commit lands without the host calling flush()", () => {
    const log = { info: vi.fn(), warn: vi.fn() };
    const core = new EvidenceCore({ repo, log, flushMs: 999_999 });
    core.handle({ sessionId: "s1", phase: "created" });
    core.handle({ sessionId: "s1", phase: "disposed" });
    expect(log.warn).not.toHaveBeenCalled();
    const lastCommit = execSync("git log -1 --format=%s", { cwd: repo }).toString().trim();
    expect(lastCommit).toContain("evidence:"); // the flush landed as a commit
  });
  it("the OAR adapter maps the record stream into the same ledger vocabulary", () => {
    const core = new EvidenceCore({ repo, flushMs: 999_999 });
    const events = [
      { kind: "tool_call_started", tool: "read_file" },
      { kind: "text_delta", text: "working" },
      { kind: "released" },
    ];
    attachOar({ events: (cb) => events.forEach(cb) }, core, { sessionId: "oar-1" });
    const v = core.verify();
    expect(v.ok).toBe(true);
    const body = readFileSync(join(repo, "evidence", "ledger.jsonl"), "utf8");
    expect(body).toContain("dsh/session-created");
    expect(body).toContain("dsh/tool_call_started");
    expect(body).toContain("dsh/session-disposed"); // released → the teardown transition
  });
});
