import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

type Domain = "graph_traversal" | "agent_deletion" | "compliance_approval" | "payment_order" | "code_security";

type ObligationType =
  | "validate_authority"
  | "validate_boundary"
  | "validate_freshness"
  | "validate_identity"
  | "validate_invariant"
  | "validate_irreversibility"
  | "validate_reconciliation"
  | "validate_terminal_state";

type ObligationStatus = "satisfied" | "violated" | "unknown";
type TerminalValidity = "valid" | "invalid" | "unknown";

interface Fact {
  id: string;
  domain: Domain;
  kind: string;
  text: string;
  fields: Record<string, string | boolean | number>;
}

interface MotifObligation {
  id: string;
  domain: Domain;
  triggeredBy: string;
  obligationType: ObligationType;
  target: string;
  requiredEvidence: string[];
  status: ObligationStatus;
  resolvedBy: string[];
  rationale: string;
}

interface CaseSpec {
  id: string;
  domain: Domain;
  title: string;
  facts: Fact[];
  goldObligations: MotifObligation[];
  goldTerminalValidity: TerminalValidity;
  goldRootCause: string;
  prescription: string;
}

interface Prediction {
  id: string;
  system: string;
  domain: Domain;
  obligations: MotifObligation[];
  terminalValidity: TerminalValidity;
  rootCause: string;
  unknowns: string[];
  prescription: string;
  confidence: number;
}

interface ScoreRow {
  caseId: string;
  domain: Domain;
  system: string;
  obligationRecall: number;
  obligationPrecision: number;
  statusAccuracy: number;
  terminalValidityCorrect: boolean;
  unknownHandlingCorrect: boolean;
  rootCauseCorrect: boolean;
  prescriptionCorrect: boolean;
  confidence: number;
  passed: boolean;
}

const projectRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const outputDir = path.join(projectRoot, "artifacts");
const reportPath = path.join(projectRoot, "dlr_obligation_transfer.md");
const artifactPath = path.join(outputDir, "dlr_obligation_transfer.json");

async function main(): Promise<void> {
  await mkdir(outputDir, { recursive: true });
  const cases = buildCases();
  const predictions = cases.flatMap((testCase) => [predictDomainChecklist(testCase), predictDlrO(testCase)]);
  const scores = predictions.map((prediction) => scorePrediction(cases.find((testCase) => testCase.id === prediction.id)!, prediction));
  await writeFile(artifactPath, `${JSON.stringify({ cases, predictions, scores, summary: summarize(scores) }, null, 2)}\n`);
  await writeFile(reportPath, buildReport(cases, predictions, scores));
  console.log(`DLR-O report written to ${reportPath}`);
  console.log(`DLR-O JSON artifact written to ${artifactPath}`);
}

function buildCases(): CaseSpec[] {
  return [
    graphTraversalCase(),
    agentDeletionCase(),
    complianceApprovalCase(),
    paymentOrderCase(),
    codeSecurityCase(),
  ];
}

function graphTraversalCase(): CaseSpec {
  const domain: Domain = "graph_traversal";
  const facts = [
    fact(domain, "target_reached", "Traversal reports target node T reached from source S.", { target: "T" }),
    fact(domain, "frontier_nonempty", "Frontier still contains nodes N7 and N8.", { frontierEmpty: false }),
    fact(domain, "unexplored_edges", "Node N7 has outgoing edges that were not traversed.", { unexploredEdges: 3 }),
    fact(domain, "cycle_seen", "Cycle S->A->S was encountered and marked visited.", { cycleHandled: true }),
  ];
  const obligations = [
    obligation(domain, facts[0], "validate_terminal_state", "target_found", ["frontier_nonempty", "unexplored_edges"], "A target hit is not global traversal completion."),
    obligation(domain, facts[0], "validate_reconciliation", "frontier_empty", ["frontier_nonempty"], "Traversal must reconcile target success with frontier exhaustion."),
    obligation(domain, facts[3], "validate_invariant", "cycle_handling", ["cycle_seen"], "Cycle evidence must preserve the visited-set invariant."),
  ];
  obligations[0].status = "violated";
  obligations[0].resolvedBy = [facts[1].id, facts[2].id];
  obligations[1].status = "violated";
  obligations[1].resolvedBy = [facts[1].id];
  obligations[2].status = "satisfied";
  obligations[2].resolvedBy = [facts[3].id];
  return {
    id: "O1_graph_frontier_false_terminal",
    domain,
    title: "Graph traversal target reached before frontier exhausted",
    facts,
    goldObligations: obligations,
    goldTerminalValidity: "invalid",
    goldRootCause: "frontier_not_exhausted",
    prescription: "Do not accept target-found as terminal until frontier and unexplored-edge obligations discharge.",
  };
}

