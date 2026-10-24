import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { PLAN_SYSTEM_PROMPT, buildMubitRequest, mubitRequestId } from "@/lib/llm/mubit";

const PLAN_3_FINGERPRINT = "003d496087a04fa8562f55e3486104ceb71df4976e9aa072644e43eea4fea6c3";

describe("plan 3 task fingerprint", () => {
  it("keeps the frozen system prompt byte-for-byte", () => {
    expect(createHash("sha256").update(PLAN_SYSTEM_PROMPT).digest("hex")).toBe(PLAN_3_FINGERPRINT);
  });

  it("keeps model and output format, which also define the Mubit task", () => {
    const { body } = buildMubitRequest({ purpose: "plan", userContent: "{}", recordForTraining: true });
    expect(body.model).toBe("gpt-6-luna");
    expect(body.response_format).toEqual({ type: "json_object" });
    expect(body.messages[0]).toEqual({ role: "system", content: PLAN_SYSTEM_PROMPT });
  });
});

describe("buildMubitRequest", () => {
  it("sends the session as metadata.session_id", () => {
    const { body } = buildMubitRequest({
      purpose: "plan",
      userContent: "{}",
      recordForTraining: true,
      sessionId: "scan_123",
    });
    expect(body.metadata).toEqual({ session_id: "scan_123" });
  });

  it("omits metadata when there is no session", () => {
    const { body } = buildMubitRequest({ purpose: "plan", userContent: "{}", recordForTraining: true });
    expect(body).not.toHaveProperty("metadata");
  });

  it("stores by default and sends x-middleware-store: false only when not training", () => {
    expect(
      buildMubitRequest({ purpose: "plan", userContent: "{}", recordForTraining: true }).headers,
    ).toEqual({});
    expect(
      buildMubitRequest({ purpose: "heldout_eval", userContent: "{}", recordForTraining: false }).headers,
    ).toEqual({ "x-middleware-store": "false" });
  });
});

describe("mubitRequestId", () => {
  it("prefers the Mubit request header", () => {
    const headers = new Headers({ "x-middleware-request-id": "mreq_1", "x-request-id": "req_2" });
    expect(mubitRequestId(headers)).toBe("mreq_1");
  });

  it("falls back to x-request-id, then null", () => {
    expect(mubitRequestId(new Headers({ "x-request-id": "req_2" }))).toBe("req_2");
    expect(mubitRequestId(new Headers())).toBeNull();
  });
});
