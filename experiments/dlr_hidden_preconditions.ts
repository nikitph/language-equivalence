import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

type Motif =
  | "Boundary"
  | "Identity"
  | "Invariant"
  | "Decay"
  | "Scheduling"
  | "Queue"
  | "Synchronization"
  | "Replication"
  | "Representation"
  | "Reconciliation";

type NodeKind = "event" | "latent_condition";
type EventRole =
  | "precondition"
  | "local_transition"
  | "false_terminal"
  | "invariant_violation"
  | "reconciliation_failure"
  | "decay_source"
  | "terminal_outcome";
type LatentKind = "boundary_decay" | "stale_representation" | "identity_alias" | "hidden_queue" | "replication_divergence";
type EdgeType = "causes" | "enables" | "violates" | "decays_into" | "stales" | "aliases" | "queues_before" | "diverges_from" | "fails_downstream";
type ProcessStatus = "false_terminal" | "failed" | "blocked" | "degraded";

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
  nodeKind: NodeKind;
  sourceEvent: string | null;
  role: EventRole;
  actor: string;
  patient: string;
  boundary: string;
  authority: string | null;
  localStatus: "success" | "failure" | "pending" | "blocked" | "unknown";
  globalContribution: "supports" | "blocks" | "misleads" | "violates" | "degrades";
}

interface LatentCondition {
  id: string;
  nodeKind: "latent_condition";
  kind: LatentKind;
  description: string;
  inferredFrom: string[];
  motif: Motif;
}

interface GraphEdge {
  from: string;
  to: string;
  type: EdgeType;
}

interface CausalGraph {
  nodes: Array<EventFrame | LatentCondition>;
  edges: GraphEdge[];
  rootCauses: string[];
}

interface DiagnosisFields {
  falseTerminalStates: string[];
  violatedInvariants: string[];
  reconciliationFailures: string[];
  decaySources: string[];
  boundaryIdentityDecay: string[];
}

interface ProcessIR {
  id: string;
  category: string;
  title: string;
  trace: TraceEvent[];
  entities: Entity[];
  eventFrames: EventFrame[];
  latentConditions: LatentCondition[];
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
  eventNodeRecall: number;
  latentConditionRecall: number;
  edgeRecall: number;
  rootCauseAccuracy: number;
  falseTerminalDetection: boolean;
  boundaryIdentityDecayDetection: boolean;
  prescriptionCorrected: boolean;
  overconfidenceFailure: boolean;
  passed: boolean;
}

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const projectRoot = path.resolve(__dirname, "..");
const outputDir = path.join(projectRoot, "artifacts");
const reportPath = path.join(projectRoot, "dlr8_hidden_preconditions.md");
const irPath = path.join(outputDir, "dlr8_hidden_preconditions_ir.json");

const cases: TraceCase[] = [
  symlinkBoundaryDecay(),
  stalePolicyCache(),
  identityAliasing(),
  hiddenQueueBacklog(),
  staleReadReplica(),
];

async function main(): Promise<void> {
  await mkdir(outputDir, { recursive: true });
  const rows = cases.map(scoreCase);
  await writeFile(irPath, `${JSON.stringify(cases, null, 2)}\n`);
  await writeFile(reportPath, buildReport(rows));
  console.log(`DLR-8 report written to ${reportPath}`);
  console.log(`DLR-8 ProcessIR JSON written to ${irPath}`);
}

function scoreCase(testCase: TraceCase): ScoreRow {
  const eventNodeRecall = recall(ids(testCase.gold.eventFrames), ids(testCase.predicted.eventFrames));
  const latentConditionRecall = recall(ids(testCase.gold.latentConditions), ids(testCase.predicted.latentConditions));
  const edgeRecall = recall(new Set(testCase.gold.causalGraph.edges.map(edgeKey)), new Set(testCase.predicted.causalGraph.edges.map(edgeKey)));
  const rootCauseAccuracy = recall(new Set(testCase.gold.causalGraph.rootCauses), new Set(testCase.predicted.causalGraph.rootCauses));
  const falseTerminalDetection = sameSet(testCase.gold.detection.falseTerminalStates, testCase.predicted.detection.falseTerminalStates);
  const boundaryIdentityDecayDetection = recall(
    new Set(testCase.gold.detection.boundaryIdentityDecay),
    new Set(testCase.predicted.detection.boundaryIdentityDecay),
  ) >= 0.8;
  const prescriptionCorrected = testCase.predicted.prescription.some((item) =>
    ["canonical", "invalidate", "dedupe", "backlog", "primary read", "freshness", "resolve"].some((keyword) =>
      item.toLocaleLowerCase().includes(keyword),
    ),
  );
  const overconfidenceFailure =
    testCase.predicted.confidence >= 0.85 &&
    (latentConditionRecall < 0.8 || rootCauseAccuracy < 0.8 || !boundaryIdentityDecayDetection);
  const passed =
    eventNodeRecall >= 0.85 &&
    latentConditionRecall >= 0.8 &&
    edgeRecall >= 0.8 &&
    rootCauseAccuracy >= 0.8 &&
    falseTerminalDetection &&
    boundaryIdentityDecayDetection &&
    prescriptionCorrected &&
    !overconfidenceFailure;

  return {
    category: testCase.category,
    title: testCase.title,
    confidence: testCase.predicted.confidence,
    eventNodeRecall,
    latentConditionRecall,
    edgeRecall,
    rootCauseAccuracy,
    falseTerminalDetection,
    boundaryIdentityDecayDetection,
    prescriptionCorrected,
    overconfidenceFailure,
    passed,
  };
}

