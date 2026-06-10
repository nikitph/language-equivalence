import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

type CausalRole =
  | "precondition"
  | "trigger"
  | "mechanism"
  | "authority_source"
  | "legitimacy_failure"
  | "invariant_violation"
  | "local_transition"
  | "downstream_effect"
  | "terminal_outcome";

type CausalEdgeType =
  | "causes"
  | "enables"
  | "blocks"
  | "invalidates"
  | "violates"
  | "preserves"
  | "attempts"
  | "completes"
  | "fails_downstream"
  | "part_of";

type TransitionFamily = "gate" | "eject" | "transform" | "process" | "unknown";
type AuthorityLegitimacy = "valid" | "invalid" | "ambiguous" | "not_applicable";
type EventStatus = "actual" | "blocked" | "pending" | "failed" | "succeeded" | "unknown";
type ProcessScope = "local_transition" | "global_process" | "local_and_global" | "unknown";
type InvariantStatus = "satisfied" | "violated" | "preserved" | "not_applicable";

type ExpectedClass =
  | "AUTHORITY_FAILURE_CAUSES_INVARIANT_VIOLATION"
  | "VALID_AUTHORITY_BAD_OUTCOME"
  | "INVALID_AUTHORITY_ATTEMPT_BLOCKED"
  | "INVARIANT_VIOLATION_WITHOUT_DECEPTIVE_AUTHORITY"
  | "OUTCOME_FAILURE_WITHOUT_INVARIANT_VIOLATION";

type PredictedClass = ExpectedClass | "UNKNOWN_CAUSAL_PATTERN";

interface Frame {
  actor: string | null;
  patient: string | null;
  resource: string | null;
  boundary: string | null;
  authority: string | null;
}

interface Transition {
  family: TransitionFamily;
  type: string;
  direction: string;
  polarity: number;
  stateBefore: string;
  stateAfter: string;
}

interface CausalNode {
  id: string;
  label: string;
  role: CausalRole;
  frame: Frame;
  transition: Transition;
}

interface CausalEdge {
  from: string;
  to: string;
  type: CausalEdgeType;
}

interface CausalIR {
  id: string;
  category: string;
  text: string;
  confidence: number;
  authorityLegitimacy: AuthorityLegitimacy;
  eventStatus: EventStatus;
  processScope: ProcessScope;
  invariantStatus: InvariantStatus;
  terminalOutcome: "success" | "failure" | "blocked" | "ambiguous";
  schemaInsufficiency: string | null;
  graph: {
    nodes: CausalNode[];
    edges: CausalEdge[];
  };
}

interface BenchmarkCase {
  id: string;
  category: string;
  ir: string;
  expected: ExpectedClass;
  expectAuthorityLegitimacy: AuthorityLegitimacy;
  expectInvariantStatus: InvariantStatus;
  expectCompletion: EventStatus;
  expectLocalGlobalSeparation: boolean;
  expectTerminalOutcome: CausalIR["terminalOutcome"];
}

interface ScoreRow extends BenchmarkCase {
  predicted: PredictedClass;
  confidence: number;
  authorityLegitimacyDetected: boolean;
  invariantStatusDetected: boolean;
  transitionCompletionDetected: boolean;
  causalOrderCorrect: boolean;
  localGlobalSeparationCorrect: boolean;
  terminalOutcomeCorrect: boolean;
  graphScore: number;
  overconfidenceFailure: boolean;
  schemaInsufficient: boolean;
  passed: boolean;
}

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const projectRoot = path.resolve(__dirname, "..");
const outputDir = path.join(projectRoot, "artifacts");
const reportPath = path.join(projectRoot, "dlr6_causal_frame_graph.md");
const irPath = path.join(outputDir, "dlr6_causal_frame_graph_ir.json");

