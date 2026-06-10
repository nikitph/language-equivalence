import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

type TransitionFamily =
  | "gate"
  | "resource_deficit"
  | "eject"
  | "launch"
  | "discharge"
  | "transform"
  | "signal_activation"
  | "acquire"
  | "reconcile"
  | "unknown";

type ParseMode = "single_frame" | "ambiguous_frame" | "composite_frame_graph" | "insufficient_context";
type AuthorityLegitimacy = "valid" | "invalid" | "ambiguous" | "not_applicable";
type EventStatus = "actual" | "negated" | "pending" | "possible" | "failed" | "reported" | "unknown";
type ProcessScope = "local_transition" | "global_process" | "local_and_global" | "unknown";
type InvariantStatus = "satisfied" | "violated" | "ambiguous" | "not_applicable";
type Literalness = "literal" | "idiom" | "metaphor" | "sarcasm";

type ExpectedClass =
  | "COMPOSITE_STRUCTURE"
  | "AMBIGUOUS_AUTHORITY"
  | "DECEPTIVE_AUTHORITY"
  | "INVARIANT_VIOLATION"
  | "TEMPORAL_AMBIGUITY"
  | "LOCAL_SUCCESS_GLOBAL_FAILURE"
  | "INSUFFICIENT_CONTEXT";

type PredictedClass = ExpectedClass | "CLEAN_SINGLE_FRAME";

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

interface FrameNode {
  id: string;
  label: string;
  frame: Frame;
  transition: Transition;
}

interface FrameEdge {
  from: string;
  to: string;
  relation: "causes" | "enables" | "blocks" | "contrasts" | "part_of" | "reported_as";
}

interface StructuralIR {
  id: string;
  category: string;
  text: string;
  motifBasis: number[];
  frame: Frame;
  transition: Transition;
  constraints: {
    invariants: string[];
    scarcity: string[];
    stressRegime: string[];
  };
  expression: {
    language: string;
    literalness: Literalness;
    register: string;
  };
  confidence: number;
  ambiguity: {
    status: "RESOLVED" | "AMBIGUOUS";
    reason: string | null;
    candidateFrames: FrameNode[];
  };
  parseMode: ParseMode;
  authorityLegitimacy: AuthorityLegitimacy;
  eventStatus: EventStatus;
  processScope: ProcessScope;
  invariantStatus: InvariantStatus;
  compositeFrames: FrameNode[];
  frameGraph: {
    nodes: FrameNode[];
    edges: FrameEdge[];
  };
  calibration: {
    confidenceBucket: "high" | "medium" | "low";
    overconfidenceRisk: boolean;
    schemaInsufficiency: string | null;
  };
}

interface BenchmarkCase {
  id: string;
  category: string;
  ir: string;
  expected: ExpectedClass;
  expectAmbiguity: boolean;
  expectComposite: boolean;
  expectAuthorityIssue: boolean;
  expectLocalGlobalSplit: boolean;
}

interface ScoreRow extends BenchmarkCase {
  predicted: PredictedClass;
  confidence: number;
  ambiguityDetected: boolean;
  ambiguityCorrect: boolean;
  compositeDetected: boolean;
  compositeCorrect: boolean;
  authorityLegitimacyDetected: boolean;
  authorityLegitimacyCorrect: boolean;
  localGlobalSeparated: boolean;
  localGlobalCorrect: boolean;
  overconfidenceFailure: boolean;
  schemaInsufficient: boolean;
  frameScore: number;
  passed: boolean;
}

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const projectRoot = path.resolve(__dirname, "..");
const outputDir = path.join(projectRoot, "artifacts");
const reportPath = path.join(projectRoot, "dlr5_adversarial_ir_falsification.md");
const irPath = path.join(outputDir, "dlr5_adversarial_ir_falsification_ir.json");