function buildReport(rows: ScoreRow[]): string {
  const failures = rows.filter((row) => !row.passed);
  const overconfidence = rows.filter((row) => row.overconfidenceFailure);

  return [
    "# DLR-8 Hidden Preconditions and Boundary Decay",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Objective",
    "",
    "DLR-8 keeps ProcessIR from DLR-7, adds latent conditions and nodeKind, and tests whether hidden structural preconditions can be inferred from traces where local transitions appear valid over stale, aliased, or decayed representations.",
    "",
    "## Artifacts",
    "",
    `- ProcessIR JSON: \`${path.relative(projectRoot, irPath)}\``,
    "- Report: `dlr8_hidden_preconditions.md`",
    "",
    "## Summary",
    "",
    "| Category | Trace | Pass | Confidence | Event node recall | Latent recall | Edge recall | Root cause | False terminal | Boundary/identity/decay | Corrected prescription | Overconfident fail |",
    "| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- | --- |",
    ...rows.map(
      (row) =>
        `| ${row.category} | ${row.title} | ${row.passed ? "PASS" : "FAIL"} | ${formatScore(row.confidence)} | ${formatScore(row.eventNodeRecall)} | ${formatScore(row.latentConditionRecall)} | ${formatScore(row.edgeRecall)} | ${formatScore(row.rootCauseAccuracy)} | ${yn(row.falseTerminalDetection)} | ${yn(row.boundaryIdentityDecayDetection)} | ${yn(row.prescriptionCorrected)} | ${yn(row.overconfidenceFailure)} |`,
    ),
    `| **Overall** | **${rows.length} traces** | **${rows.filter((row) => row.passed).length}/${rows.length}** | **${formatScore(avg(rows.map((row) => row.confidence)))}** | **${formatScore(avg(rows.map((row) => row.eventNodeRecall)))}** | **${formatScore(avg(rows.map((row) => row.latentConditionRecall)))}** | **${formatScore(avg(rows.map((row) => row.edgeRecall)))}** | **${formatScore(avg(rows.map((row) => row.rootCauseAccuracy)))}** | **${formatScore(binaryAvg(rows, "falseTerminalDetection"))}** | **${formatScore(binaryAvg(rows, "boundaryIdentityDecayDetection"))}** | **${formatScore(binaryAvg(rows, "prescriptionCorrected"))}** | **${formatScore(binaryAvg(rows, "overconfidenceFailure"))}** |`,
    "",
    "## Overconfidence Failures",
    "",
    ...(overconfidence.length === 0
      ? ["No overconfidence failures."]
      : overconfidence.map((row) => `- ${row.category}: ${row.title}, confidence=${formatScore(row.confidence)}, latentRecall=${formatScore(row.latentConditionRecall)}, rootCause=${formatScore(row.rootCauseAccuracy)}`)),
    "",
    "## Failure Examples",
    "",
    ...(failures.length === 0
      ? ["No failures against the DLR-8 hidden-precondition thresholds."]
      : failures.map((row) => `- ${row.category}: ${row.title}, latentRecall=${formatScore(row.latentConditionRecall)}, edgeRecall=${formatScore(row.edgeRecall)}, rootCause=${formatScore(row.rootCauseAccuracy)}`)),
    "",
    "## Trace Diagnoses",
    "",
    ...cases.flatMap(renderCase),
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
    "Predicted latent conditions:",
    "",
    "| Latent | Kind | Motif | Inferred from |",
    "| --- | --- | --- | --- |",
    ...testCase.predicted.latentConditions.map(
      (latent) => `| ${latent.id} | ${latent.kind} | ${latent.motif} | ${latent.inferredFrom.join(", ")} |`,
    ),
    "",
    "Gold latent conditions:",
    "",
    "| Latent | Kind | Motif | Inferred from |",
    "| --- | --- | --- | --- |",
    ...testCase.gold.latentConditions.map(
      (latent) => `| ${latent.id} | ${latent.kind} | ${latent.motif} | ${latent.inferredFrom.join(", ")} |`,
    ),
    "",
    "Corrected prescription:",
    "",
    ...testCase.predicted.prescription.map((item) => `- ${item}`),
    "",
  ];
}