const irs: CausalIR[] = [
  graphIr(
    "T1",
    "T",
    "The fake inspector cleared the building, so tenants entered in violation of the safety order.",
    0.78,
    "invalid",
    "actual",
    "local_and_global",
    "violated",
    "failure",
    [
      n("fake_authority", "fake inspector lacks legal inspection authority", "legitimacy_failure", "fake inspector", "building", "occupancy", "safety clearance", "fake inspector", "gate", "claim_clearance", "open", 0.4),
      n("clearance_attempt", "surface clearance is issued", "trigger", "fake inspector", "building", "occupancy", "safety clearance", "fake inspector", "gate", "clear", "open", 0.5),
      n("safety_violation", "safety order is violated", "invariant_violation", "tenants", "building", "occupancy", "safety order", "city inspector", "gate", "enter_despite_order", "open", -0.9),
      n("unsafe_occupancy", "unsafe occupancy follows", "terminal_outcome", "building", "tenants", "occupancy", "safety boundary", "city inspector", "process", "unsafe_occupied", "complete", -0.85),
    ],
    [
      e("fake_authority", "clearance_attempt", "enables"),
      e("fake_authority", "safety_violation", "causes"),
      e("clearance_attempt", "safety_violation", "violates"),
      e("safety_violation", "unsafe_occupancy", "causes"),
    ],
  ),
  graphIr(
    "T2",
    "T",
    "The intern approved the release, which bypassed change control and broke production.",
    0.82,
    "invalid",
    "actual",
    "local_and_global",
    "violated",
    "failure",
    [
      n("missing_authority", "intern lacks release authority", "legitimacy_failure", "intern", "release", "deployment", "release gate", "release manager", "gate", "approve_release", "open", -0.6),
      n("bypass_control", "change-control invariant bypassed", "invariant_violation", "intern", "production", "deployment", "change control", "release manager", "gate", "bypass_change_control", "open", -0.9),
      n("prod_break", "production breaks downstream", "terminal_outcome", "deployment", "production", "service availability", "production health", "ops", "process", "break_production", "fail", -0.95),
    ],
    [
      e("missing_authority", "bypass_control", "causes"),
      e("bypass_control", "prod_break", "causes"),
    ],
  ),

  graphIr(
    "U1",
    "U",
    "The licensed surgeon completed the operation, but the patient later developed an unrelated infection.",
    0.74,
    "valid",
    "actual",
    "global_process",
    "satisfied",
    "failure",
    [
      n("valid_surgeon", "surgeon has authority", "authority_source", "surgeon", "operation", "medical procedure", "medical authority", "hospital", "gate", "authorize_surgery", "open", 0.9),
      n("operation_complete", "operation completed", "local_transition", "surgeon", "operation", "procedure", "surgical process", "surgeon", "process", "complete_operation", "complete", 0.8),
      n("infection", "unrelated infection occurs later", "downstream_effect", "pathogen", "patient", "infection", "health state", null, "process", "develop_infection", "fail", -0.8),
      n("bad_outcome", "patient outcome is bad", "terminal_outcome", "infection", "patient", "health", "recovery", null, "process", "bad_outcome", "fail", -0.9),
    ],
    [
      e("valid_surgeon", "operation_complete", "enables"),
      e("operation_complete", "bad_outcome", "part_of"),
      e("infection", "bad_outcome", "causes"),
    ],
  ),
  graphIr(
    "U2",
    "U",
    "The bank validly approved the loan, but the borrower defaulted months later.",
    0.76,
    "valid",
    "actual",
    "global_process",
    "satisfied",
    "failure",
    [
      n("bank_authority", "bank has lending authority", "authority_source", "bank", "loan", "credit", "credit gate", "bank", "gate", "approve_loan", "open", 0.9),
      n("loan_approved", "loan approval completed", "local_transition", "bank", "borrower", "loan", "credit access", "bank", "gate", "approve", "open", 0.8),
      n("default", "borrower defaults downstream", "downstream_effect", "borrower", "loan", "repayment", "repayment process", null, "process", "default", "fail", -0.85),
      n("credit_loss", "global credit outcome fails", "terminal_outcome", "default", "bank", "capital", "repayment invariant", null, "process", "loss", "fail", -0.8),
    ],
    [
      e("bank_authority", "loan_approved", "enables"),
      e("loan_approved", "default", "part_of"),
      e("default", "credit_loss", "causes"),
    ],
  ),

  graphIr(
    "V1",
    "V",
    "The fake inspector tried to clear the building, but the city blocked the occupancy permit.",
    0.84,
    "invalid",
    "blocked",
    "local_transition",
    "preserved",
    "blocked",
    [
      n("fake_authority", "fake inspector lacks authority", "legitimacy_failure", "fake inspector", "building", "occupancy", "safety clearance", "fake inspector", "gate", "attempt_clear", "open", -0.5),
      n("attempt", "invalid clearance attempt", "trigger", "fake inspector", "building", "occupancy", "safety clearance", "fake inspector", "gate", "try_clear", "attempt", -0.2),
      n("city_block", "city blocks permit", "mechanism", "city", "occupancy permit", "occupancy", "permit gate", "city", "gate", "block_permit", "close", 0.75),
      n("invariant_preserved", "safety invariant preserved", "terminal_outcome", "city", "building", "occupancy", "safety order", "city", "process", "preserve_safety", "complete", 0.8),
    ],
    [
      e("fake_authority", "attempt", "attempts"),
      e("city_block", "attempt", "blocks"),
      e("city_block", "invariant_preserved", "preserves"),
    ],
  ),
  graphIr(
    "V2",
    "V",
    "The chatbot attempted to approve the mortgage, but underwriting rejected it before closing.",
    0.8,
    "invalid",
    "blocked",
    "local_transition",
    "preserved",
    "blocked",
    [
      n("bot_no_authority", "chatbot lacks lending authority", "legitimacy_failure", "chatbot", "mortgage", "credit access", "credit gate", "lender", "gate", "attempt_approve", "open", -0.5),
      n("approval_attempt", "invalid approval attempt", "trigger", "chatbot", "mortgage", "credit access", "credit gate", "chatbot", "gate", "try_approve", "attempt", -0.2),
      n("underwriting_block", "underwriting blocks before closing", "mechanism", "underwriting", "mortgage", "closing", "credit invariant", "lender", "gate", "reject", "close", 0.7),
      n("no_loan", "loan does not close", "terminal_outcome", "underwriting", "mortgage", "credit", "closing", "lender", "process", "no_close", "blocked", 0.65),
    ],
    [
      e("bot_no_authority", "approval_attempt", "attempts"),
      e("underwriting_block", "approval_attempt", "blocks"),
      e("underwriting_block", "no_loan", "preserves"),
    ],
  ),

  graphIr(
    "W1",
    "W",
    "The authorized payment processor charged the frozen account.",
    0.78,
    "valid",
    "actual",
    "local_transition",
    "violated",
    "failure",
    [
      n("processor_authority", "processor has payment authority", "authority_source", "payment processor", "account", "fund transfer", "payment gate", "processor", "gate", "charge", "open", 0.7),
      n("frozen_account", "frozen account invariant", "precondition", "bank", "account", "freeze", "account-freeze invariant", "bank", "gate", "freeze", "close", 0.6),
      n("charge_occurs", "charge succeeds locally", "local_transition", "processor", "account", "funds", "payment process", "processor", "gate", "charge", "open", 0.6),
      n("freeze_violation", "freeze invariant violated", "invariant_violation", "processor", "account", "funds", "account-freeze invariant", "bank", "gate", "charge_frozen_account", "open", -0.9),
    ],
    [
      e("processor_authority", "charge_occurs", "enables"),
      e("frozen_account", "charge_occurs", "blocks"),
      e("charge_occurs", "freeze_violation", "violates"),
    ],
  ),
  graphIr(
    "W2",
    "W",
    "The authorized deployment skipped the required backup step.",
    0.81,
    "valid",
    "actual",
    "local_transition",
    "violated",
    "failure",
    [
      n("release_authority", "release authority is valid", "authority_source", "release manager", "deployment", "release", "release gate", "release manager", "gate", "approve_deploy", "open", 0.8),
      n("backup_required", "backup invariant required", "precondition", "system", "backup", "rollback point", "deployment invariant", "ops", "process", "require_backup", "precondition", 0.7),
      n("deploy_occurs", "deployment occurs", "local_transition", "release manager", "production", "deployment", "deployment process", "release manager", "process", "deploy", "complete", 0.5),
      n("backup_violation", "backup invariant violated", "invariant_violation", "deployment", "backup", "rollback point", "deployment invariant", "ops", "process", "skip_backup", "violate", -0.8),
    ],
    [
      e("release_authority", "deploy_occurs", "enables"),
      e("backup_required", "deploy_occurs", "blocks"),
      e("deploy_occurs", "backup_violation", "violates"),
    ],
  ),

  graphIr(
    "X1",
    "X",
    "The login succeeded, but the dashboard crashed because of a separate rendering bug.",
    0.83,
    "valid",
    "actual",
    "local_and_global",
    "satisfied",
    "failure",
    [
      n("auth_valid", "auth service valid", "authority_source", "auth service", "login", "session", "authentication gate", "auth service", "gate", "authorize_login", "open", 0.8),
      n("login_success", "login succeeds locally", "local_transition", "auth service", "user", "session", "authentication gate", "auth service", "gate", "login", "open", 0.85),
      n("render_bug", "separate rendering bug", "downstream_effect", "frontend", "dashboard", "render tree", "UI process", null, "process", "render_bug", "fail", -0.7),
      n("dashboard_crash", "terminal dashboard failure", "terminal_outcome", "dashboard", "user", "screen", "UI process", null, "process", "crash", "fail", -0.9),
    ],
    [
      e("auth_valid", "login_success", "enables"),
      e("login_success", "dashboard_crash", "part_of"),
      e("render_bug", "dashboard_crash", "causes"),
    ],
  ),
  graphIr(
    "X2",
    "X",
    "The payment authorization succeeded, but shipping failed because the address was incomplete.",
    0.79,
    "valid",
    "actual",
    "local_and_global",
    "satisfied",
    "failure",
    [
      n("payment_authority", "payment processor valid", "authority_source", "payment processor", "payment", "authorization", "payment gate", "processor", "gate", "authorize_payment", "open", 0.85),
      n("payment_success", "payment authorization succeeds", "local_transition", "processor", "order", "payment", "payment gate", "processor", "gate", "authorize", "open", 0.85),
      n("bad_address", "address incomplete", "downstream_effect", "customer", "address", "shipping data", "fulfillment process", null, "process", "missing_address", "fail", -0.65),
      n("shipping_failure", "shipping fails terminally", "terminal_outcome", "shipper", "order", "delivery", "fulfillment process", null, "process", "shipping_fail", "fail", -0.9),
    ],
    [
      e("payment_authority", "payment_success", "enables"),
      e("payment_success", "shipping_failure", "part_of"),
      e("bad_address", "shipping_failure", "causes"),
    ],
  ),
];

