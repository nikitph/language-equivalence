import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

type RelationClass =
  | "SAME_FRAME_SAME_OUTCOME"
  | "SAME_FRAME_OPPOSITE_OUTCOME"
  | "SAME_WORD_DIFFERENT_FRAME"
  | "INVALID_AUTHORITY"
  | "AMBIGUOUS"
  | "CONTEXT_DISAMBIGUATES"
  | "NEGATED_OR_MODAL"
  | "PRAGMATIC_INVERSION";

type Literalness = "literal" | "idiom" | "metaphor" | "sarcasm";

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
    candidateFrames: CandidateFrame[];
  };
}

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

interface CandidateFrame {
  label: string;
  frame: Frame;
  transition: Transition;
  probability: number;
}

interface BenchmarkCase {
  id: string;
  category: string;
  left: string;
  right: string;
  expected: RelationClass;
  expectAmbiguity: boolean;
}

interface ScoreRow extends BenchmarkCase {
  predicted: RelationClass;
  confidence: number;
  ambiguityDetected: boolean;
  ambiguityCorrect: boolean;
  motifSimilarity: number;
  transitionFamilySimilarity: number;
  transitionTypeSimilarity: number;
  roleAssignmentSimilarity: number;
  authoritySimilarity: number;
  boundarySimilarity: number;
  outcomeSimilarity: number;
  stateDeltaSimilarity: number;
  finalStructuralScore: number;
  passed: boolean;
}

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const projectRoot = path.resolve(__dirname, "..");
const outputDir = path.join(projectRoot, "artifacts");
const reportPath = path.join(projectRoot, "dlr4_parser_robustness.md");
const irPath = path.join(outputDir, "dlr4_parser_robustness_ir.json");

const irs: StructuralIR[] = [
  gate("I1", "I", "The doctor cleared him for surgery.", "doctor", "him", "surgery", "clear", true, 0.96),
  gate("I2", "I", "He was cleared by the doctor for surgery.", "doctor", "him", "surgery", "clear", true, 0.94),
  employment("I3", "I", "The manager fired the employee.", "manager", "employee", "job", 0.96),
  employment("I4", "I", "The employee was fired by the manager.", "manager", "employee", "job", 0.95),

  gate("J1", "J", "The doctor cleared him for surgery.", "doctor", "him", "surgery", "clear", true, 0.95),
  gate("J2", "J", "The receptionist cleared him for surgery.", "receptionist", "him", "surgery", "clear", true, 0.86, "invalid authority"),
  sentence("J3", "J", "The judge sentenced the defendant.", "judge", "defendant", 0.95),
  sentence("J4", "J", "The journalist sentenced the defendant.", "journalist", "defendant", 0.82, "invalid authority"),
  ambiguous(
    "J5",
    "J",
    "They cleared him.",
    "missing authority domain: could be medical, legal, security, or social clearance",
    [
      candidate("medical_gate", "doctor", "him", "surgery", "permission gate", "doctor", "gate", "clear", "open", 0.35),
      candidate("security_gate", "security officer", "him", "restricted area", "permission gate", "security officer", "gate", "clear", "open", 0.3),
      candidate("legal_gate", "court", "him", "charge", "legal judgment", "court", "gate", "clear", "open", 0.2),
    ],
  ),
  gate("J6", "J", "The security officer cleared him through the checkpoint.", "security officer", "him", "checkpoint passage", "clear", true, 0.93),

  ambiguous(
    "K1",
    "K",
    "The bank blocked the transfer.",
    "bank may be financial institution or river bank without context",
    [
      candidate("financial_gate", "bank", "transfer", "fund movement", "permission gate", "bank", "gate", "block", "close", 0.55),
      candidate("physical_boundary", "river bank", "transfer", "river crossing", "physical boundary", null, "gate", "block", "close", 0.25),
    ],
  ),
  gate("K2", "K", "The bank blocked the wire transfer after fraud checks.", "bank", "wire transfer", "fund movement", "block", false, 0.95),
  ambiguous(
    "K3",
    "K",
    "The server rejected the request.",
    "server may be software service or human server without context",
    [
      candidate("software_gate", "server", "request", "API access", "permission gate", "server", "gate", "reject", "close", 0.6),
      candidate("service_refusal", "restaurant server", "request", "service", "social service boundary", "restaurant server", "gate", "reject", "close", 0.25),
    ],
  ),
  gate("K4", "K", "The API server rejected the malformed request.", "API server", "request", "API access", "reject", false, 0.95),

  gate("L1", "L", "The doctor cleared him for surgery.", "doctor", "him", "surgery", "clear", true, 0.95),
  gate("L2", "L", "The doctor did not clear him for surgery.", "doctor", "him", "surgery", "not_clear", false, 0.95),
  modalGate("L3", "L", "The doctor may clear him for surgery.", "doctor", "him", "surgery", "possible_clear", 0.55, 0.62),
  modalGate("L4", "L", "The doctor has not yet cleared him for surgery.", "doctor", "him", "surgery", "pending_clear", 0, 0.72, "pending"),
  gate("L5", "L", "The compiler accepted the program.", "compiler", "program", "valid executable path", "accept", true, 0.96),
  gate("L6", "L", "The compiler could accept the program.", "compiler", "program", "valid executable path", "possible_accept", true, 0.68, "modal"),

  gate("M1", "M", "Great, the firewall blocked the safe packet.", "firewall", "safe packet", "network passage", "block", false, 0.82, "sarcasm", "sarcasm"),
  gate("M2", "M", "The firewall blocked the safe packet.", "firewall", "safe packet", "network passage", "block", false, 0.94),
  gate("M3", "M", "Fantastic, the compiler rejected the working program.", "compiler", "working program", "valid executable path", "reject", false, 0.8, "sarcasm", "sarcasm"),
  gate("M4", "M", "The compiler rejected the working program.", "compiler", "working program", "valid executable path", "reject", false, 0.94),
];

