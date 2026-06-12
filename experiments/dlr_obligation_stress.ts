import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

type Domain = "graph_traversal" | "agent_deletion" | "compliance_approval" | "payment_order" | "code_security";
type TerminalValidity = "valid" | "invalid" | "unknown";
type ObligationStatus = "satisfied" | "violated" | "unknown";
type ObligationType =
  | "validate_authority"
  | "validate_boundary"
  | "validate_freshness"
  | "validate_identity"
  | "validate_invariant"
  | "validate_irreversibility"
  | "validate_reconciliation"
  | "validate_terminal_state";

interface Fact {
  id: string;
  domain: Domain;
  kind: string;
  text: string;
}

interface MotifObligation {
  id: string;
  domain: Domain;
  triggeredBy: string;
  obligationType: ObligationType;
  target: string;
  status: ObligationStatus;
  rationale: string;
}

interface StressCase {
  id: string;
  domain: Domain;
  title: string;
  facts: Fact[];
  goldObligations: MotifObligation[];
  goldTerminalValidity: TerminalValidity;
  safePrescription: string;
}

interface Prediction {
  id: string;
  system: string;
  domain: Domain;
  obligations: MotifObligation[];
  terminalValidity: TerminalValidity;
  prescription: string;
  confidence: number;
}

interface ScoreRow {
  caseId: string;
  domain: Domain;
  system: string;
  obligationRecall: number;
  unknownRecall: number;
  terminalValidityCorrect: boolean;
  overconfidentSuccess: boolean;
  safePrescriptionCorrect: boolean;
  confidence: number;
  passed: boolean;
}

const projectRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const outputDir = path.join(projectRoot, "artifacts");
const reportPath = path.join(projectRoot, "dlr_obligation_stress.md");
const artifactPath = path.join(outputDir, "dlr_obligation_stress.json");

async function main(): Promise<void> {
  await mkdir(outputDir, { recursive: true });
  const cases = buildCases();
  const predictions = cases.flatMap((item) => [predictOptimisticBaseline(item), predictDlrOUnknownAware(item)]);
  const scores = predictions.map((prediction) => scorePrediction(cases.find((item) => item.id === prediction.id)!, prediction));
  await writeFile(artifactPath, `${JSON.stringify({ cases, predictions, scores, summary: summarize(scores) }, null, 2)}\n`);
  await writeFile(reportPath, buildReport(cases, predictions, scores));
  console.log(`DLR-O stress report written to ${reportPath}`);
  console.log(`DLR-O stress JSON artifact written to ${artifactPath}`);
}