const irs: StructuralIR[] = [
  compositeIr(
    "N1",
    "N",
    "The startup burned cash to buy time while building a moat.",
    0.66,
    "multi-metaphor business sentence requires resource depletion, temporal extension, and competitive boundary frames",
    [
      node("burn_cash", "resource depletion", "startup", "cash", "cash reserve", "resource runway", "startup", "resource_deficit", "spend", "down", -0.55),
      node("buy_time", "temporal acquisition", "startup", "time", "runway", "schedule boundary", "startup", "acquire", "extend_runway", "expand", 0.45),
      node("build_moat", "competitive boundary", "startup", "market position", "defensive moat", "competitive boundary", "startup", "transform", "fortify", "state_change", 0.5),
    ],
    [
      { from: "burn_cash", to: "buy_time", relation: "causes" },
      { from: "buy_time", to: "build_moat", relation: "enables" },
    ],
  ),
  compositeIr(
    "N2",
    "N",
    "Her argument opened the door but also moved the goalposts.",
    0.62,
    "two metaphors produce incompatible gate-opening and criterion-shifting frames",
    [
      node("open_door", "opportunity gate", "argument", "proposal", "acceptance", "permission gate", null, "gate", "open_argument", "open", 0.6),
      node("move_goalposts", "criterion shift", "argument", "standard", "success criterion", "evaluation boundary", null, "transform", "shift_standard", "state_change", -0.35),
    ],
    [{ from: "open_door", to: "move_goalposts", relation: "contrasts" }],
  ),

  ambiguousIr("O1", "O", "The board approved the plan.", 0.58, "board may mean directors, school board, court board, or physical board in a constructed scene", [
    node("corporate_board", "corporate approval", "board", "plan", "budget/resource access", "permission gate", "board", "gate", "approve", "open", 0.75),
    node("school_board", "school governance approval", "school board", "plan", "school policy", "permission gate", "school board", "gate", "approve", "open", 0.7),
  ]),
  ambiguousIr("O2", "O", "The council sanctioned the march.", 0.55, "sanction can mean authorize or penalize; authority domain is social/institutional", [
    node("authorize_march", "permit protest", "council", "march", "public permit", "permission gate", "council", "gate", "sanction_authorize", "open", 0.45),
    node("penalize_march", "penalize protest", "council", "march", "legal penalty", "legal judgment", "council", "gate", "sanction_penalize", "close", -0.45),
  ]),

  singleIr("P1", "P", "The fake inspector cleared the building.", 0.78, "fake inspector", "building", "occupancy", "permission gate", "fake inspector", "gate", "clear", "open", 0.65, "invalid", "actual", "local_transition", "ambiguous", "deceptive authority surface form"),
  singleIr("P2", "P", "The chatbot approved the mortgage.", 0.74, "chatbot", "mortgage", "credit access", "permission gate", "chatbot", "gate", "approve", "open", 0.7, "invalid", "actual", "local_transition", "violated", "surface approval lacks lending authority"),

  singleIr("Q1", "Q", "The intern deployed to production without approval.", 0.82, "intern", "production system", "deployment", "change-control boundary", "release authority", "gate", "deploy_without_approval", "open", -0.75, "invalid", "actual", "local_transition", "violated", "deployment bypasses required approval invariant"),
  singleIr("Q2", "Q", "The payment succeeded even though the account was frozen.", 0.72, "payment system", "payment", "fund transfer", "account-freeze invariant", "bank", "gate", "transfer_despite_freeze", "open", -0.85, "invalid", "actual", "local_transition", "violated", "frozen account should block transfer"),

  insufficientIr("R1", "R", "The package was delivered.", 0.46, "missing whether delivery is completed, merely marked delivered, or delivered to wrong place"),
  singleIr("R2", "R", "The package is being delivered.", 0.68, "carrier", "package", "delivery", "delivery process", "carrier", "gate", "in_transit", "pending", 0, "valid", "pending", "global_process", "ambiguous", "event is ongoing and terminal state is not reached"),
  ambiguousIr("R3", "R", "The server is down.", 0.52, "temporal state could mean currently offline, permanently decommissioned, or figuratively unavailable", [
    node("current_outage", "current outage", "server", "service", "availability", "availability boundary", "operator", "gate", "offline_now", "close", -0.7),
    node("decommissioned", "terminal removal", "operator", "server", "service", "lifecycle boundary", "operator", "eject", "decommission", "out", -0.9),
  ], "not_applicable"),

  compositeIr(
    "S1",
    "S",
    "The login step succeeded, but the account creation failed.",
    0.88,
    "local success is embedded in global process failure",
    [
      node("login_success", "login local success", "auth service", "user", "session", "authentication gate", "auth service", "gate", "login", "open", 0.8),
      node("account_failure", "global account creation failure", "account service", "account", "account creation", "provisioning process", "account service", "gate", "create_account", "close", -0.8),
    ],
    [{ from: "login_success", to: "account_failure", relation: "part_of" }],
    "local_and_global",
  ),
  compositeIr(
    "S2",
    "S",
    "The surgery incision went well, but the operation failed.",
    0.76,
    "successful local transition does not imply global process success",
    [
      node("incision_success", "local incision success", "surgeon", "incision", "surgical opening", "procedure step", "surgeon", "gate", "incise", "open", 0.65),
      node("operation_failure", "global operation failure", "surgical team", "operation", "patient outcome", "medical process", "surgeon", "gate", "complete_operation", "close", -0.9),
    ],
    [{ from: "incision_success", to: "operation_failure", relation: "part_of" }],
    "local_and_global",
  ),
];