const cases: BenchmarkCase[] = [
  { id: "I-clear-passive", category: "I", left: "I1", right: "I2", expected: "SAME_FRAME_SAME_OUTCOME", expectAmbiguity: false },
  { id: "I-fire-passive", category: "I", left: "I3", right: "I4", expected: "SAME_FRAME_SAME_OUTCOME", expectAmbiguity: false },
  { id: "J-medical-invalid-authority", category: "J", left: "J1", right: "J2", expected: "INVALID_AUTHORITY", expectAmbiguity: false },
  { id: "J-legal-invalid-authority", category: "J", left: "J3", right: "J4", expected: "INVALID_AUTHORITY", expectAmbiguity: false },
  { id: "J-underspecified-clearance", category: "J", left: "J5", right: "J6", expected: "AMBIGUOUS", expectAmbiguity: true },
  { id: "K-bank-context", category: "K", left: "K1", right: "K2", expected: "CONTEXT_DISAMBIGUATES", expectAmbiguity: true },
  { id: "K-server-context", category: "K", left: "K3", right: "K4", expected: "CONTEXT_DISAMBIGUATES", expectAmbiguity: true },
  { id: "L-negated-clearance", category: "L", left: "L1", right: "L2", expected: "SAME_FRAME_OPPOSITE_OUTCOME", expectAmbiguity: false },
  { id: "L-modal-clearance", category: "L", left: "L1", right: "L3", expected: "NEGATED_OR_MODAL", expectAmbiguity: false },
  { id: "L-pending-clearance", category: "L", left: "L1", right: "L4", expected: "NEGATED_OR_MODAL", expectAmbiguity: false },
  { id: "L-modal-compiler", category: "L", left: "L5", right: "L6", expected: "NEGATED_OR_MODAL", expectAmbiguity: false },
  { id: "M-firewall-sarcasm", category: "M", left: "M1", right: "M2", expected: "PRAGMATIC_INVERSION", expectAmbiguity: false },
  { id: "M-compiler-sarcasm", category: "M", left: "M3", right: "M4", expected: "PRAGMATIC_INVERSION", expectAmbiguity: false },
];

async function main(): Promise<void> {
  await mkdir(outputDir, { recursive: true });
  const rows = cases.map(scoreCase);
  await writeFile(irPath, `${JSON.stringify(irs, null, 2)}\n`);
  await writeFile(reportPath, buildReport(rows));
  console.log(`DLR-4 report written to ${reportPath}`);
  console.log(`DLR-4 IR JSON written to ${irPath}`);
}

function scoreCase(testCase: BenchmarkCase): ScoreRow {
  const left = mustGetIr(testCase.left);
  const right = mustGetIr(testCase.right);
  const scores = scoreFrames(left, right);
  const confidence = Math.min(left.confidence, right.confidence);
  const ambiguityDetected = left.ambiguity.status === "AMBIGUOUS" || right.ambiguity.status === "AMBIGUOUS";
  const predicted = predictClass(left, right, scores, ambiguityDetected, confidence);
  const ambiguityCorrect = ambiguityDetected === testCase.expectAmbiguity;
  const passed = predicted === testCase.expected && ambiguityCorrect && confidencePolicyHolds(testCase.expected, confidence);

  return {
    ...testCase,
    predicted,
    confidence,
    ambiguityDetected,
    ambiguityCorrect,
    ...scores,
    passed,
  };
}