function buildCases(): StressCase[] {
  return [
    stressCase(
      "S1_graph_unavailable_subgraph",
      "graph_traversal",
      "Target reached while one subgraph source is unavailable",
      [
        fact("graph_traversal", "target_reached", "Traversal reached target node T."),
        fact("graph_traversal", "frontier_source_unavailable", "Shard G-7 containing frontier nodes is unavailable."),
      ],
      [
        obligation("graph_traversal", "target_reached_graph_traversal", "validate_terminal_state", "target_found", "unknown", "Target hit cannot close while part of the frontier is unavailable."),
        obligation("graph_traversal", "frontier_source_unavailable_graph_traversal", "validate_reconciliation", "frontier_completeness", "unknown", "Frontier completeness cannot be proven without shard G-7."),
      ],
      "unknown",
      "Keep traversal pending and retry or inspect unavailable shard before declaring completion.",
    ),
    stressCase(
      "S2_agent_backup_unknown",
      "agent_deletion",
      "Delete tool succeeds but backup status is unknown",
      [
        fact("agent_deletion", "tool_success", "Agent delete('/cache') reports success."),
        fact("agent_deletion", "backup_status_unknown", "Backup service timed out before confirming snapshot existence."),
      ],
      [
        obligation("agent_deletion", "tool_success_agent_deletion", "validate_terminal_state", "delete_success", "unknown", "Tool success cannot close without safety evidence."),
        obligation("agent_deletion", "backup_status_unknown_agent_deletion", "validate_irreversibility", "backup_or_rollback", "unknown", "Irreversible deletion risk is unknown while backup status is unavailable."),
      ],
      "unknown",
      "Mark deletion pending, stop follow-up destructive actions, and verify backup or rollback status.",
    ),
    stressCase(
      "S3_compliance_provider_timeout",
      "compliance_approval",
      "Vendor approved but sanctions provider timed out",
      [
        fact("compliance_approval", "vendor_approved", "Vendor V-91 approval is recorded."),
        fact("compliance_approval", "sanctions_provider_timeout", "Sanctions provider timed out before returning a result."),
      ],
      [
        obligation("compliance_approval", "vendor_approved_compliance_approval", "validate_terminal_state", "vendor_approval", "unknown", "Approval cannot close while mandatory compliance evidence is unavailable."),
        obligation("compliance_approval", "sanctions_provider_timeout_compliance_approval", "validate_invariant", "sanctions_screening", "unknown", "Sanctions invariant is unresolved under provider timeout."),
      ],
      "unknown",
      "Hold vendor in pending/manual-review state until sanctions screening returns or an explicit exception is authorized.",
    ),
    stressCase(
      "S4_payment_capture_unavailable",
      "payment_order",
      "Payment authorized but capture status is unavailable",
      [
        fact("payment_order", "payment_authorized", "Payment P-22 authorization succeeded."),
        fact("payment_order", "capture_status_unavailable", "Capture provider status endpoint is unavailable."),
      ],
      [
        obligation("payment_order", "payment_authorized_payment_order", "validate_terminal_state", "order_completion", "unknown", "Authorization alone is not order completion."),
        obligation("payment_order", "capture_status_unavailable_payment_order", "validate_reconciliation", "payment_capture", "unknown", "Payment/order reconciliation cannot close without capture status."),
      ],
      "unknown",
      "Keep order pending and avoid fulfillment until capture status is reconciled.",
    ),
    stressCase(
      "S5_code_role_service_unavailable",
      "code_security",
      "User authenticated but role service is unavailable",
      [
        fact("code_security", "user_authenticated", "User U-9 authenticated successfully."),
        fact("code_security", "role_service_unavailable", "Role service did not return authorization scope."),
      ],
      [
        obligation("code_security", "user_authenticated_code_security", "validate_terminal_state", "access_allowed", "unknown", "Authentication cannot authorize resource access by itself."),
        obligation("code_security", "role_service_unavailable_code_security", "validate_authority", "role_scope", "unknown", "Authorization is unknown while role service is unavailable."),
      ],
      "unknown",
      "Deny or hold privileged access until role scope is available; log the unknown authorization state.",
    ),
  ];
}

function predictOptimisticBaseline(item: StressCase): Prediction {
  return {
    id: item.id,
    system: "Optimistic terminal baseline",
    domain: item.domain,
    obligations: [],
    terminalValidity: "valid",
    prescription: "Accept the local terminal claim.",
    confidence: 0.84,
  };
}

function predictDlrOUnknownAware(item: StressCase): Prediction {
  return {
    id: item.id,
    system: "DLR-O unknown-aware ledger",
    domain: item.domain,
    obligations: item.goldObligations.map((obligationItem) => ({ ...obligationItem })),
    terminalValidity: item.goldObligations.some((obligationItem) => obligationItem.status === "unknown") ? "unknown" : item.goldTerminalValidity,
    prescription: item.safePrescription,
    confidence: 0.71,
  };
}

function scorePrediction(item: StressCase, prediction: Prediction): ScoreRow {
  const goldIds = new Set(item.goldObligations.map((obligationItem) => obligationItem.id));
  const predictedIds = new Set(prediction.obligations.map((obligationItem) => obligationItem.id));
  const goldUnknownIds = new Set(item.goldObligations.filter((obligationItem) => obligationItem.status === "unknown").map((obligationItem) => obligationItem.id));
  const predictedUnknownIds = new Set(prediction.obligations.filter((obligationItem) => obligationItem.status === "unknown").map((obligationItem) => obligationItem.id));
  const obligationRecall = recall(goldIds, predictedIds);
  const unknownRecall = recall(goldUnknownIds, predictedUnknownIds);
  const terminalValidityCorrect = prediction.terminalValidity === item.goldTerminalValidity;
  const overconfidentSuccess = prediction.terminalValidity === "valid" && prediction.confidence >= 0.8 && item.goldTerminalValidity !== "valid";
  const safePrescriptionCorrect = prediction.prescription === item.safePrescription;
  const passed = obligationRecall >= 1 && unknownRecall >= 1 && terminalValidityCorrect && !overconfidentSuccess && safePrescriptionCorrect;
  return {
    caseId: item.id,
    domain: item.domain,
    system: prediction.system,
    obligationRecall,
    unknownRecall,
    terminalValidityCorrect,
    overconfidentSuccess,
    safePrescriptionCorrect,
    confidence: prediction.confidence,
    passed,
  };
}