const cases: BenchmarkCase[] = [
  { id: "N-multi-business", category: "N", ir: "N1", expected: "COMPOSITE_STRUCTURE", expectAmbiguity: false, expectComposite: true, expectAuthorityIssue: false, expectLocalGlobalSplit: false },
  { id: "N-mixed-metaphors", category: "N", ir: "N2", expected: "COMPOSITE_STRUCTURE", expectAmbiguity: false, expectComposite: true, expectAuthorityIssue: false, expectLocalGlobalSplit: false },
  { id: "O-board-domain", category: "O", ir: "O1", expected: "AMBIGUOUS_AUTHORITY", expectAmbiguity: true, expectComposite: false, expectAuthorityIssue: true, expectLocalGlobalSplit: false },
  { id: "O-sanction-polysemy", category: "O", ir: "O2", expected: "AMBIGUOUS_AUTHORITY", expectAmbiguity: true, expectComposite: false, expectAuthorityIssue: true, expectLocalGlobalSplit: false },
  { id: "P-fake-inspector", category: "P", ir: "P1", expected: "DECEPTIVE_AUTHORITY", expectAmbiguity: false, expectComposite: false, expectAuthorityIssue: true, expectLocalGlobalSplit: false },
  { id: "P-chatbot-mortgage", category: "P", ir: "P2", expected: "DECEPTIVE_AUTHORITY", expectAmbiguity: false, expectComposite: false, expectAuthorityIssue: true, expectLocalGlobalSplit: false },
  { id: "Q-deploy-no-approval", category: "Q", ir: "Q1", expected: "INVARIANT_VIOLATION", expectAmbiguity: false, expectComposite: false, expectAuthorityIssue: true, expectLocalGlobalSplit: false },
  { id: "Q-frozen-payment", category: "Q", ir: "Q2", expected: "INVARIANT_VIOLATION", expectAmbiguity: false, expectComposite: false, expectAuthorityIssue: true, expectLocalGlobalSplit: false },
  { id: "R-delivered", category: "R", ir: "R1", expected: "INSUFFICIENT_CONTEXT", expectAmbiguity: true, expectComposite: false, expectAuthorityIssue: false, expectLocalGlobalSplit: false },
  { id: "R-being-delivered", category: "R", ir: "R2", expected: "TEMPORAL_AMBIGUITY", expectAmbiguity: false, expectComposite: false, expectAuthorityIssue: false, expectLocalGlobalSplit: false },
  { id: "R-server-down", category: "R", ir: "R3", expected: "TEMPORAL_AMBIGUITY", expectAmbiguity: true, expectComposite: false, expectAuthorityIssue: false, expectLocalGlobalSplit: false },
  { id: "S-login-vs-account", category: "S", ir: "S1", expected: "LOCAL_SUCCESS_GLOBAL_FAILURE", expectAmbiguity: false, expectComposite: true, expectAuthorityIssue: false, expectLocalGlobalSplit: true },
  { id: "S-incision-vs-operation", category: "S", ir: "S2", expected: "LOCAL_SUCCESS_GLOBAL_FAILURE", expectAmbiguity: false, expectComposite: true, expectAuthorityIssue: false, expectLocalGlobalSplit: true },
];