const cases: BenchmarkCase[] = [
  ...irs.map((ir): BenchmarkCase => ({
    id: ir.id,
    category: ir.category,
    ir: ir.id,
    expected: expectedForCategory(ir.category),
    expectAuthorityLegitimacy: ir.authorityLegitimacy,
    expectInvariantStatus: ir.invariantStatus,
    expectCompletion: ir.eventStatus,
    expectLocalGlobalSeparation: ir.processScope === "local_and_global",
    expectTerminalOutcome: ir.terminalOutcome,
  })),
];

async function main(): Promise<void> {
  await mkdir(outputDir, { recursive: true });
  const rows = cases.map(scoreCase);
  await writeFile(irPath, `${JSON.stringify(irs, null, 2)}\n`);
  await writeFile(reportPath, buildReport(rows));
  console.log(`DLR-6 report written to ${reportPath}`);
  console.log(`DLR-6 IR JSON written to ${irPath}`);
}

function scoreCase(testCase: BenchmarkCase): ScoreRow {
  const ir = mustGetIr(testCase.ir);
  const predicted = predictClass(ir);
  const authorityLegitimacyDetected = ir.authorityLegitimacy === testCase.expectAuthorityLegitimacy;
  const invariantStatusDetected = ir.invariantStatus === testCase.expectInvariantStatus;
  const transitionCompletionDetected = ir.eventStatus === testCase.expectCompletion;
  const causalOrderCorrect = expectedCausalOrder(ir, testCase.expected);
  const localGlobalSeparationCorrect = (ir.processScope === "local_and_global") === testCase.expectLocalGlobalSeparation;
  const terminalOutcomeCorrect = ir.terminalOutcome === testCase.expectTerminalOutcome;
  const graphScore = avg([
    authorityLegitimacyDetected ? 1 : 0,
    invariantStatusDetected ? 1 : 0,
    transitionCompletionDetected ? 1 : 0,
    causalOrderCorrect ? 1 : 0,
    localGlobalSeparationCorrect ? 1 : 0,
    terminalOutcomeCorrect ? 1 : 0,
  ]);
  const overconfidenceFailure = ir.confidence >= 0.8 && (predicted !== testCase.expected || graphScore < 1);
  const schemaInsufficient = Boolean(ir.schemaInsufficiency);
  const passed =
    predicted === testCase.expected &&
    authorityLegitimacyDetected &&
    invariantStatusDetected &&
    transitionCompletionDetected &&
    causalOrderCorrect &&
    localGlobalSeparationCorrect &&
    terminalOutcomeCorrect &&
    !overconfidenceFailure;

  return {
    ...testCase,
    predicted,
    confidence: ir.confidence,
    authorityLegitimacyDetected,
    invariantStatusDetected,
    transitionCompletionDetected,
    causalOrderCorrect,
    localGlobalSeparationCorrect,
    terminalOutcomeCorrect,
    graphScore,
    overconfidenceFailure,
    schemaInsufficient,
    passed,
  };
}