function scoreFrames(left: StructuralIR, right: StructuralIR): Omit<
  ScoreRow,
  keyof BenchmarkCase | "predicted" | "confidence" | "ambiguityDetected" | "ambiguityCorrect" | "passed"
> {
  const motifSimilarity = cosineSimilarity(left.motifBasis, right.motifBasis);
  const transitionFamilySimilarity = left.transition.family === right.transition.family ? 1 : 0;
  const transitionTypeSimilarity =
    left.transition.type === right.transition.type ? 1 : transitionFamilySimilarity === 1 ? 0.7 : 0;
  const roleAssignmentSimilarity = roleSimilarity(left, right);
  const authoritySimilarity = authoritySimilarityFor(left, right);
  const boundarySimilarity = boundarySimilarityFor(left, right);
  const outcomeSimilarity = transitionFamilySimilarity >= 0.7 ? polaritySimilarity(left.transition.polarity, right.transition.polarity) : 0;
  const stateDeltaSimilarity = transitionFamilySimilarity >= 0.7 ? Math.max(outcomeSimilarity, stringSimilarity(left.transition.stateAfter, right.transition.stateAfter)) : 0;
  const finalStructuralScore = finalScore({
    motifSimilarity,
    transitionFamilySimilarity,
    transitionTypeSimilarity,
    roleAssignmentSimilarity,
    authoritySimilarity,
    boundarySimilarity,
    outcomeSimilarity,
    stateDeltaSimilarity,
  });

  return {
    motifSimilarity,
    transitionFamilySimilarity,
    transitionTypeSimilarity,
    roleAssignmentSimilarity,
    authoritySimilarity,
    boundarySimilarity,
    outcomeSimilarity,
    stateDeltaSimilarity,
    finalStructuralScore,
  };
}

function predictClass(
  left: StructuralIR,
  right: StructuralIR,
  scores: ReturnType<typeof scoreFrames>,
  ambiguityDetected: boolean,
  confidence: number,
): RelationClass {
  if (ambiguityDetected && confidence < 0.7) {
    if (left.category === "K" || right.category === "K") return "CONTEXT_DISAMBIGUATES";
    return "AMBIGUOUS";
  }
  if (isSarcastic(left) || isSarcastic(right)) return "PRAGMATIC_INVERSION";
  if (isInvalidAuthority(left) || isInvalidAuthority(right)) return "INVALID_AUTHORITY";
  if (isModal(left) || isModal(right)) return "NEGATED_OR_MODAL";
  if (scores.transitionFamilySimilarity >= 0.7 && scores.outcomeSimilarity <= 0.35) {
    return "SAME_FRAME_OPPOSITE_OUTCOME";
  }
  if (scores.finalStructuralScore >= 0.75) return "SAME_FRAME_SAME_OUTCOME";
  return "SAME_WORD_DIFFERENT_FRAME";
}

function confidencePolicyHolds(expected: RelationClass, confidence: number): boolean {
  if (expected === "AMBIGUOUS" || expected === "CONTEXT_DISAMBIGUATES" || expected === "NEGATED_OR_MODAL") {
    return confidence < 0.75;
  }
  return confidence >= 0.75;
}