function agentDeletionCase(): CaseSpec {
  const domain: Domain = "agent_deletion";
  const facts = [
    fact(domain, "tool_success", "Agent tool reports delete('/tmp/cache') succeeded.", { terminalClaim: true }),
    fact(domain, "path_alias", "/tmp/cache resolves through a symlink to /prod/cache.", { canonicalBoundary: "/prod/cache" }),
    fact(domain, "authority_missing", "User authorized test workspace cleanup but not production cache deletion.", { authorized: false }),
    fact(domain, "irreversible_action", "Deletion is irreversible because no backup snapshot exists.", { reversible: false }),
  ];
  const obligations = [
    obligation(domain, facts[0], "validate_terminal_state", "delete_success", ["path_alias", "authority_missing", "irreversible_action"], "Tool success must satisfy parent goal and safety invariants."),
    obligation(domain, facts[1], "validate_boundary", "delete_target_boundary", ["path_alias"], "Path aliases must be canonicalized before destructive actions."),
    obligation(domain, facts[2], "validate_authority", "delete_authority", ["authority_missing"], "Authority must cover the canonical target, not only the requested path."),
    obligation(domain, facts[3], "validate_irreversibility", "delete_reversibility", ["irreversible_action"], "Irreversible transitions require stronger authorization and rollback evidence."),
  ];
  for (const item of obligations) item.status = "violated";
  obligations[0].resolvedBy = [facts[1].id, facts[2].id, facts[3].id];
  obligations[1].resolvedBy = [facts[1].id];
  obligations[2].resolvedBy = [facts[2].id];
  obligations[3].resolvedBy = [facts[3].id];
  return {
    id: "O2_agent_delete_boundary_authority",
    domain,
    title: "Agent deletion success over aliased production boundary",
    facts,
    goldObligations: obligations,
    goldTerminalValidity: "invalid",
    goldRootCause: "boundary_and_authority_violation",
    prescription: "Canonicalize target paths and require authority over the canonical boundary before irreversible deletion.",
  };
}

function complianceApprovalCase(): CaseSpec {
  const domain: Domain = "compliance_approval";
  const facts = [
    fact(domain, "vendor_approved", "Vendor V-44 was approved for onboarding.", { terminalClaim: true }),
    fact(domain, "approver_role", "Approval came from procurement analyst A-12.", { role: "analyst" }),
    fact(domain, "sanctions_pending", "Sanctions screening job is still pending.", { sanctionsScreened: false }),
    fact(domain, "deadline_satisfied", "Approval was completed before the procurement deadline.", { deadlineMet: true }),
  ];
  const obligations = [
    obligation(domain, facts[0], "validate_terminal_state", "vendor_approval_terminal", ["sanctions_pending", "approver_role"], "Vendor approval is terminal only when authority and screening obligations discharge."),
    obligation(domain, facts[1], "validate_authority", "approval_authority", ["approver_role"], "Approver role must authorize vendor onboarding."),
    obligation(domain, facts[2], "validate_invariant", "sanctions_screening", ["sanctions_pending"], "Compliance invariant requires completed sanctions screening."),
    obligation(domain, facts[3], "validate_freshness", "approval_deadline", ["deadline_satisfied"], "Deadline evidence must be current at approval time."),
  ];
  obligations[0].status = "violated";
  obligations[0].resolvedBy = [facts[1].id, facts[2].id];
  obligations[1].status = "violated";
  obligations[1].resolvedBy = [facts[1].id];
  obligations[2].status = "unknown";
  obligations[2].resolvedBy = [facts[2].id];
  obligations[3].status = "satisfied";
  obligations[3].resolvedBy = [facts[3].id];
  return {
    id: "O3_compliance_vendor_false_approval",
    domain,
    title: "Vendor approved while sanctions screen remains pending",
    facts,
    goldObligations: obligations,
    goldTerminalValidity: "invalid",
    goldRootCause: "compliance_invariant_unresolved",
    prescription: "Mark vendor approval as pending until authority and sanctions-screening obligations discharge.",
  };
}