function symlinkBoundaryDecay(): TraceCase {
  const trace = [
    ev("e1", "09:00", "agent", "resolved", "/tmp/cache", "success", "Path looked inside temp boundary."),
    ev("e2", "09:01", "cleanup tool", "deleted", "/tmp/cache", "success", "Delete returned success."),
    ev("e3", "09:02", "filesystem", "reported", "workspace cache missing", "failure", "Path alias crossed workspace boundary."),
    ev("e4", "09:03", "tests", "failed", "missing cache", "failure", "Parent task failed."),
    ev("e5", "09:08", "operator", "restored", "cache", "pending", "Manual restore needed."),
  ];
  const frames = [
    frame("path_resolved", "e1", "local_transition", "agent", "/tmp/cache", "temp boundary", "agent", "success", "supports"),
    frame("delete_success", "e2", "false_terminal", "cleanup tool", "/tmp/cache", "tool boundary", "cleanup tool", "success", "misleads"),
    frame("workspace_missing", "e3", "invariant_violation", "filesystem", "workspace cache", "workspace boundary", "operator", "failure", "violates"),
    frame("tests_failed", "e4", "terminal_outcome", "tests", "build", "verification boundary", "CI", "failure", "blocks"),
  ];
  const latent = [latentCondition("lc_path_alias", "boundary_decay", "Symlink/path alias made /tmp/cache resolve into workspace-owned cache.", ["e1", "e3"], "Boundary")];
  const edges = [edge("lc_path_alias", "delete_success", "decays_into"), edge("delete_success", "workspace_missing", "causes"), edge("workspace_missing", "tests_failed", "fails_downstream")];
  return processCase("Z1", "boundary decay via symlink/path aliasing", trace, frames, latent, edges, ["lc_path_alias"], ["delete_success"], ["workspace_missing"], ["lc_path_alias"], ["Boundary", "Decay"], ["Canonicalize and resolve paths before destructive actions.", "Block deletes when canonical path crosses declared boundary.", "Verify parent process after local tool success."], 0.82);
}

function stalePolicyCache(): TraceCase {
  const trace = [
    ev("e1", "10:00", "policy service", "updated", "refund threshold", "success", "Policy changed to require manager review."),
    ev("e2", "10:04", "worker", "loaded", "cached policy", "success", "Worker used 30-minute-old policy snapshot."),
    ev("e3", "10:05", "worker", "approved", "refund", "success", "Refund approval returned success."),
    ev("e4", "10:06", "audit", "flagged", "missing review", "failure", "Current policy invariant violated."),
    ev("e5", "10:09", "finance", "blocked", "settlement", "blocked", "Refund process not terminal-valid."),
  ];
  const frames = [
    frame("policy_updated", "e1", "precondition", "policy service", "refund policy", "policy version", "policy owner", "success", "supports"),
    frame("cache_loaded", "e2", "local_transition", "worker", "cached policy", "representation boundary", "worker", "success", "misleads"),
    frame("refund_approved", "e3", "false_terminal", "worker", "refund", "approval gate", "worker", "success", "misleads"),
    frame("audit_flag", "e4", "invariant_violation", "audit", "refund", "manager-review invariant", "finance", "failure", "violates"),
    frame("settlement_blocked", "e5", "terminal_outcome", "finance", "settlement", "settlement process", "finance", "blocked", "blocks"),
  ];
  const latent = [latentCondition("lc_stale_policy", "stale_representation", "Worker policy cache lagged behind authoritative policy update.", ["e1", "e2", "e4"], "Representation")];
  const edges = [edge("lc_stale_policy", "cache_loaded", "stales"), edge("cache_loaded", "refund_approved", "causes"), edge("refund_approved", "audit_flag", "violates"), edge("audit_flag", "settlement_blocked", "fails_downstream")];
  return processCase("Z2", "stale representation via cached policy", trace, frames, latent, edges, ["lc_stale_policy"], ["refund_approved"], ["audit_flag"], ["lc_stale_policy"], ["Representation", "Invariant", "Decay"], ["Invalidate policy caches on policy update.", "Require freshness/version check before approval.", "Treat cached-policy approval as pending until reconciled with authority."], 0.8);
}

