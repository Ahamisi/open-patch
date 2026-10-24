import { z } from "zod";

export const evidenceKindSchema = z.enum([
  "manifest",
  "runtime_config",
  "source",
  "ci",
  "test",
  "advisory",
  "other",
]);

export const confidenceSchema = z.enum(["confirmed", "inferred", "missing"]);

export const repositoryEvidenceSchema = z.object({
  id: z.string(),
  path: z.string(),
  kind: evidenceKindSchema,
  excerpt: z.string(),
  sha256: z.string(),
  sourceLabel: z.string(),
  confidence: confidenceSchema,
  collectedAt: z.string(),
});

export const checkResultSchema = z.object({
  name: z.string(),
  status: z.enum(["pass", "fail", "not_run", "error"]),
  details: z.string(),
  exitCode: z.number().optional(),
  command: z.string().optional(),
  output: z.string().optional(),
});

export const exposureStatusSchema = z.enum([
  "affected",
  "not_affected",
  "unknown",
]);

export const exposureAssessmentSchema = z.object({
  status: exposureStatusSchema,
  component: z.string(),
  detectedVersion: z.string().nullable(),
  affectedRange: z.string().nullable(),
  reason: z.string(),
  evidenceIds: z.array(z.string()),
  checks: z.array(checkResultSchema),
  limitations: z.array(z.string()),
});

export const actionTypeSchema = z.enum([
  "runtime_upgrade",
  "dependency_upgrade",
  "code_change",
  "config_change",
  "investigate",
]);

export const remediationActionSchema = z.object({
  id: z.string(),
  type: actionTypeSchema,
  priority: z.enum(["high", "medium", "low"]),
  description: z.string(),
  files: z.array(z.string()),
  evidenceIds: z.array(z.string()),
  risk: z.string(),
  rollback: z.string(),
});

export const remediationPlanSchema = z.object({
  summary: z.string(),
  actions: z.array(remediationActionSchema).min(1),
  verificationSteps: z.array(z.string()),
  missingInformation: z.array(z.string()).default([]),
  humanApprovalRequired: z
    .union([z.literal(true), z.boolean()])
    .optional()
    .transform(() => true as const),
});

export const saplingLabelSchema = z.enum([
  "supported",
  "violation",
  "insufficient_information",
  "inconsistent_context",
]);

export const saplingStatusSchema = z.union([
  saplingLabelSchema,
  z.literal("unsure"),
]);

export const saplingResponseSchema = z
  .object({
    model: z.string().optional(),
    release_stage: z.string().optional(),
    source_release_sha256: z.string().optional(),
    weights_sha256: z.string().optional(),
    logits: z.array(z.number()).optional(),
    conformal_prediction_set: z.array(z.string()).optional(),
    prediction_set: z.array(z.string()).optional(),
    status: z.string().optional(),
    raw_label: z.string().optional(),
    fallback_used: z.boolean().optional(),
    fallback_reason: z.string().nullable().optional(),
    status_provenance: z.string().optional(),
    empty_set_policy: z.string().optional(),
    conformal_singleton: z.boolean().optional(),
    probabilities: z.record(z.number()).optional(),
    usage: z
      .object({
        input_tokens: z.number().optional(),
        generated_tokens: z.number().optional(),
      })
      .optional(),
    timing_ms: z
      .object({
        model: z.number().optional(),
      })
      .passthrough()
      .optional(),
    error: z.string().optional(),
  })
  .passthrough();

export const verificationStatusSchema = z.enum([
  "verified",
  "contradicted",
  "uncertain",
  "unavailable",
]);

export const verificationRecordSchema = z.object({
  claim: z.string(),
  policy: z.string(),
  evidenceText: z.string().optional(),
  evidenceIds: z.array(z.string()),
  saplingRawResponse: z.unknown().nullable(),
  saplingVerdict: z.string().nullable(),
  saplingScores: z.unknown().nullable(),
  verificationStatus: verificationStatusSchema,
  deterministicChecks: z.array(checkResultSchema),
  humanReviewStatus: z
    .enum(["pending", "correct", "incorrect", "needs_more_evidence"])
    .default("pending"),
  limitations: z.array(z.string()),
});

export const reviewerLabelSchema = z.enum([
  "correct",
  "incorrect",
  "needs_more_evidence",
]);

export const correctionRecordSchema = z.object({
  id: z.string(),
  runId: z.string(),
  scanId: z.string(),
  taskName: z.string(),
  originalOutput: z.unknown(),
  reviewerLabel: reviewerLabelSchema,
  correctedOutput: z.string(),
  evidenceIds: z.array(z.string()),
  policyVersion: z.string(),
  mubitRequestId: z.string().nullable(),
  createdAt: z.string(),
});

export type RepositoryEvidence = z.infer<typeof repositoryEvidenceSchema>;
export type ExposureAssessment = z.infer<typeof exposureAssessmentSchema>;
export type RemediationPlan = z.infer<typeof remediationPlanSchema>;
export type CheckResult = z.infer<typeof checkResultSchema>;
export type VerificationRecord = z.infer<typeof verificationRecordSchema>;
export type CorrectionRecord = z.infer<typeof correctionRecordSchema>;
export type SaplingResponse = z.infer<typeof saplingResponseSchema>;