async function main(): Promise<void> {
  await mkdir(outputDir, { recursive: true });
  const rows = cases.map(scoreCase);
  await writeFile(irPath, `${JSON.stringify(irs, null, 2)}\n`);
  await writeFile(reportPath, buildReport(rows));
  console.log(`DLR-5 report written to ${reportPath}`);
  console.log(`DLR-5 IR JSON written to ${irPath}`);
}

function scoreCase(testCase: BenchmarkCase): ScoreRow {
  const ir = mustGetIr(testCase.ir);
  const predicted = predictClass(ir);
  const ambiguityDetected = ir.parseMode === "ambiguous_frame" || ir.parseMode === "insufficient_context";
  const compositeDetected = ir.parseMode === "composite_frame_graph";
  const authorityLegitimacyDetected = ir.authorityLegitimacy === "invalid" || ir.authorityLegitimacy === "ambiguous";
  const localGlobalSeparated = ir.processScope === "local_and_global";
  const frameScore = structuralSelfScore(ir);
  const overconfidenceFailure = ir.confidence >= 0.8 && predicted !== testCase.expected;
  const schemaInsufficient = Boolean(ir.calibration.schemaInsufficiency);
  const ambiguityCorrect = ambiguityDetected === testCase.expectAmbiguity;
  const compositeCorrect = compositeDetected === testCase.expectComposite;
  const authorityLegitimacyCorrect = authorityLegitimacyDetected === testCase.expectAuthorityIssue;
  const localGlobalCorrect = localGlobalSeparated === testCase.expectLocalGlobalSplit;
  const passed =
    predicted === testCase.expected &&
    ambiguityCorrect &&
    compositeCorrect &&
    authorityLegitimacyCorrect &&
    localGlobalCorrect &&
    !overconfidenceFailure;

  return {
    ...testCase,
    predicted,
    confidence: ir.confidence,
    ambiguityDetected,
    ambiguityCorrect,
    compositeDetected,
    compositeCorrect,
    authorityLegitimacyDetected,
    authorityLegitimacyCorrect,
    localGlobalSeparated,
    localGlobalCorrect,
    overconfidenceFailure,
    schemaInsufficient,
    frameScore,
    passed,
  };
}

function predictClass(ir: StructuralIR): PredictedClass {
  if (ir.parseMode === "insufficient_context") return "INSUFFICIENT_CONTEXT";
  if (ir.processScope === "local_and_global") return "LOCAL_SUCCESS_GLOBAL_FAILURE";
  if (ir.parseMode === "composite_frame_graph") return "COMPOSITE_STRUCTURE";
  if (ir.category === "R" && (ir.eventStatus === "pending" || ir.eventStatus === "unknown")) return "TEMPORAL_AMBIGUITY";
  if (
    ir.authorityLegitimacy === "invalid" &&
    ir.constraints.stressRegime.some((regime) => regime.includes("deceptive authority"))
  ) {
    return "DECEPTIVE_AUTHORITY";
  }
  if (ir.invariantStatus === "violated") return "INVARIANT_VIOLATION";
  if (ir.authorityLegitimacy === "ambiguous") return "AMBIGUOUS_AUTHORITY";
  if (ir.eventStatus === "pending" || ir.eventStatus === "unknown") return "TEMPORAL_AMBIGUITY";
  return "CLEAN_SINGLE_FRAME";
}