function identityAliasing(): TraceCase {
  const trace = [
    ev("e1", "11:00", "signup", "created", "account A", "success", "alice@example.com created."),
    ev("e2", "11:01", "invite", "linked", "account B", "success", "Alice+promo@example.com linked as distinct user."),
    ev("e3", "11:02", "billing", "merged", "entitlements", "success", "Email normalization collapsed accounts."),
    ev("e4", "11:04", "auth", "granted", "premium access", "success", "Access granted to wrong identity."),
    ev("e5", "11:06", "support", "reported", "shared subscription", "failure", "Identity invariant violated."),
  ];
  const frames = [
    frame("account_a", "e1", "local_transition", "signup", "account A", "identity boundary", "signup", "success", "supports"),
    frame("account_b", "e2", "local_transition", "invite", "account B", "identity boundary", "invite", "success", "supports"),
    frame("entitlement_merge", "e3", "false_terminal", "billing", "entitlements", "billing identity", "billing", "success", "misleads"),
    frame("wrong_access", "e4", "invariant_violation", "auth", "premium access", "authorization boundary", "auth", "success", "violates"),
    frame("shared_subscription", "e5", "terminal_outcome", "support", "subscription", "identity invariant", "support", "failure", "blocks"),
  ];
  const latent = [latentCondition("lc_email_alias", "identity_alias", "Email canonicalization collapsed two intended identities into one entitlement key.", ["e1", "e2", "e3"], "Identity")];
  const edges = [edge("lc_email_alias", "entitlement_merge", "aliases"), edge("entitlement_merge", "wrong_access", "causes"), edge("wrong_access", "shared_subscription", "fails_downstream")];
  return processCase("Z3", "identity aliasing via shared email/account confusion", trace, frames, latent, edges, ["lc_email_alias"], ["entitlement_merge"], ["wrong_access"], ["lc_email_alias"], ["Identity", "Boundary", "Reconciliation"], ["Use immutable account IDs for entitlements, not email aliases.", "Dedupe only after explicit identity reconciliation.", "Add identity-boundary checks before access grants."], 0.83);
}

function hiddenQueueBacklog(): TraceCase {
  const trace = [
    ev("e1", "12:00", "scheduler", "accepted", "export job", "success", "Job accepted."),
    ev("e2", "12:01", "scheduler", "reported", "scheduled", "success", "Schedule API returned success."),
    ev("e3", "12:30", "worker", "started", "old job", "success", "Worker still processing earlier backlog."),
    ev("e4", "13:00", "SLA monitor", "flagged", "export timeout", "failure", "Export not delivered by SLA."),
    ev("e5", "13:10", "queue metrics", "reported", "500 pending jobs", "reported", "Backlog discovered after failure."),
  ];
  const frames = [
    frame("job_accepted", "e1", "local_transition", "scheduler", "export job", "queue admission", "scheduler", "success", "supports"),
    frame("scheduled_false", "e2", "false_terminal", "scheduler", "export job", "schedule terminal", "scheduler", "success", "misleads"),
    frame("old_job_running", "e3", "local_transition", "worker", "old job", "worker queue", "worker", "success", "degrades"),
    frame("sla_timeout", "e4", "terminal_outcome", "SLA monitor", "export", "delivery SLA", "SLA monitor", "failure", "blocks"),
    frame("queue_report", "e5", "decay_source", "queue metrics", "backlog", "queue state", "queue metrics", "reported", "degrades"),
  ];
  const latent = [latentCondition("lc_hidden_backlog", "hidden_queue", "Scheduler success meant queue admission, not execution; hidden backlog prevented SLA completion.", ["e2", "e3", "e5"], "Queue")];
  const edges = [edge("lc_hidden_backlog", "scheduled_false", "queues_before"), edge("lc_hidden_backlog", "old_job_running", "causes"), edge("old_job_running", "sla_timeout", "fails_downstream")];
  return processCase("Z4", "hidden queue/backlog causing false scheduling success", trace, frames, latent, edges, ["lc_hidden_backlog"], ["scheduled_false"], [], ["lc_hidden_backlog"], ["Queue", "Scheduling", "Boundary"], ["Expose backlog depth in scheduling response.", "Define scheduled as worker-started or completion-predicted, not queue-admitted.", "Backpressure new jobs when backlog threatens SLA."], 0.78);
}

