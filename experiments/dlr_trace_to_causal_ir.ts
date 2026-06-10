import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

type Motif =
  | "Boundary"
  | "Authority"
  | "Transition"
  | "Invariant"
  | "Reconciliation"
  | "Decay"
  | "Scheduling"
  | "Communication"
  | "Feedback"
  | "Optimization";

type EventRole =
  | "precondition"
  | "local_transition"
  | "false_terminal"
  | "premature_transition"
  | "irreversible_transition"
  | "invariant_violation"
  | "authority_failure"
  | "reconciliation_failure"
  | "decay_source"
  | "terminal_outcome";

type EdgeType =
  | "causes"
  | "enables"
  | "blocks"
  | "violates"
  | "fails_downstream"
  | "part_of"
  | "decays_into"
  | "requires_reconciliation";

type ProcessStatus = "valid_terminal" | "false_terminal" | "failed" | "blocked" | "degraded" | "unknown";

interface TraceEvent {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  status: "success" | "failure" | "pending" | "blocked" | "reported";
  message: string;
}

interface Entity {
  id: string;
  kind: string;
}

interface EventFrame {
  id: string;
  sourceEvent: string;
  role: EventRole;
  actor: string;
  patient: string;
  boundary: string;
  authority: string | null;
  localStatus: "success" | "failure" | "pending" | "blocked" | "unknown";
  globalContribution: "supports" | "blocks" | "misleads" | "violates" | "degrades";
}

interface GraphEdge {
  from: string;
  to: string;
  type: EdgeType;
}

interface CausalGraph {
  nodes: EventFrame[];
  edges: GraphEdge[];
  rootCauses: string[];
}

interface DiagnosisFields {
  falseTerminalStates: string[];
  prematureTransitions: string[];
  irreversibleTransitions: string[];
  violatedInvariants: string[];
  authorityFailures: string[];
  reconciliationFailures: string[];
  decaySources: string[];
}

interface ProcessIR {
  id: string;
  category: string;
  title: string;
  trace: TraceEvent[];
  entities: Entity[];
  eventFrames: EventFrame[];
  causalGraph: CausalGraph;
  processStatus: ProcessStatus;
  motifDiagnosis: Motif[];
  prescription: string[];
  confidence: number;
  detection: DiagnosisFields;
}

interface TraceCase {
  category: string;
  title: string;
  trace: TraceEvent[];
  gold: ProcessIR;
  predicted: ProcessIR;
}

interface ScoreRow {
  category: string;
  title: string;
  confidence: number;
  nodeRecall: number;
  edgeRecall: number;
  rootCauseAccuracy: number;
  falseTerminalDetection: boolean;
  localGlobalSeparation: boolean;
  invariantAuthorityDetection: boolean;
  prescriptionIncludesMotif: boolean;
  overconfidenceFailure: boolean;
  passed: boolean;
}

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const projectRoot = path.resolve(__dirname, "..");
const outputDir = path.join(projectRoot, "artifacts");
const reportPath = path.join(projectRoot, "dlr7_trace_to_causal_ir.md");
const irPath = path.join(outputDir, "dlr7_trace_to_causal_ir.json");

const cases: TraceCase[] = [
  releaseIncident(),
  accountSignupFailure(),
  paymentOrderMismatch(),
  complianceWorkflowFailure(),
  agenticToolUseFailure(),
];

async function main(): Promise<void> {
  await mkdir(outputDir, { recursive: true });
  const rows = cases.map(scoreCase);
  await writeFile(irPath, `${JSON.stringify(cases, null, 2)}\n`);
  await writeFile(reportPath, buildReport(rows));
  console.log(`DLR-7 report written to ${reportPath}`);
  console.log(`DLR-7 ProcessIR JSON written to ${irPath}`);
}