function predictClass(ir: CausalIR): PredictedClass {
  const hasLegitimacyFailure = hasRole(ir, "legitimacy_failure");
  const hasInvariantViolation = hasRole(ir, "invariant_violation");
  const hasBlock = hasEdge(ir, "blocks");
  const hasFailsDownstream = hasEdge(ir, "fails_downstream") || hasRole(ir, "downstream_effect");

  if (ir.authorityLegitimacy === "invalid" && hasBlock && ir.eventStatus === "blocked") {
    return "INVALID_AUTHORITY_ATTEMPT_BLOCKED";
  }
  if (hasLegitimacyFailure && hasInvariantViolation && ir.invariantStatus === "violated") {
    return "AUTHORITY_FAILURE_CAUSES_INVARIANT_VIOLATION";
  }
  if (ir.authorityLegitimacy === "valid" && hasInvariantViolation && ir.invariantStatus === "violated") {
    return "INVARIANT_VIOLATION_WITHOUT_DECEPTIVE_AUTHORITY";
  }
  if (ir.authorityLegitimacy === "valid" && ir.invariantStatus === "satisfied" && hasFailsDownstream) {
    if (ir.processScope === "local_and_global") return "OUTCOME_FAILURE_WITHOUT_INVARIANT_VIOLATION";
    return "VALID_AUTHORITY_BAD_OUTCOME";
  }
  if (ir.authorityLegitimacy === "valid" && ir.terminalOutcome === "failure") {
    return "VALID_AUTHORITY_BAD_OUTCOME";
  }
  return "UNKNOWN_CAUSAL_PATTERN";
}