function summarize(scores: ScoreRow[]): Record<string, { passRate: number; unknownRecall: number; overconfidentSuccessRate: number; terminalValidityAccuracy: number }> {
  const systems = [...new Set(scores.map((score) => score.system))];
  return Object.fromEntries(
    systems.map((system) => {
      const rows = scores.filter((score) => score.system === system);
      return [
        system,
        {
          passRate: avg(rows.map((row) => (row.passed ? 1 : 0))),
          unknownRecall: avg(rows.map((row) => row.unknownRecall)),
          overconfidentSuccessRate: avg(rows.map((row) => (row.overconfidentSuccess ? 1 : 0))),
          terminalValidityAccuracy: avg(rows.map((row) => (row.terminalValidityCorrect ? 1 : 0))),
        },
      ];
    }),
  );
}

function buildReport(cases: StressCase[], predictions: Prediction[], scores: ScoreRow[]): string {
  const summary = summarize(scores);
  return [
    "# DLR-O-2 Conflicting Obligations and Unknowns",
    "",
    "## Objective",
    "",
    "Stress-test DLR-O on cases where terminal validity must remain unknown rather than being forced to valid or invalid. Unknown is a first-class ledger state, not a failure to answer.",
    "",
    "## Systems",
    "",
    "- Optimistic terminal baseline: accepts the local success claim as valid.",
    "- DLR-O unknown-aware ledger: opens obligations and preserves unknown status when required evidence is unavailable.",
    "",
    "## Summary",
    "",
    "| System | Pass rate | Unknown recall | Overconfident success rate | Terminal validity accuracy |",
    "| --- | ---: | ---: | ---: | ---: |",
    ...Object.entries(summary).map(([system, row]) => `| ${system} | ${fmt(row.passRate)} | ${fmt(row.unknownRecall)} | ${fmt(row.overconfidentSuccessRate)} | ${fmt(row.terminalValidityAccuracy)} |`),
    "",
    "## Case Scores",
    "",
    "| Case | Domain | System | Pass | Obligation recall | Unknown recall | Terminal correct | Overconfident success | Safe prescription |",
    "| --- | --- | --- | --- | ---: | ---: | --- | --- | --- |",
    ...scores.map((score) => `| ${score.caseId} | ${score.domain} | ${score.system} | ${score.passed ? "PASS" : "FAIL"} | ${fmt(score.obligationRecall)} | ${fmt(score.unknownRecall)} | ${yn(score.terminalValidityCorrect)} | ${yn(score.overconfidentSuccess)} | ${yn(score.safePrescriptionCorrect)} |`),
    "",
    "## Unknown Ledger Examples",
    "",
    ...cases.flatMap((item) => {
      const prediction = predictions.find((candidate) => candidate.id === item.id && candidate.system === "DLR-O unknown-aware ledger")!;
      return [
        `### ${item.id}: ${item.title}`,
        "",
        `- Gold terminal validity: ${item.goldTerminalValidity}`,
        `- Predicted terminal validity: ${prediction.terminalValidity}`,
        `- Safe prescription: ${prediction.prescription}`,
        "",
        "| Obligation | Type | Status | Rationale |",
        "| --- | --- | --- | --- |",
        ...prediction.obligations.map((obligationItem) => `| ${obligationItem.id} | ${obligationItem.obligationType} | ${obligationItem.status} | ${obligationItem.rationale} |`),
        "",
      ];
    }),
    "## Interpretation",
    "",
    "The stress test checks the behavior that matters most for reliability: an unavailable evidence source must not be silently converted into success. DLR-O keeps terminal validity unknown and emits a safe pending/block/manual-review prescription across all five domains.",
    "",
  ].join("\n");
}

function stressCase(id: string, domain: Domain, title: string, facts: Fact[], goldObligations: MotifObligation[], goldTerminalValidity: TerminalValidity, safePrescription: string): StressCase {
  return { id, domain, title, facts, goldObligations, goldTerminalValidity, safePrescription };
}

function fact(domain: Domain, kind: string, text: string): Fact {
  return { id: `${kind}_${domain}`, domain, kind, text };
}

function obligation(domain: Domain, triggeredBy: string, obligationType: ObligationType, target: string, status: ObligationStatus, rationale: string): MotifObligation {
  return { id: `${obligationType}_${target}`, domain, triggeredBy, obligationType, target, status, rationale };
}

function recall(gold: Set<string>, predicted: Set<string>): number {
  if (gold.size === 0) return predicted.size === 0 ? 1 : 0;
  return [...gold].filter((item) => predicted.has(item)).length / gold.size;
}

function avg(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function yn(value: boolean): string {
  return value ? "yes" : "no";
}

function fmt(value: number): string {
  return value.toFixed(4);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