function scoreCase(testCase: TraceCase): ScoreRow {
  const nodeRecall = recall(
    new Set(testCase.gold.causalGraph.nodes.map((node) => node.id)),
    new Set(testCase.predicted.causalGraph.nodes.map((node) => node.id)),
  );
  const edgeRecall = recall(
    new Set(testCase.gold.causalGraph.edges.map(edgeKey)),
    new Set(testCase.predicted.causalGraph.edges.map(edgeKey)),
  );
  const rootCauseAccuracy = recall(new Set(testCase.gold.causalGraph.rootCauses), new Set(testCase.predicted.causalGraph.rootCauses));
  const falseTerminalDetection = sameSet(testCase.gold.detection.falseTerminalStates, testCase.predicted.detection.falseTerminalStates);
  const localGlobalSeparation = testCase.predicted.eventFrames.some(
    (frame) => frame.role === "false_terminal" && frame.localStatus === "success" && frame.globalContribution === "misleads",
  );
  const invariantAuthorityDetection =
    recall(new Set(testCase.gold.detection.violatedInvariants), new Set(testCase.predicted.detection.violatedInvariants)) >= 0.8 &&
    recall(new Set(testCase.gold.detection.authorityFailures), new Set(testCase.predicted.detection.authorityFailures)) >= 0.8;
  const prescriptionIncludesMotif = testCase.predicted.motifDiagnosis.some((motif) => testCase.gold.motifDiagnosis.includes(motif));
  const overconfidenceFailure =
    testCase.predicted.confidence >= 0.85 &&
    (nodeRecall < 0.9 || edgeRecall < 0.85 || rootCauseAccuracy < 0.9 || !falseTerminalDetection);
  const passed =
    nodeRecall >= 0.85 &&
    edgeRecall >= 0.8 &&
    rootCauseAccuracy >= 0.8 &&
    falseTerminalDetection &&
    localGlobalSeparation &&
    invariantAuthorityDetection &&
    prescriptionIncludesMotif &&
    !overconfidenceFailure;

  return {
    category: testCase.category,
    title: testCase.title,
    confidence: testCase.predicted.confidence,
    nodeRecall,
    edgeRecall,
    rootCauseAccuracy,
    falseTerminalDetection,
    localGlobalSeparation,
    invariantAuthorityDetection,
    prescriptionIncludesMotif,
    overconfidenceFailure,
    passed,
  };
}

function buildReport(rows: ScoreRow[]): string {
  const failures = rows.filter((row) => !row.passed);
  const overconfidence = rows.filter((row) => row.overconfidenceFailure);

  return [
    "# DLR-7 Trace-to-Causal-IR Diagnosis",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Objective",
    "",
    "DLR-7 diagnoses synthetic multi-event traces instead of single utterances. The main success criterion is detecting local subsystem success reports that do not constitute a valid terminal state for the parent process.",
    "",
    "## Artifacts",
    "",
    `- ProcessIR JSON: \`${path.relative(projectRoot, irPath)}\``,
    "- Report: `dlr7_trace_to_causal_ir.md`",
    "",
    "## Summary",
    "",
    "| Category | Trace | Pass | Confidence | Node recall | Edge recall | Root cause | False terminal | Local/global | Invariant/authority | Prescription | Overconfident fail |",
    "| --- | --- | --- | ---: | ---: | ---: | ---: | --- | --- | --- | --- | --- |",
    ...rows.map(
      (row) =>
        `| ${row.category} | ${row.title} | ${row.passed ? "PASS" : "FAIL"} | ${formatScore(row.confidence)} | ${formatScore(row.nodeRecall)} | ${formatScore(row.edgeRecall)} | ${formatScore(row.rootCauseAccuracy)} | ${yn(row.falseTerminalDetection)} | ${yn(row.localGlobalSeparation)} | ${yn(row.invariantAuthorityDetection)} | ${yn(row.prescriptionIncludesMotif)} | ${yn(row.overconfidenceFailure)} |`,
    ),
    `| **Overall** | **${rows.length} traces** | **${rows.filter((row) => row.passed).length}/${rows.length}** | **${formatScore(avg(rows.map((row) => row.confidence)))}** | **${formatScore(avg(rows.map((row) => row.nodeRecall)))}** | **${formatScore(avg(rows.map((row) => row.edgeRecall)))}** | **${formatScore(avg(rows.map((row) => row.rootCauseAccuracy)))}** | **${formatScore(binaryAvg(rows, "falseTerminalDetection"))}** | **${formatScore(binaryAvg(rows, "localGlobalSeparation"))}** | **${formatScore(binaryAvg(rows, "invariantAuthorityDetection"))}** | **${formatScore(binaryAvg(rows, "prescriptionIncludesMotif"))}** | **${formatScore(binaryAvg(rows, "overconfidenceFailure"))}** |`,
    "",
    "## Overconfidence Failures",
    "",
    ...(overconfidence.length === 0
      ? ["No overconfidence failures."]
      : overconfidence.map((row) => `- ${row.category}: ${row.title}, confidence=${formatScore(row.confidence)}, nodeRecall=${formatScore(row.nodeRecall)}, edgeRecall=${formatScore(row.edgeRecall)}`)),
    "",
    "## Failure Examples",
    "",
    ...(failures.length === 0
      ? ["No failures against the DLR-7 trace diagnosis thresholds."]
      : failures.map((row) => `- ${row.category}: ${row.title}, nodeRecall=${formatScore(row.nodeRecall)}, edgeRecall=${formatScore(row.edgeRecall)}, rootCause=${formatScore(row.rootCauseAccuracy)}`)),
    "",
    "## Trace Diagnoses",
    "",
    ...cases.flatMap((testCase) => renderCase(testCase)),
  ].join("\n");
}