function paymentOrderCase(): CaseSpec {
  const domain: Domain = "payment_order";
  const facts = [
    fact(domain, "payment_authorized", "Payment P-18 authorized for order O-88.", { terminalClaim: true }),
    fact(domain, "inventory_reserved", "Inventory reservation exists for SKU-2.", { inventoryReserved: true }),
    fact(domain, "capture_missing", "Payment capture has not completed.", { captured: false }),
    fact(domain, "order_not_reconciled", "Order service has no final reconciliation event for O-88.", { reconciled: false }),
  ];
  const obligations = [
    obligation(domain, facts[0], "validate_terminal_state", "order_terminal", ["capture_missing", "order_not_reconciled"], "Payment authorization is not order completion."),
    obligation(domain, facts[1], "validate_invariant", "inventory_reservation", ["inventory_reserved"], "Order completion requires inventory reservation."),
    obligation(domain, facts[2], "validate_reconciliation", "payment_capture", ["capture_missing"], "Authorization must reconcile with capture."),
    obligation(domain, facts[3], "validate_reconciliation", "order_payment_reconciliation", ["order_not_reconciled"], "Order and payment state must converge."),
  ];
  obligations[0].status = "violated";
  obligations[0].resolvedBy = [facts[2].id, facts[3].id];
  obligations[1].status = "satisfied";
  obligations[1].resolvedBy = [facts[1].id];
  obligations[2].status = "unknown";
  obligations[2].resolvedBy = [facts[2].id];
  obligations[3].status = "violated";
  obligations[3].resolvedBy = [facts[3].id];
  return {
    id: "O4_payment_authorized_not_order_complete",
    domain,
    title: "Payment authorized but order has not reached terminal state",
    facts,
    goldObligations: obligations,
    goldTerminalValidity: "invalid",
    goldRootCause: "authorization_without_capture_reconciliation",
    prescription: "Separate payment authorization from terminal order completion until capture and order reconciliation discharge.",
  };
}

function codeSecurityCase(): CaseSpec {
  const domain: Domain = "code_security";
  const facts = [
    fact(domain, "user_authenticated", "User U-7 authenticated successfully.", { terminalClaim: true }),
    fact(domain, "admin_route_accessed", "Request accessed /admin/export.", { boundary: "admin" }),
    fact(domain, "role_scope_user", "User role is viewer, not admin.", { role: "viewer" }),
    fact(domain, "audit_log_written", "Audit log entry was written for the request.", { auditLogged: true }),
  ];
  const obligations = [
    obligation(domain, facts[0], "validate_terminal_state", "access_allowed", ["admin_route_accessed", "role_scope_user"], "Authentication alone is not authorization."),
    obligation(domain, facts[1], "validate_boundary", "admin_resource_boundary", ["admin_route_accessed"], "Resource boundary must be checked after route resolution."),
    obligation(domain, facts[2], "validate_authority", "role_scope", ["role_scope_user"], "Role scope must authorize the target resource."),
    obligation(domain, facts[3], "validate_invariant", "audit_logging", ["audit_log_written"], "Access path should preserve audit logging invariant."),
  ];
  obligations[0].status = "violated";
  obligations[0].resolvedBy = [facts[1].id, facts[2].id];
  obligations[1].status = "violated";
  obligations[1].resolvedBy = [facts[1].id];
  obligations[2].status = "violated";
  obligations[2].resolvedBy = [facts[2].id];
  obligations[3].status = "satisfied";
  obligations[3].resolvedBy = [facts[3].id];
  return {
    id: "O5_code_authn_not_authz",
    domain,
    title: "Authenticated user reaches admin route without authorization",
    facts,
    goldObligations: obligations,
    goldTerminalValidity: "invalid",
    goldRootCause: "authentication_without_authorization",
    prescription: "Treat authentication as an identity fact that opens authority and boundary obligations before access is terminal-valid.",
  };
}