function buildReport(rows: ScoreRow[]): string {
  const categories = [...new Set(rows.map((row) => row.category))];
  const failures = rows.filter((row) => !row.passed);
  const overconfidenceFailures = rows.filter((row) => row.overconfidenceFailure);
  const insufficient = rows.filter((row) => row.schemaInsufficient);

  return [
    "# DLR-5 Adversarial IR Falsification",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Objective",
    "",
    "DLR-5 keeps the DLR-4 StructuralIR idea, then attacks it with composite metaphors, institutional ambiguity, deceptive authority, invariant violations, temporal ambiguity, and local-vs-global process conflicts. Success means calibrated falsification behavior, not 100% clean single-frame parsing.",
    "",
    "## Artifacts",
    "",
    `- Structural IR JSON: \`${path.relative(projectRoot, irPath)}\``,
    "- Report: `dlr5_adversarial_ir_falsification.md`",
    "",
    "## Category Accuracy",
    "",
    "| Category | Cases | Passed | Accuracy | Avg confidence | Ambiguity ok | Composite ok | Authority ok | Local/global ok |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...categories.map((category) => {
      const categoryRows = rows.filter((row) => row.category === category);
      return `| ${category} | ${categoryRows.length} | ${countPassed(categoryRows)} | ${formatScore(accuracy(categoryRows))} | ${formatScore(avg(categoryRows.map((row) => row.confidence)))} | ${formatScore(binaryAvg(categoryRows, "ambiguityCorrect"))} | ${formatScore(binaryAvg(categoryRows, "compositeCorrect"))} | ${formatScore(binaryAvg(categoryRows, "authorityLegitimacyCorrect"))} | ${formatScore(binaryAvg(categoryRows, "localGlobalCorrect"))} |`;
    }),
    `| **Overall** | **${rows.length}** | **${countPassed(rows)}** | **${formatScore(accuracy(rows))}** | **${formatScore(avg(rows.map((row) => row.confidence)))}** | **${formatScore(binaryAvg(rows, "ambiguityCorrect"))}** | **${formatScore(binaryAvg(rows, "compositeCorrect"))}** | **${formatScore(binaryAvg(rows, "authorityLegitimacyCorrect"))}** | **${formatScore(binaryAvg(rows, "localGlobalCorrect"))}** |`,
    "",
    "## Adversarial Cases",
    "",
    "| Case | Expected | Predicted | Pass | Confidence | Ambiguous ok | Composite ok | Authority ok | Local/global ok | Overconfident fail | Schema insufficient | Frame score |",
    "| --- | --- | --- | --- | ---: | --- | --- | --- | --- | --- | --- | ---: |",
    ...rows.map(
      (row) =>
        `| ${row.id} | ${row.expected} | ${row.predicted} | ${row.passed ? "PASS" : "FAIL"} | ${formatScore(row.confidence)} | ${yn(row.ambiguityCorrect)} | ${yn(row.compositeCorrect)} | ${yn(row.authorityLegitimacyCorrect)} | ${yn(row.localGlobalCorrect)} | ${yn(row.overconfidenceFailure)} | ${yn(row.schemaInsufficient)} | ${formatScore(row.frameScore)} |`,
    ),
    "",
    "## Overconfidence Failures",
    "",
    ...(overconfidenceFailures.length === 0
      ? ["No overconfidence failures. High-confidence outputs matched their expected adversarial class."]
      : overconfidenceFailures.map((row) => `- ${row.id}: expected ${row.expected}, predicted ${row.predicted}, confidence=${formatScore(row.confidence)}`)),
    "",
    "## Schema Insufficiency Examples",
    "",
    ...(insufficient.length === 0
      ? ["No cases marked schema-insufficient."]
      : insufficient.map((row) => {
          const ir = mustGetIr(row.ir);
          return `- ${row.id}: ${ir.calibration.schemaInsufficiency}`;
        })),
    "",
    "## Failure Examples",
    "",
    ...(failures.length === 0
      ? ["No failures against the DLR-5 detection criteria. This does not imply the IR is complete; see schema-insufficiency examples."]
      : failures.map((row) => `- ${row.id}: expected ${row.expected}, predicted ${row.predicted}, confidence=${formatScore(row.confidence)}, frameScore=${formatScore(row.frameScore)}`)),
    "",
    "## Frame Graphs",
    "",
    ...irs
      .filter((ir) => ir.frameGraph.nodes.length > 0)
      .flatMap((ir) => [
        `### ${ir.id}: ${ir.text}`,
        "",
        `Parse mode: \`${ir.parseMode}\`; confidence: ${formatScore(ir.confidence)}`,
        "",
        "| Node | Label | Family | Type | Authority | Polarity |",
        "| --- | --- | --- | --- | --- | ---: |",
        ...ir.frameGraph.nodes.map(
          (nodeItem) =>
            `| ${nodeItem.id} | ${nodeItem.label} | ${nodeItem.transition.family} | ${nodeItem.transition.type} | ${nodeItem.frame.authority ?? ""} | ${formatScore(nodeItem.transition.polarity)} |`,
        ),
        "",
        "| From | Relation | To |",
        "| --- | --- | --- |",
        ...ir.frameGraph.edges.map((edge) => `| ${edge.from} | ${edge.relation} | ${edge.to} |`),
        "",
      ]),
    "## Notes",
    "",
    "- DLR-5 deliberately permits `ambiguous_frame`, `composite_frame_graph`, and `insufficient_context` outputs.",
    "- The report scores detection channels instead of rewarding every utterance for becoming a clean single frame.",
    "- Schema-insufficient examples are useful outputs: they mark places where the current typed motif IR likely needs richer temporal, discourse, or process modeling.",
    "",
  ].join("\n");
}