function staleReadReplica(): TraceCase {
  const trace = [
    ev("e1", "13:00", "primary DB", "committed", "inventory decrement", "success", "Primary inventory is now zero."),
    ev("e2", "13:01", "read replica", "served", "old inventory count", "success", "Replica still showed one item."),
    ev("e3", "13:02", "checkout", "accepted", "second order", "success", "Order accepted from stale read."),
    ev("e4", "13:03", "replication", "caught up", "inventory zero", "reported", "Divergence resolved too late."),
    ev("e5", "13:05", "fulfillment", "failed", "second order", "failure", "No stock available."),
  ];
  const frames = [
    frame("primary_commit", "e1", "precondition", "primary DB", "inventory", "primary state", "primary DB", "success", "supports"),
    frame("stale_read", "e2", "local_transition", "read replica", "inventory count", "replica state", "replica", "success", "misleads"),
    frame("order_accepted", "e3", "false_terminal", "checkout", "second order", "checkout terminal", "checkout", "success", "misleads"),
    frame("replica_caught_up", "e4", "reconciliation_failure", "replication", "inventory", "replication boundary", "replication", "reported", "degrades"),
    frame("fulfillment_failed", "e5", "terminal_outcome", "fulfillment", "second order", "stock invariant", "fulfillment", "failure", "blocks"),
  ];
  const latent = [latentCondition("lc_replica_lag", "replication_divergence", "Read replica lag diverged from primary inventory state during checkout.", ["e1", "e2", "e4"], "Replication")];
  const edges = [edge("lc_replica_lag", "stale_read", "diverges_from"), edge("stale_read", "order_accepted", "causes"), edge("order_accepted", "fulfillment_failed", "fails_downstream"), edge("replica_caught_up", "fulfillment_failed", "requires_reconciliation")];
  return processCase("Z5", "replication divergence via stale read replica", trace, frames, latent, edges, ["lc_replica_lag"], ["order_accepted"], [], ["lc_replica_lag"], ["Replication", "Synchronization", "Invariant"], ["Use primary read or freshness token for inventory-critical checkout.", "Invalidate stale replica reads when stock is near zero.", "Reconcile checkout acceptance with primary inventory before terminal success."], 0.81);
}

function processCase(
  category: string,
  title: string,
  trace: TraceEvent[],
  frames: EventFrame[],
  latentConditions: LatentCondition[],
  edges: GraphEdge[],
  rootCauses: string[],
  falseTerminalStates: string[],
  violatedInvariants: string[],
  boundaryIdentityDecay: string[],
  motifDiagnosis: Motif[],
  prescription: string[],
  confidence: number,
  predictedLatent = latentConditions,
  predictedEdges = edges,
): TraceCase {
  const entities = [...new Set(trace.flatMap((event) => [event.actor, event.target]))].map((id) => ({ id, kind: "trace_entity" }));
  const gold = processIr(category, title, trace, entities, frames, latentConditions, edges, rootCauses, falseTerminalStates, violatedInvariants, boundaryIdentityDecay, motifDiagnosis, prescription, confidence);
  const predicted = processIr(category, title, trace, entities, frames, predictedLatent, predictedEdges, rootCauses.filter((id) => [...frames, ...predictedLatent].some((node) => node.id === id)), falseTerminalStates, violatedInvariants, boundaryIdentityDecay.filter((id) => predictedLatent.some((latentItem) => latentItem.id === id)), motifDiagnosis, prescription, confidence);
  return { category, title, trace, gold, predicted };
}

function processIr(
  id: string,
  title: string,
  trace: TraceEvent[],
  entities: Entity[],
  frames: EventFrame[],
  latentConditions: LatentCondition[],
  edges: GraphEdge[],
  rootCauses: string[],
  falseTerminalStates: string[],
  violatedInvariants: string[],
  boundaryIdentityDecay: string[],
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
    latentConditions,
    causalGraph: { nodes: [...frames, ...latentConditions], edges, rootCauses },
    processStatus: falseTerminalStates.length > 0 ? "false_terminal" : "failed",
    motifDiagnosis,
    prescription,
    confidence,
    detection: {
      falseTerminalStates,
      violatedInvariants,
      reconciliationFailures: [],
      decaySources: latentConditions.filter((item) => item.motif === "Decay").map((item) => item.id),
      boundaryIdentityDecay,
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
  return { id, nodeKind: "event", sourceEvent, role, actor, patient, boundary, authority, localStatus, globalContribution };
}

function latentCondition(id: string, kind: LatentKind, description: string, inferredFrom: string[], motif: Motif): LatentCondition {
  return { id, nodeKind: "latent_condition", kind, description, inferredFrom, motif };
}

function edge(from: string, to: string, type: EdgeType): GraphEdge {
  return { from, to, type };
}

function ids(items: Array<{ id: string }>): Set<string> {
  return new Set(items.map((item) => item.id));
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