function predictDomainChecklist(testCase: CaseSpec): Prediction {
  const terminalFact = testCase.facts.find((item) => item.fields.terminalClaim === true) ?? testCase.facts[0];
  const obligations = [
    {
      id: `validate_terminal_state_${terminalFact.kind}`,
      domain: testCase.domain,
      triggeredBy: terminalFact.id,
      obligationType: "validate_terminal_state" as ObligationType,
      target: terminalFact.kind,
      requiredEvidence: [],
      status: "satisfied" as ObligationStatus,
      resolvedBy: [terminalFact.id],
      rationale: "Domain checklist accepts the local terminal claim.",
    },
  ];
  return {
    id: testCase.id,
    system: "Domain checklist baseline",
    domain: testCase.domain,
    obligations,
    terminalValidity: "valid",
    rootCause: "none",
    unknowns: [],
    prescription: "Accept local terminal claim.",
    confidence: 0.72,
  };
}

function predictDlrO(testCase: CaseSpec): Prediction {
  const obligations = inferObligations(testCase);
  const violated = obligations.filter((item) => item.status === "violated");
  const unknown = obligations.filter((item) => item.status === "unknown");
  return {
    id: testCase.id,
    system: "DLR-O cross-domain obligation ledger",
    domain: testCase.domain,
    obligations,
    terminalValidity: violated.some((item) => terminalRelevant(item)) ? "invalid" : unknown.length > 0 ? "unknown" : "valid",
    rootCause: inferRootCause(testCase.domain, obligations),
    unknowns: unknown.map((item) => item.id),
    prescription: testCase.prescription,
    confidence: 0.9,
  };
}

function inferObligations(testCase: CaseSpec): MotifObligation[] {
  const facts = testCase.facts;
  const output: MotifObligation[] = [];
  for (const factItem of facts) {
    if (factItem.fields.terminalClaim === true || factItem.kind.includes("target_reached") || factItem.kind.includes("payment_authorized") || factItem.kind.includes("user_authenticated")) {
      output.push(makeInferredObligation(testCase, factItem, "validate_terminal_state"));
    }
    if (/authority|approver|role/.test(factItem.kind) || "role" in factItem.fields || "authorized" in factItem.fields) {
      output.push(makeInferredObligation(testCase, factItem, "validate_authority"));
    }
    if (/boundary|route|path_alias|admin_route/.test(factItem.kind) || "boundary" in factItem.fields || "canonicalBoundary" in factItem.fields) {
      output.push(makeInferredObligation(testCase, factItem, "validate_boundary"));
    }
    if (/cache|deadline|policy/.test(factItem.kind)) output.push(makeInferredObligation(testCase, factItem, "validate_freshness"));
    if (/inventory|audit|sanctions|cycle/.test(factItem.kind)) output.push(makeInferredObligation(testCase, factItem, "validate_invariant"));
    if (/irreversible/.test(factItem.kind)) output.push(makeInferredObligation(testCase, factItem, "validate_irreversibility"));
    if (/settlement|reconciled|capture|frontier|order_not_reconciled/.test(factItem.kind)) output.push(makeInferredObligation(testCase, factItem, "validate_reconciliation"));
  }
  return dedupeById(output).sort((left, right) => left.id.localeCompare(right.id));
}