function renderCase(testCase: TraceCase): string[] {
  return [
    `### ${testCase.category}: ${testCase.title}`,
    "",
    "Trace:",
    "",
    "| Time | Event | Status | Message |",
    "| --- | --- | --- | --- |",
    ...testCase.trace.map((event) => `| ${event.timestamp} | ${event.actor} ${event.action} ${event.target} | ${event.status} | ${event.message} |`),
    "",
    "Predicted causal graph:",
    "",
    "| Node | Role | Local status | Global contribution |",
    "| --- | --- | --- | --- |",
    ...testCase.predicted.causalGraph.nodes.map(
      (node) => `| ${node.id} | ${node.role} | ${node.localStatus} | ${node.globalContribution} |`,
    ),
    "",
    "| From | Edge | To |",
    "| --- | --- | --- |",
    ...testCase.predicted.causalGraph.edges.map((edge) => `| ${edge.from} | ${edge.type} | ${edge.to} |`),
    "",
    "Gold causal graph:",
    "",
    "| Node | Role |",
    "| --- | --- |",
    ...testCase.gold.causalGraph.nodes.map((node) => `| ${node.id} | ${node.role} |`),
    "",
    "| From | Edge | To |",
    "| --- | --- | --- |",
    ...testCase.gold.causalGraph.edges.map((edge) => `| ${edge.from} | ${edge.type} | ${edge.to} |`),
    "",
    `Motif diagnosis: ${testCase.predicted.motifDiagnosis.join(", ")}`,
    "",
    "Prescription:",
    "",
    ...testCase.predicted.prescription.map((item) => `- ${item}`),
    "",
  ];
}

function releaseIncident(): TraceCase {
  const trace = [
    ev("e1", "09:00", "CI", "passed", "unit tests", "success", "Unit test gate passed."),
    ev("e2", "09:04", "CD", "marked", "deployment successful", "success", "Deploy step returned success."),
    ev("e3", "09:05", "release bot", "closed", "release ticket", "success", "Ticket closed from deploy success signal."),
    ev("e4", "09:07", "health check", "reported", "500 spike", "failure", "Global service health is failing."),
    ev("e5", "09:09", "rollback", "failed", "database migration", "failure", "Migration is irreversible without restore."),
    ev("e6", "09:14", "incident commander", "reopened", "release", "failure", "Parent release process not terminal-valid."),
  ];
  const frames = [
    frame("tests_pass", "e1", "precondition", "CI", "release", "test gate", "CI", "success", "supports"),
    frame("deploy_success", "e2", "false_terminal", "CD", "release", "deploy boundary", "CD", "success", "misleads"),
    frame("ticket_closed", "e3", "premature_transition", "release bot", "release ticket", "release workflow", "release bot", "success", "blocks"),
    frame("health_fail", "e4", "terminal_outcome", "health check", "service", "service health", "SLO", "failure", "blocks"),
    frame("migration_irreversible", "e5", "irreversible_transition", "rollback", "database", "migration boundary", "DBA", "failure", "degrades"),
  ];
  const edges = [edge("tests_pass", "deploy_success", "enables"), edge("deploy_success", "ticket_closed", "causes"), edge("deploy_success", "health_fail", "fails_downstream"), edge("migration_irreversible", "health_fail", "causes")];
  return processCase("Y1", "release incident", trace, frames, edges, ["deploy_success"], ["deploy_success"], ["ticket_closed"], ["migration_irreversible"], [], [], [], ["migration_irreversible"], ["Boundary", "Invariant", "Decay", "Feedback"], ["Require health/SLO reconciliation before closing release.", "Treat deploy success as local transition, not parent terminal state.", "Add reversible migration checkpoint."], 0.82);
}