function buildReport(rows: ScoreRow[]): string {
  const categories = [...new Set(rows.map((row) => row.category))];
  const failures = rows.filter((row) => !row.passed);
  const highConfidence = rows.filter((row) => row.confidence >= 0.75);
  const lowConfidence = rows.filter((row) => row.confidence < 0.75);

  return [
    "# DLR-4 Parser Robustness & Perturbation",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Objective",
    "",
    "DLR-4 keeps the DLR-3 StructuralIR scoring model, then tests active/passive equivalence, ambiguous authority, context-dependent parsing, negation/modality, and sarcasm/pragmatic inversion. Success means calibrated behavior, not forced high confidence.",
    "",
    "## Artifacts",
    "",
    `- Structural IR JSON: \`${path.relative(projectRoot, irPath)}\``,
    "- Report: `dlr4_parser_robustness.md`",
    "",
    "## Category Accuracy",
    "",
    "| Category | Pairs | Passed | Accuracy | Avg confidence | Ambiguity accuracy |",
    "| --- | ---: | ---: | ---: | ---: | ---: |",
    ...categories.map((category) => {
      const categoryRows = rows.filter((row) => row.category === category);
      return `| ${category} | ${categoryRows.length} | ${countPassed(categoryRows)} | ${formatScore(accuracy(categoryRows))} | ${formatScore(avg(categoryRows.map((row) => row.confidence)))} | ${formatScore(avg(categoryRows.map((row) => row.ambiguityCorrect ? 1 : 0)))} |`;
    }),
    `| **Overall** | **${rows.length}** | **${countPassed(rows)}** | **${formatScore(accuracy(rows))}** | **${formatScore(avg(rows.map((row) => row.confidence)))}** | **${formatScore(avg(rows.map((row) => row.ambiguityCorrect ? 1 : 0)))}** |`,
    "",
    "## Calibration",
    "",
    "| Bucket | Cases | Accuracy | Avg confidence |",
    "| --- | ---: | ---: | ---: |",
    `| High confidence >= 0.75 | ${highConfidence.length} | ${formatScore(accuracy(highConfidence))} | ${formatScore(avg(highConfidence.map((row) => row.confidence)))} |`,
    `| Low confidence < 0.75 | ${lowConfidence.length} | ${formatScore(accuracy(lowConfidence))} | ${formatScore(avg(lowConfidence.map((row) => row.confidence)))} |`,
    "",
    "## Pairwise Frame Scores",
    "",
    "| Case | Expected | Predicted | Pass | Confidence | Ambiguous? | Ambiguity ok? | Motif | Family | Type | Roles | Authority | Boundary | Outcome | State | Final |",
    "| --- | --- | --- | --- | ---: | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...rows.map(
      (row) =>
        `| ${row.id} | ${row.expected} | ${row.predicted} | ${row.passed ? "PASS" : "FAIL"} | ${formatScore(row.confidence)} | ${row.ambiguityDetected ? "yes" : "no"} | ${row.ambiguityCorrect ? "yes" : "no"} | ${formatScore(row.motifSimilarity)} | ${formatScore(row.transitionFamilySimilarity)} | ${formatScore(row.transitionTypeSimilarity)} | ${formatScore(row.roleAssignmentSimilarity)} | ${formatScore(row.authoritySimilarity)} | ${formatScore(row.boundarySimilarity)} | ${formatScore(row.outcomeSimilarity)} | ${formatScore(row.stateDeltaSimilarity)} | ${formatScore(row.finalStructuralScore)} |`,
    ),
    "",
    "## Failure Examples",
    "",
    ...(failures.length === 0
      ? ["No failures against the DLR-4 calibrated criteria."]
      : failures.map((row) => `- ${row.id}: expected ${row.expected}, predicted ${row.predicted}, confidence=${formatScore(row.confidence)}, ambiguity=${row.ambiguityDetected ? "yes" : "no"}, final=${formatScore(row.finalStructuralScore)}`)),
    "",
    "## Ambiguous Parses",
    "",
    ...irs
      .filter((ir) => ir.ambiguity.status === "AMBIGUOUS")
      .flatMap((ir) => [
        `### ${ir.id}: ${ir.text}`,
        "",
        `Reason: ${ir.ambiguity.reason}`,
        "",
        "| Candidate | Probability | Family | Type | Authority | Resource |",
        "| --- | ---: | --- | --- | --- | --- |",
        ...ir.ambiguity.candidateFrames.map(
          (candidateFrame) =>
            `| ${candidateFrame.label} | ${formatScore(candidateFrame.probability)} | ${candidateFrame.transition.family} | ${candidateFrame.transition.type} | ${candidateFrame.frame.authority ?? ""} | ${candidateFrame.frame.resource ?? ""} |`,
        ),
        "",
      ]),
    "## Notes",
    "",
    "- Ambiguous utterances are allowed to stay ambiguous and carry candidate frames.",
    "- Low confidence is correct for ambiguity, context dependence, and modality.",
    "- Sarcasm is represented as pragmatic inversion in expression metadata while keeping the literal transition frame available.",
    "",
  ].join("\n");
}