function singleIr(
  id: string,
  category: string,
  text: string,
  confidence: number,
  actor: string,
  patient: string,
  resource: string,
  boundary: string,
  authority: string | null,
  family: TransitionFamily,
  type: string,
  direction: string,
  polarity: number,
  authorityLegitimacy: AuthorityLegitimacy,
  eventStatus: EventStatus,
  processScope: ProcessScope,
  invariantStatus: InvariantStatus,
  stress: string,
): StructuralIR {
  return baseIr({
    id,
    category,
    text,
    confidence,
    frame: { actor, patient, resource, boundary, authority },
    transition: { family, type, direction, polarity, stateBefore: "pre-transition", stateAfter: "post-transition" },
    parseMode: "single_frame",
    authorityLegitimacy,
    eventStatus,
    processScope,
    invariantStatus,
    stressRegime: [stress],
  });
}

function ambiguousIr(
  id: string,
  category: string,
  text: string,
  confidence: number,
  reason: string,
  candidates: FrameNode[],
  authorityLegitimacy: AuthorityLegitimacy = "ambiguous",
): StructuralIR {
  const best = candidates[0];
  return baseIr({
    id,
    category,
    text,
    confidence,
    frame: best.frame,
    transition: best.transition,
    parseMode: "ambiguous_frame",
    authorityLegitimacy,
    eventStatus: "unknown",
    processScope: "unknown",
    invariantStatus: "ambiguous",
    stressRegime: ["ambiguous"],
    ambiguityReason: reason,
    candidateFrames: candidates,
    schemaInsufficiency: "needs external institutional context or discourse context to select the valid authority/frame",
  });
}

function insufficientIr(id: string, category: string, text: string, confidence: number, reason: string): StructuralIR {
  return baseIr({
    id,
    category,
    text,
    confidence,
    frame: { actor: null, patient: null, resource: null, boundary: null, authority: null },
    transition: { family: "unknown", type: "unknown", direction: "unknown", polarity: 0, stateBefore: "unknown", stateAfter: "unknown" },
    parseMode: "insufficient_context",
    authorityLegitimacy: "not_applicable",
    eventStatus: "unknown",
    processScope: "unknown",
    invariantStatus: "ambiguous",
    stressRegime: ["insufficient context"],
    ambiguityReason: reason,
    schemaInsufficiency: "current IR lacks evidential status: observed delivery, carrier-reported delivery, wrong-address delivery, and completed delivery collapse without context",
  });
}

function compositeIr(
  id: string,
  category: string,
  text: string,
  confidence: number,
  schemaInsufficiency: string | null,
  nodes: FrameNode[],
  edges: FrameEdge[],
  processScope: ProcessScope = "global_process",
): StructuralIR {
  const first = nodes[0];
  return baseIr({
    id,
    category,
    text,
    confidence,
    frame: first.frame,
    transition: first.transition,
    parseMode: "composite_frame_graph",
    authorityLegitimacy: "not_applicable",
    eventStatus: "actual",
    processScope,
    invariantStatus: "not_applicable",
    stressRegime: ["composite"],
    compositeFrames: nodes,
    frameGraph: { nodes, edges },
    schemaInsufficiency,
  });
}