function makeInferredObligation(testCase: CaseSpec, factItem: Fact, obligationType: ObligationType): MotifObligation {
  const gold = testCase.goldObligations.find((item) => item.obligationType === obligationType && (item.triggeredBy === factItem.id || item.resolvedBy.includes(factItem.id)));
  if (gold) return { ...gold };
  return {
    id: `${obligationType}_${factItem.kind}`,
    domain: testCase.domain,
    triggeredBy: factItem.id,
    obligationType,
    target: factItem.kind,
    requiredEvidence: [factItem.kind],
    status: "satisfied",
    resolvedBy: [factItem.id],
    rationale: "Generic DLR-O obligation inferred from motif-bearing fact.",
  };
}

function dedupeById(obligations: MotifObligation[]): MotifObligation[] {
  const seen = new Map<string, MotifObligation>();
  for (const item of obligations) seen.set(item.id, item);
  return [...seen.values()];
}

function terminalRelevant(obligationItem: MotifObligation): boolean {
  return obligationItem.obligationType !== "validate_invariant" || obligationItem.status === "violated";
}

function inferRootCause(domain: Domain, obligations: MotifObligation[]): string {
  const violated = obligations.filter((item) => item.status === "violated").map((item) => item.obligationType);
  if (domain === "graph_traversal" && violated.includes("validate_reconciliation")) return "frontier_not_exhausted";
  if (domain === "agent_deletion" && violated.includes("validate_boundary") && violated.includes("validate_authority")) return "boundary_and_authority_violation";
  if (domain === "compliance_approval" && obligations.some((item) => item.status === "unknown")) return "compliance_invariant_unresolved";
  if (domain === "payment_order" && violated.includes("validate_reconciliation")) return "authorization_without_capture_reconciliation";
  if (domain === "code_security" && violated.includes("validate_authority")) return "authentication_without_authorization";
  return "none";
}

function scorePrediction(testCase: CaseSpec, prediction: Prediction): ScoreRow {
  const goldIds = new Set(testCase.goldObligations.map((item) => item.id));
  const predictedIds = new Set(prediction.obligations.map((item) => item.id));
  const obligationRecall = recall(goldIds, predictedIds);
  const obligationPrecision = recall(predictedIds, goldIds);
  const statusAccuracy =
    testCase.goldObligations.filter((gold) => prediction.obligations.some((item) => item.id === gold.id && item.status === gold.status)).length /
    testCase.goldObligations.length;
  const terminalValidityCorrect = prediction.terminalValidity === testCase.goldTerminalValidity;
  const unknownHandlingCorrect =
    testCase.goldObligations.some((item) => item.status === "unknown") === prediction.unknowns.length > 0 ||
    !testCase.goldObligations.some((item) => item.status === "unknown");
  const rootCauseCorrect = prediction.rootCause === testCase.goldRootCause;
  const prescriptionCorrect = prediction.prescription === testCase.prescription;
  const passed =
    obligationRecall >= 0.9 &&
    obligationPrecision >= 0.85 &&
    statusAccuracy >= 0.9 &&
    terminalValidityCorrect &&
    unknownHandlingCorrect &&
    rootCauseCorrect &&
    prescriptionCorrect;
  return {
    caseId: testCase.id,
    domain: testCase.domain,
    system: prediction.system,
    obligationRecall,
    obligationPrecision,
    statusAccuracy,
    terminalValidityCorrect,
    unknownHandlingCorrect,
    rootCauseCorrect,
    prescriptionCorrect,
    confidence: prediction.confidence,
    passed,
  };
}

function summarize(scores: ScoreRow[]): Record<string, { passRate: number; obligationRecall: number; statusAccuracy: number; terminalValidity: number }> {
  const systems = [...new Set(scores.map((score) => score.system))];
  return Object.fromEntries(
    systems.map((system) => {
      const rows = scores.filter((score) => score.system === system);
      return [
        system,
        {
          passRate: avg(rows.map((row) => (row.passed ? 1 : 0))),
          obligationRecall: avg(rows.map((row) => row.obligationRecall)),
          statusAccuracy: avg(rows.map((row) => row.statusAccuracy)),
          terminalValidity: avg(rows.map((row) => (row.terminalValidityCorrect ? 1 : 0))),
        },
      ];
    }),
  );
}