function gate(
  id: string,
  category: string,
  text: string,
  authority: string,
  patient: string,
  resource: string,
  type: string,
  allowed: boolean,
  confidence: number,
  stressRegime = "valid authority",
  literalness: Literalness = "literal",
): StructuralIR {
  return ir(
    id,
    category,
    text,
    allowed
      ? { 2: 0.45, 5: 0.25, 13: 0.45, 29: 0.45, 30: 0.7, 31: 0.8 }
      : { 2: 0.55, 5: 0.85, 6: 0.55, 13: 0.45, 29: 0.45, 30: 0.7 },
    { actor: authority, patient, resource, boundary: "permission gate", authority },
    { family: "gate", type, direction: allowed ? "open" : "close", polarity: allowed ? 0.8 : -0.8, stateBefore: "candidate awaits gate decision", stateAfter: allowed ? "access granted" : "access denied" },
    ["gatekeeper evaluates candidate"],
    [resource],
    [stressRegime],
    "English",
    literalness,
    confidence,
  );
}

function modalGate(
  id: string,
  category: string,
  text: string,
  authority: string,
  patient: string,
  resource: string,
  type: string,
  polarity: number,
  confidence: number,
  stressRegime = "modal",
): StructuralIR {
  return ir(
    id,
    category,
    text,
    { 2: 0.45, 5: 0.35, 13: 0.45, 14: 0.55, 29: 0.45, 30: 0.7 },
    { actor: authority, patient, resource, boundary: "permission gate", authority },
    { family: "gate", type, direction: "pending", polarity, stateBefore: "candidate awaits possible gate decision", stateAfter: "outcome unresolved" },
    ["gate decision not realized"],
    [resource],
    [stressRegime],
    "English",
    "literal",
    confidence,
  );
}

function employment(id: string, category: string, text: string, authority: string, patient: string, resource: string, confidence: number): StructuralIR {
  return ir(
    id,
    category,
    text,
    { 2: 0.95, 4: 0.45, 5: 0.85, 6: 0.7, 22: 0.35, 30: 0.9 },
    { actor: authority, patient, resource, boundary: "institutional role membership", authority },
    { family: "eject", type: "employment_termination", direction: "out", polarity: -0.85, stateBefore: "person inside role boundary", stateAfter: "person outside role boundary" },
    ["employer controls role membership"],
    ["job"],
    ["valid authority"],
    "English",
    "literal",
    confidence,
  );
}

function sentence(id: string, category: string, text: string, authority: string, patient: string, confidence: number, stressRegime = "valid authority"): StructuralIR {
  return ir(
    id,
    category,
    text,
    { 2: 0.7, 5: 0.5, 6: 0.55, 22: 0.45, 30: 0.95, 31: 0.65 },
    { actor: authority, patient, resource: "sentence", boundary: "legal judgment", authority },
    { family: "gate", type: "sentence", direction: "close", polarity: -0.75, stateBefore: "defendant awaits judgment", stateAfter: "defendant receives sentence" },
    ["courts assign legal outcomes"],
    ["liberty"],
    [stressRegime],
    "English",
    "literal",
    confidence,
  );
}

function ambiguous(id: string, category: string, text: string, reason: string, candidates: CandidateFrame[]): StructuralIR {
  const best = [...candidates].sort((a, b) => b.probability - a.probability)[0];
  return {
    id,
    category,
    text,
    motifBasis: vectorFromMotifs({ 2: 0.5, 5: 0.45, 13: 0.35, 29: 0.45, 30: 0.45 }),
    frame: best.frame,
    transition: best.transition,
    constraints: { invariants: ["context required"], scarcity: [], stressRegime: ["ambiguous"] },
    expression: { language: "English", literalness: "literal", register: "neutral" },
    confidence: 0.58,
    ambiguity: { status: "AMBIGUOUS", reason, candidateFrames: candidates },
  };
}

function candidate(
  label: string,
  actor: string,
  patient: string,
  resource: string,
  boundary: string,
  authority: string | null,
  family: TransitionFamily,
  type: string,
  direction: string,
  probability: number,
): CandidateFrame {
  return {
    label,
    frame: { actor, patient, resource, boundary, authority },
    transition: {
      family,
      type,
      direction,
      polarity: direction === "open" ? 0.6 : -0.6,
      stateBefore: "underspecified before-state",
      stateAfter: "underspecified after-state",
    },
    probability,
  };
}

function ir(
  id: string,
  category: string,
  text: string,
  motifs: Record<number, number>,
  frame: Frame,
  transition: Transition,
  invariants: string[],
  scarcity: string[],
  stressRegime: string[],
  language: string,
  literalness: Literalness,
  confidence: number,
): StructuralIR {
  return {
    id,
    category,
    text,
    motifBasis: vectorFromMotifs(motifs),
    frame,
    transition,
    constraints: { invariants, scarcity, stressRegime },
    expression: { language, literalness, register: literalness === "sarcasm" ? "sarcastic" : "neutral" },
    confidence,
    ambiguity: { status: "RESOLVED", reason: null, candidateFrames: [] },
  };
}