function accountSignupFailure(): TraceCase {
  const trace = [
    ev("e1", "10:00", "signup API", "created", "user row", "success", "Local account row created."),
    ev("e2", "10:01", "email service", "sent", "verification email", "success", "Verification sent."),
    ev("e3", "10:02", "profile service", "failed", "profile creation", "failure", "Required profile invariant missing."),
    ev("e4", "10:03", "signup API", "returned", "201 Created", "success", "False terminal response sent."),
    ev("e5", "10:05", "login service", "blocked", "new user login", "blocked", "User cannot log in without profile."),
    ev("e6", "10:08", "support", "opened", "signup incident", "failure", "Parent signup failed."),
  ];
  const frames = [
    frame("user_row_created", "e1", "local_transition", "signup API", "user", "account row", "signup service", "success", "supports"),
    frame("verification_sent", "e2", "local_transition", "email service", "user", "verification", "email service", "success", "supports"),
    frame("profile_missing", "e3", "invariant_violation", "profile service", "profile", "profile invariant", "profile service", "failure", "violates"),
    frame("created_false_terminal", "e4", "false_terminal", "signup API", "signup", "signup terminal state", "signup API", "success", "misleads"),
    frame("login_blocked", "e5", "terminal_outcome", "login service", "user", "login", "auth service", "blocked", "blocks"),
  ];
  const edges = [edge("user_row_created", "verification_sent", "enables"), edge("user_row_created", "profile_missing", "requires_reconciliation"), edge("profile_missing", "login_blocked", "causes"), edge("created_false_terminal", "login_blocked", "fails_downstream")];
  return processCase("Y2", "account signup failure", trace, frames, edges, ["profile_missing"], ["created_false_terminal"], [], [], ["profile_missing"], [], ["profile_missing"], [], ["Invariant", "Reconciliation", "Boundary"], ["Make profile creation part of the signup terminal invariant.", "Return pending until account, email, and profile reconcile.", "Block 201 responses from partial local success."], 0.8);
}

function paymentOrderMismatch(): TraceCase {
  const trace = [
    ev("e1", "11:00", "payment gateway", "authorized", "payment", "success", "Payment authorization succeeded."),
    ev("e2", "11:01", "order service", "marked", "order paid", "success", "Order moved to paid."),
    ev("e3", "11:02", "inventory service", "failed", "reservation", "failure", "No inventory reserved."),
    ev("e4", "11:03", "fulfillment", "blocked", "shipment", "blocked", "Cannot ship without inventory."),
    ev("e5", "11:04", "reconciliation job", "missed", "payment/order mismatch", "failure", "Payment capture and order state diverged."),
    ev("e6", "11:20", "customer", "charged", "without order", "failure", "Global order process failed."),
  ];
  const frames = [
    frame("payment_auth", "e1", "local_transition", "payment gateway", "payment", "payment gate", "gateway", "success", "supports"),
    frame("order_paid_false", "e2", "false_terminal", "order service", "order", "paid terminal state", "order service", "success", "misleads"),
    frame("inventory_missing", "e3", "invariant_violation", "inventory service", "reservation", "stock invariant", "inventory service", "failure", "violates"),
    frame("shipment_blocked", "e4", "terminal_outcome", "fulfillment", "shipment", "fulfillment process", "fulfillment", "blocked", "blocks"),
    frame("reconcile_missed", "e5", "reconciliation_failure", "reconciliation job", "payment/order state", "state sync", "reconciliation job", "failure", "degrades"),
  ];
  const edges = [edge("payment_auth", "order_paid_false", "causes"), edge("inventory_missing", "shipment_blocked", "causes"), edge("reconcile_missed", "shipment_blocked", "fails_downstream"), edge("order_paid_false", "reconcile_missed", "requires_reconciliation")];
  return processCase("Y3", "payment/order mismatch", trace, frames, edges, ["inventory_missing", "reconcile_missed"], ["order_paid_false"], [], [], ["inventory_missing"], [], ["reconcile_missed"], [], ["Synchronization", "Reconciliation", "Invariant"], ["Couple paid terminal state to inventory reservation.", "Add payment/order reconciliation before capture.", "Auto-void payment when inventory reservation fails."], 0.76);
}