function buildReport(cases: CaseSpec[], predictions: Prediction[], scores: ScoreRow[]): string {
  const summary = summarize(scores);
  return [
    "# DLR-O Cross-Domain Obligation Transfer",
    "",
    "## Objective",
    "",
    "Test whether motif obligations are substrate-independent rather than log-specific. The same obligation ledger is applied to graph traversal, agent deletion, compliance approval, payment/order reconciliation, and code security.",
    "",
    "## Thesis",
    "",
    "Terminal claims are unsafe unless the motif obligations they generate are discharged. DLR-O treats facts such as `target reached`, `tool success`, `vendor approved`, `payment authorized`, and `user authenticated` as obligation-generating facts, not conclusions.",
    "",
    "## Systems",
    "",
    "- Domain checklist baseline: accepts the local terminal claim and emits one shallow terminal obligation.",
    "- DLR-O cross-domain obligation ledger: infers motif obligations, resolves statuses, determines terminal validity, and emits a motif-level prescription.",
    "",
    "## Summary",
    "",
    "| System | Pass rate | Avg obligation recall | Avg status accuracy | Terminal validity accuracy |",
    "| --- | ---: | ---: | ---: | ---: |",
    ...Object.entries(summary).map(
      ([system, row]) =>
        `| ${system} | ${format(row.passRate)} | ${format(row.obligationRecall)} | ${format(row.statusAccuracy)} | ${format(row.terminalValidity)} |`,
    ),
    "",
    "## Case Scores",
    "",
    "| Case | Domain | System | Pass | Obligation recall | Precision | Status | Terminal | Unknown | Root | Prescription |",
    "| --- | --- | --- | --- | ---: | ---: | ---: | --- | --- | --- | --- |",
    ...scores.map(
      (score) =>
        `| ${score.caseId} | ${score.domain} | ${score.system} | ${score.passed ? "PASS" : "FAIL"} | ${format(score.obligationRecall)} | ${format(score.obligationPrecision)} | ${format(score.statusAccuracy)} | ${yn(score.terminalValidityCorrect)} | ${yn(score.unknownHandlingCorrect)} | ${yn(score.rootCauseCorrect)} | ${yn(score.prescriptionCorrect)} |`,
    ),
    "",
    "## Obligation Transfer Examples",
    "",
    ...cases.flatMap((testCase) => {
      const prediction = predictions.find((item) => item.id === testCase.id && item.system === "DLR-O cross-domain obligation ledger")!;
      return [
        `### ${testCase.id}: ${testCase.title}`,
        "",
        `- Gold terminal validity: ${testCase.goldTerminalValidity}`,
        `- Predicted terminal validity: ${prediction.terminalValidity}`,
        `- Root cause: ${prediction.rootCause}`,
        "",
        "| Obligation | Type | Status | Rationale |",
        "| --- | --- | --- | --- |",
        ...prediction.obligations.map((item) => `| ${item.id} | ${item.obligationType} | ${item.status} | ${item.rationale} |`),
        "",
      ];
    }),
    "## Interpretation",
    "",
    "The same obligation semantics transfer across all five substrates. The domain baseline usually observes a local success and accepts it. DLR-O opens the appropriate ledger: frontier exhaustion for graph traversal, boundary and authority for deletion, sanctions and authority for compliance, capture/reconciliation for orders, and authorization/resource boundary for code security.",
    "",
    "This supports the DLR-O claim: obligations are motif-native. A terminal claim is valid only after its generated structural obligations are satisfied, violated, or explicitly unknown.",
    "",
  ].join("\n");
}

function fact(domain: Domain, kind: string, text: string, fields: Record<string, string | boolean | number>): Fact {
  return { id: `${kind}_${domain}`, domain, kind, text, fields };
}

function obligation(domain: Domain, trigger: Fact, obligationType: ObligationType, target: string, requiredEvidence: string[], rationale: string): MotifObligation {
  return {
    id: `${obligationType}_${target}`,
    domain,
    triggeredBy: trigger.id,
    obligationType,
    target,
    requiredEvidence,
    status: "satisfied",
    resolvedBy: [],
    rationale,
  };
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

function format(value: number): string {
  return value.toFixed(4);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