function expectedCausalOrder(ir: CausalIR, expected: ExpectedClass): boolean {
  switch (expected) {
    case "AUTHORITY_FAILURE_CAUSES_INVARIANT_VIOLATION":
      return hasPath(ir, "legitimacy_failure", "invariant_violation") && hasPath(ir, "invariant_violation", "terminal_outcome");
    case "VALID_AUTHORITY_BAD_OUTCOME":
      return hasPath(ir, "authority_source", "local_transition") && hasPath(ir, "downstream_effect", "terminal_outcome");
    case "INVALID_AUTHORITY_ATTEMPT_BLOCKED":
      return hasPath(ir, "legitimacy_failure", "trigger") && hasEdge(ir, "blocks") && hasEdge(ir, "preserves");
    case "INVARIANT_VIOLATION_WITHOUT_DECEPTIVE_AUTHORITY":
      return hasPath(ir, "precondition", "invariant_violation") && hasPath(ir, "authority_source", "local_transition");
    case "OUTCOME_FAILURE_WITHOUT_INVARIANT_VIOLATION":
      return hasPath(ir, "authority_source", "local_transition") && hasPath(ir, "downstream_effect", "terminal_outcome");
  }
}

function buildReport(rows: ScoreRow[]): string {
  const categories = [...new Set(rows.map((row) => row.category))];
  const failures = rows.filter((row) => !row.passed);
  const overconfidence = rows.filter((row) => row.overconfidenceFailure);
  const insufficient = rows.filter((row) => row.schemaInsufficient);

  return [
    "# DLR-6 Causal Frame Graph Validation",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Objective",
    "",
    "DLR-6 keeps DLR-5 frame graphs but validates typed causal roles and typed causal edges. The goal is to distinguish bad authority causing violations, valid authority with bad downstream outcomes, blocked invalid attempts, invariant violations without deceptive authority, and unrelated downstream failures.",
    "",
    "## Artifacts",
    "",
    `- Causal IR JSON: \`${path.relative(projectRoot, irPath)}\``,
    "- Report: `dlr6_causal_frame_graph.md`",
    "",
    "## Category Accuracy",
    "",
    "| Category | Cases | Passed | Accuracy | Avg confidence | Avg graph score |",
    "| --- | ---: | ---: | ---: | ---: | ---: |",
    ...categories.map((category) => {
      const categoryRows = rows.filter((row) => row.category === category);
      return `| ${category} | ${categoryRows.length} | ${countPassed(categoryRows)} | ${formatScore(accuracy(categoryRows))} | ${formatScore(avg(categoryRows.map((row) => row.confidence)))} | ${formatScore(avg(categoryRows.map((row) => row.graphScore)))} |`;
    }),
    `| **Overall** | **${rows.length}** | **${countPassed(rows)}** | **${formatScore(accuracy(rows))}** | **${formatScore(avg(rows.map((row) => row.confidence)))}** | **${formatScore(avg(rows.map((row) => row.graphScore)))}** |`,
    "",
    "## Graph-Level Scores",
    "",
    "| Case | Expected | Predicted | Pass | Conf | Authority | Invariant | Completion | Causal order | Local/global | Terminal | Graph score | Overconfident fail | Schema insufficient |",
    "| --- | --- | --- | --- | ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |",
    ...rows.map(
      (row) =>
        `| ${row.id} | ${row.expected} | ${row.predicted} | ${row.passed ? "PASS" : "FAIL"} | ${formatScore(row.confidence)} | ${yn(row.authorityLegitimacyDetected)} | ${yn(row.invariantStatusDetected)} | ${yn(row.transitionCompletionDetected)} | ${yn(row.causalOrderCorrect)} | ${yn(row.localGlobalSeparationCorrect)} | ${yn(row.terminalOutcomeCorrect)} | ${formatScore(row.graphScore)} | ${yn(row.overconfidenceFailure)} | ${yn(row.schemaInsufficient)} |`,
    ),
    "",
    "## Overconfidence Failures",
    "",
    ...(overconfidence.length === 0
      ? ["No overconfidence failures."]
      : overconfidence.map((row) => `- ${row.id}: expected ${row.expected}, predicted ${row.predicted}, confidence=${formatScore(row.confidence)}, graphScore=${formatScore(row.graphScore)}`)),
    "",
    "## Schema Insufficiency Examples",
    "",
    ...(insufficient.length === 0
      ? ["No cases marked schema-insufficient."]
      : insufficient.map((row) => `- ${row.id}: ${mustGetIr(row.ir).schemaInsufficiency}`)),
    "",
    "## Failure Examples",
    "",
    ...(failures.length === 0
      ? ["No failures against the DLR-6 graph criteria."]
      : failures.map((row) => `- ${row.id}: expected ${row.expected}, predicted ${row.predicted}, graphScore=${formatScore(row.graphScore)}`)),
    "",
    "## Causal Graphs",
    "",
    ...irs.flatMap((ir) => [
      `### ${ir.id}: ${ir.text}`,
      "",
      `Authority: \`${ir.authorityLegitimacy}\`; invariant: \`${ir.invariantStatus}\`; event: \`${ir.eventStatus}\`; scope: \`${ir.processScope}\`; terminal: \`${ir.terminalOutcome}\``,
      "",
      "| Node | Role | Label | Family | Type | Polarity |",
      "| --- | --- | --- | --- | --- | ---: |",
      ...ir.graph.nodes.map(
        (node) =>
          `| ${node.id} | ${node.role} | ${node.label} | ${node.transition.family} | ${node.transition.type} | ${formatScore(node.transition.polarity)} |`,
      ),
      "",
      "| From | Edge | To |",
      "| --- | --- | --- |",
      ...ir.graph.edges.map((edge) => `| ${edge.from} | ${edge.type} | ${edge.to} |`),
      "",
    ]),
  ].join("\n");
}