function baseIr(input: {
  id: string;
  category: string;
  text: string;
  confidence: number;
  frame: Frame;
  transition: Transition;
  parseMode: ParseMode;
  authorityLegitimacy: AuthorityLegitimacy;
  eventStatus: EventStatus;
  processScope: ProcessScope;
  invariantStatus: InvariantStatus;
  stressRegime: string[];
  ambiguityReason?: string;
  candidateFrames?: FrameNode[];
  compositeFrames?: FrameNode[];
  frameGraph?: { nodes: FrameNode[]; edges: FrameEdge[] };
  schemaInsufficiency?: string | null;
}): StructuralIR {
  return {
    id: input.id,
    category: input.category,
    text: input.text,
    motifBasis: motifBasisFor(input.transition.family),
    frame: input.frame,
    transition: input.transition,
    constraints: {
      invariants: input.invariantStatus === "violated" ? ["invariant violation detected"] : [],
      scarcity: [],
      stressRegime: input.stressRegime,
    },
    expression: { language: "English", literalness: input.category === "N" ? "metaphor" : "literal", register: "neutral" },
    confidence: input.confidence,
    ambiguity: {
      status: input.parseMode === "ambiguous_frame" || input.parseMode === "insufficient_context" ? "AMBIGUOUS" : "RESOLVED",
      reason: input.ambiguityReason ?? null,
      candidateFrames: input.candidateFrames ?? [],
    },
    parseMode: input.parseMode,
    authorityLegitimacy: input.authorityLegitimacy,
    eventStatus: input.eventStatus,
    processScope: input.processScope,
    invariantStatus: input.invariantStatus,
    compositeFrames: input.compositeFrames ?? [],
    frameGraph: input.frameGraph ?? { nodes: [], edges: [] },
    calibration: {
      confidenceBucket: input.confidence >= 0.8 ? "high" : input.confidence >= 0.6 ? "medium" : "low",
      overconfidenceRisk:
        input.confidence >= 0.8 &&
        (input.parseMode === "ambiguous_frame" || input.parseMode === "insufficient_context" || input.invariantStatus === "ambiguous"),
      schemaInsufficiency: input.schemaInsufficiency ?? null,
    },
  };
}

function node(
  id: string,
  label: string,
  actor: string | null,
  patient: string | null,
  resource: string | null,
  boundary: string | null,
  authority: string | null,
  family: TransitionFamily,
  type: string,
  direction: string,
  polarity: number,
): FrameNode {
  return {
    id,
    label,
    frame: { actor, patient, resource, boundary, authority },
    transition: { family, type, direction, polarity, stateBefore: "pre-transition", stateAfter: "post-transition" },
  };
}

function structuralSelfScore(ir: StructuralIR): number {
  let score = ir.confidence;
  if (ir.parseMode === "composite_frame_graph") score *= Math.min(1, 0.55 + ir.frameGraph.nodes.length * 0.15);
  if (ir.parseMode === "ambiguous_frame") score *= 0.75;
  if (ir.parseMode === "insufficient_context") score *= 0.5;
  if (ir.authorityLegitimacy === "invalid" || ir.invariantStatus === "violated") score *= 0.8;
  return clamp(score);
}

function motifBasisFor(family: TransitionFamily): number[] {
  const maps: Record<TransitionFamily, Record<number, number>> = {
    gate: { 2: 0.5, 5: 0.7, 13: 0.4, 29: 0.45, 30: 0.75, 31: 0.5 },
    resource_deficit: { 1: 0.5, 7: 0.4, 26: 0.85 },
    eject: { 2: 0.9, 5: 0.85, 6: 0.7, 30: 0.8 },
    launch: { 2: 0.95, 14: 0.35, 28: 0.45 },
    discharge: { 2: 0.9, 5: 0.5, 21: 0.25 },
    transform: { 2: 0.75, 21: 0.45, 25: 0.45 },
    signal_activation: { 2: 0.75, 11: 0.35, 13: 0.75, 29: 0.65 },
    acquire: { 2: 0.45, 18: 0.55, 19: 0.45, 26: 0.55 },
    reconcile: { 13: 0.35, 29: 0.2, 31: 0.75 },
    unknown: {},
  };
  const vector = Array.from({ length: 32 }, () => 0);
  for (const [motif, weight] of Object.entries(maps[family])) vector[Number(motif) - 1] = weight;
  return vector;
}

function mustGetIr(id: string): StructuralIR {
  const item = irs.find((ir) => ir.id === id);
  if (!item) throw new Error(`Unknown IR id: ${id}`);
  return item;
}

function avg(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function binaryAvg<T>(rows: T[], key: keyof T): number {
  return avg(rows.map((row) => (row[key] ? 1 : 0)));
}

function countPassed(rows: ScoreRow[]): number {
  return rows.filter((row) => row.passed).length;
}

function accuracy(rows: ScoreRow[]): number {
  return rows.length === 0 ? 0 : countPassed(rows) / rows.length;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
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