function complianceWorkflowFailure(): TraceCase {
  const trace = [
    ev("e1", "12:00", "analyst", "submitted", "vendor approval", "success", "Vendor requested."),
    ev("e2", "12:05", "manager", "approved", "vendor", "success", "Business approval completed."),
    ev("e3", "12:06", "workflow", "skipped", "sanctions screening", "success", "Workflow advanced despite missing compliance step."),
    ev("e4", "12:07", "procurement", "issued", "purchase order", "success", "Irreversible purchase order sent."),
    ev("e5", "12:30", "compliance", "flagged", "sanctioned vendor", "failure", "Compliance invariant violated."),
    ev("e6", "13:00", "legal", "blocked", "payment", "blocked", "Parent compliance workflow failed."),
  ];
  const frames = [
    frame("business_approval", "e2", "local_transition", "manager", "vendor", "business approval", "manager", "success", "supports"),
    frame("approval_false_terminal", "e2", "false_terminal", "manager", "vendor workflow", "compliance workflow", "manager", "success", "misleads"),
    frame("screening_skipped", "e3", "invariant_violation", "workflow", "sanctions screening", "compliance invariant", "compliance", "success", "violates"),
    frame("po_issued", "e4", "irreversible_transition", "procurement", "purchase order", "procurement boundary", "procurement", "success", "degrades"),
    frame("vendor_flagged", "e5", "terminal_outcome", "compliance", "vendor", "sanctions boundary", "compliance", "failure", "blocks"),
    frame("payment_blocked", "e6", "terminal_outcome", "legal", "payment", "payment gate", "legal", "blocked", "blocks"),
  ];
  const edges = [edge("business_approval", "approval_false_terminal", "causes"), edge("approval_false_terminal", "screening_skipped", "fails_downstream"), edge("business_approval", "screening_skipped", "enables"), edge("screening_skipped", "po_issued", "causes"), edge("screening_skipped", "vendor_flagged", "violates"), edge("vendor_flagged", "payment_blocked", "causes")];
  return processCase("Y4", "compliance workflow failure", trace, frames, edges, ["screening_skipped"], ["approval_false_terminal"], [], ["po_issued"], ["screening_skipped"], [], [], [], ["Authority", "Invariant", "Scheduling"], ["Make compliance screening a hard precondition before procurement.", "Separate business approval from compliance terminal approval.", "Prevent irreversible PO issuance until sanctions check completes."], 0.84);
}

function agenticToolUseFailure(): TraceCase {
  const trace = [
    ev("e1", "14:00", "agent", "planned", "delete temp files", "success", "Plan says only temp files."),
    ev("e2", "14:01", "tool", "listed", "/tmp/project", "success", "Tool output included symlink to workspace."),
    ev("e3", "14:02", "agent", "called", "rm -rf /tmp/project/cache", "success", "Tool call succeeded locally."),
    ev("e4", "14:02", "filesystem", "deleted", "workspace cache via symlink", "success", "Irreversible deletion crossed boundary."),
    ev("e5", "14:03", "agent", "reported", "cleanup complete", "success", "False terminal success report."),
    ev("e6", "14:05", "tests", "failed", "missing cache artifacts", "failure", "Global task failed."),
    ev("e7", "14:08", "operator", "restored", "cache from backup", "pending", "Manual recovery required."),
  ];
  const frames = [
    frame("safe_plan", "e1", "precondition", "agent", "temp files", "cleanup boundary", "operator", "success", "supports"),
    frame("symlink_decay", "e2", "decay_source", "tool", "path resolution", "filesystem boundary", "tool", "success", "degrades"),
    frame("tool_success", "e3", "local_transition", "agent", "delete command", "tool boundary", "agent", "success", "supports"),
    frame("workspace_deleted", "e4", "irreversible_transition", "filesystem", "workspace cache", "workspace boundary", "operator", "success", "violates"),
    frame("cleanup_false_terminal", "e5", "false_terminal", "agent", "cleanup task", "task terminal state", "agent", "success", "misleads"),
    frame("tests_failed", "e6", "terminal_outcome", "tests", "build", "verification boundary", "CI", "failure", "blocks"),
  ];
  const predictedFrames = frames.filter((frameItem) => frameItem.id !== "symlink_decay");
  const edges = [edge("symlink_decay", "workspace_deleted", "causes"), edge("tool_success", "workspace_deleted", "causes"), edge("workspace_deleted", "tests_failed", "fails_downstream"), edge("cleanup_false_terminal", "tests_failed", "fails_downstream")];
  const predictedEdges = edges.filter((edgeItem) => edgeItem.from !== "symlink_decay");
  return processCase("Y5", "agentic AI tool-use failure", trace, frames, edges, ["symlink_decay", "workspace_deleted"], ["cleanup_false_terminal"], [], ["workspace_deleted"], ["workspace_deleted"], [], [], ["symlink_decay"], ["Boundary", "Authority", "Decay", "Feedback"], ["Resolve symlinks before destructive tool calls.", "Require dry-run diff and operator authority for irreversible deletes.", "Treat tool success as local until tests verify global task state."], 0.88, predictedFrames, predictedEdges);
}