function graphIr(
  id: string,
  category: string,
  text: string,
  confidence: number,
  authorityLegitimacy: AuthorityLegitimacy,
  eventStatus: EventStatus,
  processScope: ProcessScope,
  invariantStatus: InvariantStatus,
  terminalOutcome: CausalIR["terminalOutcome"],
  nodes: CausalNode[],
  edges: CausalEdge[],
  schemaInsufficiency: string | null = null,
): CausalIR {
  return {
    id,
    category,
    text,
    confidence,
    authorityLegitimacy,
    eventStatus,
    processScope,
    invariantStatus,
    terminalOutcome,
    schemaInsufficiency,
    graph: { nodes, edges },
  };
}

function n(
  id: string,
  label: string,
  role: CausalRole,
  actor: string | null,
  patient: string | null,
  resource: string | null,
  boundary: string | null,
  authority: string | null,
  family: TransitionFamily,
  type: string,
  direction: string,
  polarity: number,
): CausalNode {
  return {
    id,
    label,
    role,
    frame: { actor, patient, resource, boundary, authority },
    transition: { family, type, direction, polarity, stateBefore: "before", stateAfter: "after" },
  };
}

function e(from: string, to: string, type: CausalEdgeType): CausalEdge {
  return { from, to, type };
}

function expectedForCategory(category: string): ExpectedClass {
  const map: Record<string, ExpectedClass> = {
    T: "AUTHORITY_FAILURE_CAUSES_INVARIANT_VIOLATION",
    U: "VALID_AUTHORITY_BAD_OUTCOME",
    V: "INVALID_AUTHORITY_ATTEMPT_BLOCKED",
    W: "INVARIANT_VIOLATION_WITHOUT_DECEPTIVE_AUTHORITY",
    X: "OUTCOME_FAILURE_WITHOUT_INVARIANT_VIOLATION",
  };
  const expected = map[category];
  if (!expected) throw new Error(`No expected class for category ${category}`);
  return expected;
}