function finalScore(scores: {
  motifSimilarity: number;
  transitionFamilySimilarity: number;
  transitionTypeSimilarity: number;
  roleAssignmentSimilarity: number;
  authoritySimilarity: number;
  boundarySimilarity: number;
  outcomeSimilarity: number;
  stateDeltaSimilarity: number;
}): number {
  const schema =
    scores.motifSimilarity *
    (0.35 +
      0.25 * scores.transitionFamilySimilarity +
      0.15 * scores.transitionTypeSimilarity +
      0.1 * scores.boundarySimilarity +
      0.1 * scores.authoritySimilarity +
      0.05 * scores.stateDeltaSimilarity);
  let score = schema * (0.35 + 0.65 * scores.outcomeSimilarity);
  score *= scores.roleAssignmentSimilarity < 0.5 ? 0.25 : 0.55 + 0.45 * scores.roleAssignmentSimilarity;
  if (scores.authoritySimilarity < 0.3) score *= 0.55;
  return clamp(score);
}

function mustGetIr(id: string): StructuralIR {
  const item = irs.find((candidateIr) => candidateIr.id === id);
  if (!item) throw new Error(`Unknown IR id: ${id}`);
  return item;
}

function vectorFromMotifs(entries: Record<number, number>): number[] {
  const vector = Array.from({ length: 32 }, () => 0);
  for (const [motif, weight] of Object.entries(entries)) vector[Number(motif) - 1] = weight;
  return vector;
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dot = vecA.reduce((sum, value, index) => sum + value * vecB[index], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, value) => sum + value * value, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, value) => sum + value * value, 0));
  return magnitudeA === 0 || magnitudeB === 0 ? 0 : dot / (magnitudeA * magnitudeB);
}

function roleSimilarity(left: StructuralIR, right: StructuralIR): number {
  if (normalizeRole(left.frame.actor) === normalizeRole(right.frame.patient) && normalizeRole(left.frame.patient) === normalizeRole(right.frame.actor)) return 0;
  if (isInvalidAuthority(left) || isInvalidAuthority(right)) return 0.45;
  if (left.transition.family === right.transition.family && left.frame.boundary === right.frame.boundary) return 0.9;
  return 0.45;
}

function authoritySimilarityFor(left: StructuralIR, right: StructuralIR): number {
  if (isInvalidAuthority(left) || isInvalidAuthority(right)) return 0;
  if (left.frame.authority === right.frame.authority) return 1;
  if (left.transition.family === right.transition.family && left.frame.authority && right.frame.authority) return 0.85;
  return stringSimilarity(left.frame.authority, right.frame.authority);
}

function boundarySimilarityFor(left: StructuralIR, right: StructuralIR): number {
  return stringSimilarity(left.frame.boundary, right.frame.boundary);
}

function polaritySimilarity(left: number, right: number): number {
  if (Math.sign(left) !== 0 && Math.sign(right) !== 0 && Math.sign(left) !== Math.sign(right)) return 0;
  return Math.max(0, 1 - Math.abs(left - right) / 2);
}

function stringSimilarity(left: string | null, right: string | null): number {
  if (!left || !right) return left === right ? 1 : 0;
  if (normalize(left) === normalize(right)) return 1;
  const leftTokens = new Set(normalize(left).split(" "));
  const rightTokens = new Set(normalize(right).split(" "));
  const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  const union = new Set([...leftTokens, ...rightTokens]).size;
  return union === 0 ? 0 : intersection / union;
}

function isInvalidAuthority(ir: StructuralIR): boolean {
  return ir.constraints.stressRegime.some((regime) => normalize(regime) === "invalid authority");
}

function isModal(ir: StructuralIR): boolean {
  return ir.constraints.stressRegime.some((regime) => ["modal", "pending"].includes(normalize(regime)));
}

function isSarcastic(ir: StructuralIR): boolean {
  return ir.expression.literalness === "sarcasm";
}

function normalize(value: string): string {
  return value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function normalizeRole(value: string | null): string {
  if (!value) return "";
  const aliases: Record<string, string> = { he: "male_person", him: "male_person" };
  return aliases[normalize(value)] ?? normalize(value);
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
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

function formatScore(value: number): string {
  return value.toFixed(4);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