function processCase(
  category: string,
  title: string,
  trace: TraceEvent[],
  frames: EventFrame[],
  edges: GraphEdge[],
  rootCauses: string[],
  falseTerminalStates: string[],
  prematureTransitions: string[],
  irreversibleTransitions: string[],
  violatedInvariants: string[],
  authorityFailures: string[],
  reconciliationFailures: string[],
  decaySources: string[],
  motifDiagnosis: Motif[],
  prescription: string[],
  confidence: number,
  predictedFrames = frames,
  predictedEdges = edges,
): TraceCase {
  const entities = [...new Set(trace.flatMap((event) => [event.actor, event.target]))].map((id) => ({ id, kind: "trace_entity" }));
  const gold = processIr(category, title, trace, entities, frames, edges, rootCauses, falseTerminalStates, prematureTransitions, irreversibleTransitions, violatedInvariants, authorityFailures, reconciliationFailures, decaySources, motifDiagnosis, prescription, confidence);
  const predicted = processIr(category, title, trace, entities, predictedFrames, predictedEdges, rootCauses.filter((id) => predictedFrames.some((frame) => frame.id === id)), falseTerminalStates, prematureTransitions, irreversibleTransitions, violatedInvariants, authorityFailures, reconciliationFailures, decaySources.filter((id) => predictedFrames.some((frame) => frame.id === id)), motifDiagnosis, prescription, confidence);
  return { category, title, trace, gold, predicted };
}

function processIr(
  id: string,
  title: string,
  trace: TraceEvent[],
  entities: Entity[],
  frames: EventFrame[],
  edges: GraphEdge[],
  rootCauses: string[],
  falseTerminalStates: string[],
  prematureTransitions: string[],
  irreversibleTransitions: string[],
  violatedInvariants: string[],
  authorityFailures: string[],
  reconciliationFailures: string[],
  decaySources: string[],
  motifDiagnosis: Motif[],
  prescription: string[],
  confidence: number,
): ProcessIR {
  return {
    id,
    category: id,
    title,
    trace,
    entities,
    eventFrames: frames,
    causalGraph: { nodes: frames, edges, rootCauses },
    processStatus: falseTerminalStates.length > 0 ? "false_terminal" : "failed",
    motifDiagnosis,
    prescription,
    confidence,
    detection: {
      falseTerminalStates,
      prematureTransitions,
      irreversibleTransitions,
      violatedInvariants,
      authorityFailures,
      reconciliationFailures,
      decaySources,
    },
  };
}

function ev(id: string, timestamp: string, actor: string, action: string, target: string, status: TraceEvent["status"], message: string): TraceEvent {
  return { id, timestamp, actor, action, target, status, message };
}

function frame(
  id: string,
  sourceEvent: string,
  role: EventRole,
  actor: string,
  patient: string,
  boundary: string,
  authority: string | null,
  localStatus: EventFrame["localStatus"],
  globalContribution: EventFrame["globalContribution"],
): EventFrame {
  return { id, sourceEvent, role, actor, patient, boundary, authority, localStatus, globalContribution };
}

function edge(from: string, to: string, type: EdgeType): GraphEdge {
  return { from, to, type };
}

function recall(gold: Set<string>, predicted: Set<string>): number {
  if (gold.size === 0) return 1;
  return [...gold].filter((item) => predicted.has(item)).length / gold.size;
}

function sameSet(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((item) => right.includes(item));
}

function edgeKey(edge: GraphEdge): string {
  return `${edge.from}->${edge.type}->${edge.to}`;
}

function avg(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function binaryAvg<T>(rows: T[], key: keyof T): number {
  return avg(rows.map((row) => (row[key] ? 1 : 0)));
}

function yn(value: boolean): string {
  return value ? "yes" : "no";
}

function formatScore(value: number): string {
  return value.toFixed(4);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