function hasRole(ir: CausalIR, role: CausalRole): boolean {
  return ir.graph.nodes.some((node) => node.role === role);
}

function hasEdge(ir: CausalIR, type: CausalEdgeType): boolean {
  return ir.graph.edges.some((edge) => edge.type === type);
}

function hasPath(ir: CausalIR, fromRole: CausalRole, toRole: CausalRole): boolean {
  const startIds = ir.graph.nodes.filter((node) => node.role === fromRole).map((node) => node.id);
  const targetIds = new Set(ir.graph.nodes.filter((node) => node.role === toRole).map((node) => node.id));
  const adjacency = new Map<string, string[]>();
  for (const edge of ir.graph.edges) {
    adjacency.set(edge.from, [...(adjacency.get(edge.from) ?? []), edge.to]);
  }

  const queue = [...startIds];
  const seen = new Set<string>();
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || seen.has(current)) continue;
    if (targetIds.has(current)) return true;
    seen.add(current);
    queue.push(...(adjacency.get(current) ?? []));
  }
  return false;
}

function mustGetIr(id: string): CausalIR {
  const item = irs.find((ir) => ir.id === id);
  if (!item) throw new Error(`Unknown IR id: ${id}`);
  return item;
}

function avg(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function countPassed(rows: ScoreRow[]): number {
  return rows.filter((row) => row.passed).length;
}

function accuracy(rows: ScoreRow[]): number {
  return rows.length === 0 ? 0 : countPassed(rows) / rows.length;
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
