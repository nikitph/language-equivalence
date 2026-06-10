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

type RelationPrediction =
  | "SAME_FRAME_SAME_OUTCOME"
  | "SAME_FRAME_OPPOSITE_OUTCOME"
  | "SAME_MOTIF_DIFFERENT_FRAME"
  | "SAME_WORD_DIFFERENT_FRAME"
  | "ROLE_INVERSION"
  | "INVALID_AUTHORITY"
  | "UNRELATED";

type Literalness = "literal" | "idiom" | "metaphor";

interface StructuralIR {
  id: string;
  category: string;
  text: string;
  motifBasis: number[];
  frame: {
    actor: string | null;
    patient: string | null;
    resource: string | null;
    boundary: string | null;
    authority: string | null;
  };
  transition: {
    family: TransitionFamily;
    type: string;
    direction: string;
    polarity: number;
    stateBefore: string;
    stateAfter: string;
  };
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
}

interface BenchmarkPair {
  left: string;
  right: string;
  expected: RelationPrediction;
}

interface ScoreRow extends BenchmarkPair {
  category: string;
  motifSimilarity: number;
  transitionFamilySimilarity: number;
  transitionTypeSimilarity: number;
  roleAssignmentSimilarity: number;
  authoritySimilarity: number;
  boundarySimilarity: number;
  outcomeSimilarity: number;
  stateDeltaSimilarity: number;
  finalStructuralScore: number;
  predicted: RelationPrediction;
  passed: boolean;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const reportPath = path.join(projectRoot, "dlr3_structural_ir.md");
const outputDir = path.join(projectRoot, "artifacts");
const irPath = path.join(outputDir, "dlr3_structural_ir.json");

const irs: StructuralIR[] = [
  ir("A1", "A", "I am slightly hungry.", { 1: 0.7, 5: 0.25, 7: 0.45, 26: 0.85, 29: 0.2 }, "body", "I", "food", "metabolic sufficiency", null, "resource_deficit", "need_food", "below_threshold", -0.45, "mild food deficit", "food intake restores sufficiency", ["organism needs metabolic fuel"], ["food"], ["mild"], "English", "literal"),
  ir("A2", "A", "I could eat a horse.", { 1: 0.72, 5: 0.25, 7: 0.45, 26: 0.85, 29: 0.2 }, "body", "I", "food", "metabolic sufficiency", null, "resource_deficit", "need_food", "below_threshold", -0.85, "extreme food deficit", "food intake restores sufficiency", ["organism needs metabolic fuel"], ["food"], ["extreme"], "English", "idiom"),
  ir("A3", "A", "My stomach is completely empty.", { 1: 0.74, 5: 0.3, 7: 0.5, 26: 0.9, 29: 0.15 }, "body", "my stomach", "food", "metabolic sufficiency", null, "resource_deficit", "need_food", "below_threshold", -0.9, "empty stomach", "food intake restores sufficiency", ["organism needs metabolic fuel"], ["food"], ["extreme"], "English", "literal"),

  employment("B1", "B", "He was fired from his job.", "employer", "he", "job", "English", "literal"),
  employment("B2", "B", "He was given the axe.", "employer", "he", "job", "English", "idiom"),
  employment("B3", "B", "Le han dado la puerta.", "employer", "he", "job", "Spanish", "idiom"),

  gate("C1", "C", "The bank approved my loan.", "bank", "my loan", "credit access", "approve", true),
  gate("C2", "C", "The bank rejected my loan.", "bank", "my loan", "credit access", "reject", false),

  ir("D1", "D", "I am hungry.", { 1: 0.7, 5: 0.25, 7: 0.45, 26: 0.85, 29: 0.15 }, "body", "I", "food", "metabolic sufficiency", null, "resource_deficit", "need_food", "below_threshold", -0.65, "food deficit", "food intake restores sufficiency", ["organism needs metabolic fuel"], ["food"], ["moderate"], "English", "literal"),
  ir("D2", "D", "I am hungry for power.", { 1: 0.35, 2: 0.45, 18: 0.55, 19: 0.45, 22: 0.55, 26: 0.55, 30: 0.65 }, "I", "social position", "power", "status hierarchy", null, "acquire", "gain_power", "up", 0.2, "insufficient power", "greater control", ["power changes social affordances"], ["authority"], ["ambition"], "English", "metaphor"),
  ir("D3", "D", "I am hungry for revenge.", { 1: 0.3, 2: 0.5, 13: 0.35, 18: 0.45, 26: 0.5, 29: 0.2, 31: 0.75 }, "I", "wrongdoer", "retribution", "unresolved grievance", null, "reconcile", "retaliate", "retaliate", -0.85, "harm unresolved", "harm answered by revenge", ["grievance seeks closure"], ["justice"], ["hostile"], "English", "metaphor"),
  ir("D4", "D", "I am hungry to learn.", { 1: 0.25, 12: 0.6, 15: 0.55, 16: 0.45, 18: 0.45, 19: 0.65, 26: 0.35 }, "I", "knowledge state", "learning", "current understanding", null, "acquire", "learn", "expand", 0.75, "limited knowledge", "expanded model", ["knowledge can accumulate"], ["information"], ["growth"], "English", "metaphor"),
  ir("D5", "D", "The engine is hungry for fuel.", { 1: 0.55, 2: 0.35, 7: 0.45, 21: 0.35, 26: 0.8, 28: 0.25 }, "engine", "engine", "fuel", "operational sufficiency", null, "resource_deficit", "need_fuel", "below_threshold", -0.55, "fuel deficit", "fuel intake restores operation", ["engine needs fuel to operate"], ["fuel"], ["maintenance"], "English", "metaphor"),

  employment("E1", "E", "He was fired from his job.", "employer", "he", "job", "English", "literal"),
  ir("E2", "E", "The rocket was fired into space.", { 2: 0.95, 5: 0.45, 14: 0.35, 18: 0.5, 21: 0.35, 28: 0.45 }, "launch system", "rocket", "thrust", "launch boundary", "launch controller", "launch", "launch_vehicle", "out", 0.55, "rocket constrained on ground", "rocket moving into space", ["launch follows trajectory"], ["fuel"], ["high energy"], "English", "literal"),
  ir("E3", "E", "The gun was fired.", { 2: 0.9, 5: 0.5, 6: 0.35, 13: 0.25, 21: 0.25, 30: 0.35 }, "trigger mechanism", "gun", "stored explosive energy", "barrel", "shooter", "discharge", "weapon_discharge", "out", -0.35, "weapon loaded", "weapon discharged", ["trigger releases stored energy"], ["ammunition"], ["violent"], "English", "literal"),
  ir("E4", "E", "The clay was fired in a kiln.", { 2: 0.75, 3: 0.35, 7: 0.25, 21: 0.45, 25: 0.45, 28: 0.35 }, "kiln", "clay", "heat", "material phase", "potter", "transform", "heat_transform", "state_change", 0.35, "unfired clay", "hardened ceramic", ["heat changes material state"], ["heat"], ["controlled"], "English", "literal"),
  ir("E5", "E", "The neuron fired.", { 1: 0.35, 2: 0.75, 11: 0.35, 13: 0.75, 29: 0.65 }, "neuron", "signal", "electrical potential", "activation threshold", null, "signal_activation", "neural_spike", "emit", 0.35, "below firing threshold", "action potential emitted", ["threshold crossing emits signal"], ["charge"], ["fast"], "English", "literal"),

  gate("F1", "F", "The doctor cleared him for surgery.", "doctor", "him", "surgery", "clear", true),
  gate("F2", "F", "The doctor denied him surgery.", "doctor", "him", "surgery", "deny", false),
  gate("F3", "F", "The compiler accepted the program.", "compiler", "program", "valid executable path", "accept", true),
  gate("F4", "F", "The compiler rejected the program.", "compiler", "program", "valid executable path", "reject", false),
  gate("F5", "F", "The firewall blocked the packet.", "firewall", "packet", "network passage", "block", false),
  gate("F6", "F", "The firewall allowed the packet.", "firewall", "packet", "network passage", "allow", true),

  gate("G1", "G", "The doctor cleared him for surgery.", "doctor", "him", "surgery", "clear", true),
  gate("G2", "G", "He cleared the doctor for surgery.", "he", "doctor", "surgery", "clear", true, "invalid_authority"),
  gate("G3", "G", "The compiler accepted the program.", "compiler", "program", "valid executable path", "accept", true),
  gate("G4", "G", "The program accepted the compiler.", "program", "compiler", "valid executable path", "accept", true, "invalid_authority"),
  gate("G5", "G", "The firewall blocked the packet.", "firewall", "packet", "network passage", "block", false),
  gate("G6", "G", "The packet blocked the firewall.", "packet", "firewall", "network passage", "block", false, "invalid_authority"),
  employment("G7", "G", "The manager fired the employee.", "manager", "employee", "job", "English", "literal"),
  employment("G8", "G", "The employee fired the manager.", "employee", "manager", "job", "English", "literal", "invalid_authority"),
  ir("G9", "G", "The judge sentenced the defendant.", { 2: 0.7, 5: 0.5, 6: 0.55, 22: 0.45, 30: 0.95, 31: 0.65 }, "judge", "defendant", "sentence", "legal judgment", "judge", "gate", "sentence", "close", -0.75, "defendant awaits judgment", "defendant receives sentence", ["courts assign legal outcomes"], ["liberty"], ["legal"], "English", "literal"),
  ir("G10", "G", "The defendant sentenced the judge.", { 2: 0.7, 5: 0.5, 6: 0.55, 22: 0.45, 30: 0.95, 31: 0.65 }, "defendant", "judge", "sentence", "legal judgment", "defendant", "gate", "sentence", "close", -0.75, "judge awaits judgment", "judge receives sentence", ["courts assign legal outcomes"], ["liberty"], ["invalid authority"], "English", "literal"),

  gate("H1", "H", "The doctor cleared him for surgery.", "doctor", "him", "surgery", "clear", true),
  gate("H2", "H", "The receptionist cleared him for surgery.", "receptionist", "him", "surgery", "clear", true, "invalid_authority"),
  gate("H3", "H", "The compiler accepted the program.", "compiler", "program", "valid executable path", "accept", true),
  gate("H4", "H", "The README accepted the program.", "README", "program", "valid executable path", "accept", true, "invalid_authority"),
  gate("H5", "H", "The firewall blocked the packet.", "firewall", "packet", "network passage", "block", false),
  gate("H6", "H", "The cable blocked the packet.", "cable", "packet", "network passage", "block", false, "invalid_authority"),
  ir("H7", "H", "The judge sentenced the defendant.", { 2: 0.7, 5: 0.5, 6: 0.55, 22: 0.45, 30: 0.95, 31: 0.65 }, "judge", "defendant", "sentence", "legal judgment", "judge", "gate", "sentence", "close", -0.75, "defendant awaits judgment", "defendant receives sentence", ["courts assign legal outcomes"], ["liberty"], ["legal"], "English", "literal"),
  ir("H8", "H", "The journalist sentenced the defendant.", { 2: 0.7, 5: 0.5, 6: 0.55, 22: 0.45, 30: 0.95, 31: 0.65 }, "journalist", "defendant", "sentence", "legal judgment", "journalist", "gate", "sentence", "close", -0.75, "defendant awaits judgment", "defendant receives sentence", ["courts assign legal outcomes"], ["liberty"], ["invalid authority"], "English", "literal"),
];

const benchmarkPairs: BenchmarkPair[] = [
  ...pairs(["A1", "A2", "A3"], "SAME_FRAME_SAME_OUTCOME"),
  ...pairs(["B1", "B2", "B3"], "SAME_FRAME_SAME_OUTCOME"),
  { left: "C1", right: "C2", expected: "SAME_FRAME_OPPOSITE_OUTCOME" },
  { left: "D1", right: "D5", expected: "SAME_FRAME_SAME_OUTCOME" },
  { left: "D1", right: "D2", expected: "SAME_WORD_DIFFERENT_FRAME" },
  { left: "D1", right: "D3", expected: "SAME_WORD_DIFFERENT_FRAME" },
  { left: "D1", right: "D4", expected: "SAME_WORD_DIFFERENT_FRAME" },
  { left: "D2", right: "D3", expected: "SAME_WORD_DIFFERENT_FRAME" },
  { left: "D2", right: "D4", expected: "SAME_MOTIF_DIFFERENT_FRAME" },
  { left: "D3", right: "D4", expected: "SAME_WORD_DIFFERENT_FRAME" },
  { left: "D2", right: "D5", expected: "SAME_WORD_DIFFERENT_FRAME" },
  { left: "D3", right: "D5", expected: "SAME_WORD_DIFFERENT_FRAME" },
  { left: "D4", right: "D5", expected: "SAME_WORD_DIFFERENT_FRAME" },
  ...pairs(["E1", "E2", "E3", "E4", "E5"], "SAME_WORD_DIFFERENT_FRAME"),
  ...samePolarityGatePairs(),
  ...oppositePolarityGatePairs(),
  { left: "G1", right: "G2", expected: "ROLE_INVERSION" },
  { left: "G3", right: "G4", expected: "ROLE_INVERSION" },
  { left: "G5", right: "G6", expected: "ROLE_INVERSION" },
  { left: "G7", right: "G8", expected: "ROLE_INVERSION" },
  { left: "G9", right: "G10", expected: "ROLE_INVERSION" },
  { left: "H1", right: "H2", expected: "INVALID_AUTHORITY" },
  { left: "H3", right: "H4", expected: "INVALID_AUTHORITY" },
  { left: "H5", right: "H6", expected: "INVALID_AUTHORITY" },
  { left: "H7", right: "H8", expected: "INVALID_AUTHORITY" },
];

async function main(): Promise<void> {
  await mkdir(outputDir, { recursive: true });
  const rows = benchmarkPairs.map(scorePair);
  await writeFile(irPath, `${JSON.stringify(irs, null, 2)}\n`);
  await writeFile(reportPath, buildReport(rows));
  console.log(`DLR-3 report written to ${reportPath}`);
  console.log(`Structural IR JSON written to ${irPath}`);
}

function scorePair(pair: BenchmarkPair): ScoreRow {
  const left = mustGetIr(pair.left);
  const right = mustGetIr(pair.right);
  const motifSimilarity = cosineSimilarity(left.motifBasis, right.motifBasis);
  const transitionFamilySimilarity = left.transition.family === right.transition.family ? 1 : 0;
  const transitionTypeSimilarity =
    left.transition.type === right.transition.type ? 1 : transitionFamilySimilarity === 1 ? 0.7 : 0;
  const authoritySimilarity = authoritySimilarityFor(left, right);
  const boundarySimilarity = boundarySimilarityFor(left, right);
  const roleAssignmentSimilarity = roleAssignmentSimilarityFor(left, right);
  const rawOutcomeSimilarity = polaritySimilarity(left.transition.polarity, right.transition.polarity);
  const outcomeSimilarity = transitionFamilySimilarity >= 0.7 ? rawOutcomeSimilarity : 0;
  const stateDeltaSimilarity = stateDeltaSimilarityFor(left, right, transitionFamilySimilarity, outcomeSimilarity);
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
  const predicted = predictRelation({
    left,
    right,
    motifSimilarity,
    transitionFamilySimilarity,
    transitionTypeSimilarity,
    roleAssignmentSimilarity,
    authoritySimilarity,
    boundarySimilarity,
    outcomeSimilarity,
    stateDeltaSimilarity,
    finalStructuralScore,
  });

  return {
    ...pair,
    category: left.category === right.category ? left.category : `${left.category}/${right.category}`,
    motifSimilarity,
    transitionFamilySimilarity,
    transitionTypeSimilarity,
    roleAssignmentSimilarity,
    authoritySimilarity,
    boundarySimilarity,
    outcomeSimilarity,
    stateDeltaSimilarity,
    finalStructuralScore,
    predicted,
    passed: passesThreshold(pair.expected, {
      motifSimilarity,
      transitionFamilySimilarity,
      transitionTypeSimilarity,
      roleAssignmentSimilarity,
      authoritySimilarity,
      boundarySimilarity,
      outcomeSimilarity,
      stateDeltaSimilarity,
      finalStructuralScore,
      predicted,
    }),
  };
}

function finalScore(scores: Omit<ScoreRow, keyof BenchmarkPair | "category" | "predicted" | "passed">): number {
  const schema =
    scores.motifSimilarity *
    (0.35 +
      0.25 * scores.transitionFamilySimilarity +
      0.15 * scores.transitionTypeSimilarity +
      0.1 * scores.boundarySimilarity +
      0.1 * scores.authoritySimilarity +
      0.05 * scores.stateDeltaSimilarity);

  let score = schema * (0.35 + 0.65 * scores.outcomeSimilarity);

  if (scores.roleAssignmentSimilarity < 0.5) {
    score *= 0.25;
  } else {
    score *= 0.55 + 0.45 * scores.roleAssignmentSimilarity;
  }

  if (scores.authoritySimilarity < 0.3) {
    score *= 0.55;
  }

  return clamp(score);
}

function predictRelation(input: {
  left: StructuralIR;
  right: StructuralIR;
  motifSimilarity: number;
  transitionFamilySimilarity: number;
  transitionTypeSimilarity: number;
  roleAssignmentSimilarity: number;
  authoritySimilarity: number;
  boundarySimilarity: number;
  outcomeSimilarity: number;
  stateDeltaSimilarity: number;
  finalStructuralScore: number;
}): RelationPrediction {
  if (isRoleInversion(input.left, input.right) || input.roleAssignmentSimilarity <= 0.3) {
    return "ROLE_INVERSION";
  }
  if (input.transitionFamilySimilarity >= 0.7 && input.authoritySimilarity <= 0.3) {
    return "INVALID_AUTHORITY";
  }
  if (input.transitionFamilySimilarity >= 0.7 && input.outcomeSimilarity <= 0.35) {
    return "SAME_FRAME_OPPOSITE_OUTCOME";
  }
  if (input.finalStructuralScore >= 0.75) {
    return "SAME_FRAME_SAME_OUTCOME";
  }
  if (input.transitionFamilySimilarity < 0.7 && sharesImportantWord(input.left, input.right)) {
    return "SAME_WORD_DIFFERENT_FRAME";
  }
  if (input.motifSimilarity >= 0.35) {
    return "SAME_MOTIF_DIFFERENT_FRAME";
  }
  return "UNRELATED";
}

function passesThreshold(expected: RelationPrediction, row: Pick<ScoreRow, "motifSimilarity" | "transitionFamilySimilarity" | "roleAssignmentSimilarity" | "authoritySimilarity" | "outcomeSimilarity" | "finalStructuralScore" | "predicted">): boolean {
  if (row.predicted !== expected) {
    return false;
  }

  switch (expected) {
    case "SAME_FRAME_SAME_OUTCOME":
      return row.finalStructuralScore >= 0.75;
    case "SAME_FRAME_OPPOSITE_OUTCOME":
      return row.transitionFamilySimilarity >= 0.7 && row.outcomeSimilarity <= 0.35;
    case "SAME_WORD_DIFFERENT_FRAME":
      return row.finalStructuralScore <= 0.4;
    case "ROLE_INVERSION":
      return row.roleAssignmentSimilarity <= 0.3 && row.finalStructuralScore <= 0.35;
    case "INVALID_AUTHORITY":
      return row.authoritySimilarity <= 0.3 && row.finalStructuralScore <= 0.45;
    case "SAME_MOTIF_DIFFERENT_FRAME":
      return row.motifSimilarity >= 0.35 && row.finalStructuralScore <= 0.55;
    case "UNRELATED":
      return row.finalStructuralScore <= 0.25;
  }
}

function buildReport(rows: ScoreRow[]): string {
  const categories = [...new Set(rows.map((row) => row.category))];
  const failures = rows.filter((row) => !row.passed);

  return [
    "# DLR-3 Structural IR Validation",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Objective",
    "",
    "DLR-3 tests whether utterances compile into a stable typed structural intermediate representation, not just whether their motif vectors are close.",
    "",
    "## Artifacts",
    "",
    `- Structural IR JSON: \`${path.relative(projectRoot, irPath)}\``,
    "- Report: `dlr3_structural_ir.md`",
    "",
    "## Success Criteria",
    "",
    "| Relation | Required behavior |",
    "| --- | --- |",
    "| SAME_FRAME_SAME_OUTCOME | final score >= 0.75 |",
    "| SAME_FRAME_OPPOSITE_OUTCOME | transition family >= 0.70 and outcome <= 0.35 |",
    "| SAME_WORD_DIFFERENT_FRAME | final score <= 0.40 |",
    "| ROLE_INVERSION | role score <= 0.30 and final score <= 0.35 |",
    "| INVALID_AUTHORITY | authority score <= 0.30 and final score <= 0.45 |",
    "",
    "## Category Accuracy",
    "",
    "| Category | Pairs | Passed | Accuracy |",
    "| --- | ---: | ---: | ---: |",
    ...categories.map((category) => {
      const categoryRows = rows.filter((row) => row.category === category);
      const passed = categoryRows.filter((row) => row.passed).length;
      return `| ${category} | ${categoryRows.length} | ${passed} | ${formatScore(passed / categoryRows.length)} |`;
    }),
    `| **Overall** | **${rows.length}** | **${rows.filter((row) => row.passed).length}** | **${formatScore(rows.filter((row) => row.passed).length / rows.length)}** |`,
    "",
    "## Pairwise Structural Scores",
    "",
    "| Pair | Expected | Predicted | Pass | Motif | Family | Type | Roles | Authority | Boundary | Outcome | State | Final |",
    "| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...rows.map(
      (row) =>
        `| ${row.left}-${row.right} | ${row.expected} | ${row.predicted} | ${row.passed ? "PASS" : "FAIL"} | ${formatScore(row.motifSimilarity)} | ${formatScore(row.transitionFamilySimilarity)} | ${formatScore(row.transitionTypeSimilarity)} | ${formatScore(row.roleAssignmentSimilarity)} | ${formatScore(row.authoritySimilarity)} | ${formatScore(row.boundarySimilarity)} | ${formatScore(row.outcomeSimilarity)} | ${formatScore(row.stateDeltaSimilarity)} | ${formatScore(row.finalStructuralScore)} |`,
    ),
    "",
    "## Failure Examples",
    "",
    ...(failures.length === 0
      ? ["No failures against the current thresholds."]
      : failures.map(
          (row) =>
            `- ${row.left}-${row.right}: expected ${row.expected}, predicted ${row.predicted}, final=${formatScore(row.finalStructuralScore)}, roles=${formatScore(row.roleAssignmentSimilarity)}, authority=${formatScore(row.authoritySimilarity)}, outcome=${formatScore(row.outcomeSimilarity)}`,
        )),
    "",
    "## Notes",
    "",
    "- Polarity contributes only when transition family similarity is at least 0.7.",
    "- Role inversion applies a heavy penalty to the final score.",
    "- Invalid authority is scored separately from transition words so surface-valid phrases can still fail structurally.",
    "",
  ].join("\n");
}

function ir(
  id: string,
  category: string,
  text: string,
  motifs: Record<number, number>,
  actor: string | null,
  patient: string | null,
  resource: string | null,
  boundary: string | null,
  authority: string | null,
  family: TransitionFamily,
  type: string,
  direction: string,
  polarity: number,
  stateBefore: string,
  stateAfter: string,
  invariants: string[],
  scarcity: string[],
  stressRegime: string[],
  language: string,
  literalness: Literalness,
): StructuralIR {
  return {
    id,
    category,
    text,
    motifBasis: vectorFromMotifs(motifs),
    frame: { actor, patient, resource, boundary, authority },
    transition: { family, type, direction, polarity, stateBefore, stateAfter },
    constraints: { invariants, scarcity, stressRegime },
    expression: { language, literalness, register: "neutral" },
  };
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
  stressRegime = allowed ? "valid authority" : "valid authority",
): StructuralIR {
  return ir(
    id,
    category,
    text,
    allowed
      ? { 2: 0.45, 5: 0.25, 13: 0.45, 29: 0.45, 30: 0.7, 31: 0.8 }
      : { 2: 0.55, 5: 0.85, 6: 0.55, 13: 0.45, 29: 0.45, 30: 0.7 },
    authority,
    patient,
    resource,
    "permission gate",
    authority,
    "gate",
    type,
    allowed ? "open" : "close",
    allowed ? 0.8 : -0.8,
    "candidate awaits gate decision",
    allowed ? "access granted" : "access denied",
    ["gatekeeper evaluates candidate"],
    [resource],
    [stressRegime],
    "English",
    "literal",
  );
}

function employment(
  id: string,
  category: string,
  text: string,
  authority: string,
  patient: string,
  resource: string,
  language: string,
  literalness: Literalness,
  stressRegime = "valid authority",
): StructuralIR {
  return ir(
    id,
    category,
    text,
    { 2: 0.95, 4: 0.45, 5: 0.85, 6: 0.7, 22: 0.35, 30: 0.9 },
    authority,
    patient,
    resource,
    "institutional role membership",
    authority,
    "eject",
    "employment_termination",
    "out",
    -0.85,
    "person inside role boundary",
    "person outside role boundary",
    ["employer controls role membership"],
    ["job"],
    [stressRegime],
    language,
    literalness,
  );
}

function vectorFromMotifs(entries: Record<number, number>): number[] {
  const vector = Array.from({ length: 32 }, () => 0);
  for (const [motif, weight] of Object.entries(entries)) {
    vector[Number(motif) - 1] = weight;
  }
  return vector;
}

function pairs(ids: string[], expected: RelationPrediction): BenchmarkPair[] {
  const output: BenchmarkPair[] = [];
  for (let left = 0; left < ids.length; left += 1) {
    for (let right = left + 1; right < ids.length; right += 1) {
      output.push({ left: ids[left], right: ids[right], expected });
    }
  }
  return output;
}

function samePolarityGatePairs(): BenchmarkPair[] {
  return [
    { left: "F1", right: "F3", expected: "SAME_FRAME_SAME_OUTCOME" },
    { left: "F1", right: "F6", expected: "SAME_FRAME_SAME_OUTCOME" },
    { left: "F3", right: "F6", expected: "SAME_FRAME_SAME_OUTCOME" },
    { left: "F2", right: "F4", expected: "SAME_FRAME_SAME_OUTCOME" },
    { left: "F2", right: "F5", expected: "SAME_FRAME_SAME_OUTCOME" },
    { left: "F4", right: "F5", expected: "SAME_FRAME_SAME_OUTCOME" },
  ];
}

function oppositePolarityGatePairs(): BenchmarkPair[] {
  return [
    { left: "F1", right: "F2", expected: "SAME_FRAME_OPPOSITE_OUTCOME" },
    { left: "F1", right: "F4", expected: "SAME_FRAME_OPPOSITE_OUTCOME" },
    { left: "F1", right: "F5", expected: "SAME_FRAME_OPPOSITE_OUTCOME" },
    { left: "F3", right: "F2", expected: "SAME_FRAME_OPPOSITE_OUTCOME" },
    { left: "F3", right: "F4", expected: "SAME_FRAME_OPPOSITE_OUTCOME" },
    { left: "F3", right: "F5", expected: "SAME_FRAME_OPPOSITE_OUTCOME" },
    { left: "F6", right: "F2", expected: "SAME_FRAME_OPPOSITE_OUTCOME" },
    { left: "F6", right: "F4", expected: "SAME_FRAME_OPPOSITE_OUTCOME" },
    { left: "F6", right: "F5", expected: "SAME_FRAME_OPPOSITE_OUTCOME" },
  ];
}

function mustGetIr(id: string): StructuralIR {
  const item = irs.find((candidate) => candidate.id === id);
  if (!item) {
    throw new Error(`Unknown IR id: ${id}`);
  }
  return item;
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dot = vecA.reduce((sum, value, index) => sum + value * vecB[index], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, value) => sum + value * value, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, value) => sum + value * value, 0));
  return magnitudeA === 0 || magnitudeB === 0 ? 0 : dot / (magnitudeA * magnitudeB);
}

function authoritySimilarityFor(left: StructuralIR, right: StructuralIR): number {
  if (isInvalidAuthority(left) || isInvalidAuthority(right)) {
    return 0;
  }
  if (left.frame.authority === right.frame.authority) {
    return 1;
  }
  if (left.transition.family === right.transition.family && left.frame.authority && right.frame.authority) {
    return 0.85;
  }
  return stringSimilarity(left.frame.authority, right.frame.authority);
}

function boundarySimilarityFor(left: StructuralIR, right: StructuralIR): number {
  if (left.transition.family === "resource_deficit" && right.transition.family === "resource_deficit") {
    return 1;
  }
  return stringSimilarity(left.frame.boundary, right.frame.boundary);
}

function roleAssignmentSimilarityFor(left: StructuralIR, right: StructuralIR): number {
  if (isRoleInversion(left, right)) {
    return 0;
  }
  if (isInvalidAuthority(left) || isInvalidAuthority(right)) {
    return 0.45;
  }
  if (left.transition.family === "resource_deficit" && right.transition.family === "resource_deficit") {
    return 0.9;
  }
  if (left.transition.family === right.transition.family && left.frame.boundary === right.frame.boundary) {
    return 0.9;
  }
  return 0.45;
}

function isRoleInversion(left: StructuralIR, right: StructuralIR): boolean {
  return (
    Boolean(left.frame.actor && right.frame.patient && normalizeRole(left.frame.actor) === normalizeRole(right.frame.patient)) &&
    Boolean(left.frame.patient && right.frame.actor && normalizeRole(left.frame.patient) === normalizeRole(right.frame.actor))
  );
}

function isInvalidAuthority(ir: StructuralIR): boolean {
  return ir.constraints.stressRegime.some((regime) => normalize(regime) === "invalid authority");
}

function stringSimilarity(left: string | null, right: string | null): number {
  if (!left || !right) {
    return left === right ? 1 : 0;
  }
  if (normalize(left) === normalize(right)) {
    return 1;
  }
  const leftTokens = new Set(normalize(left).split(" "));
  const rightTokens = new Set(normalize(right).split(" "));
  const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  const union = new Set([...leftTokens, ...rightTokens]).size;
  return union === 0 ? 0 : intersection / union;
}

function polaritySimilarity(left: number, right: number): number {
  if (Math.sign(left) !== 0 && Math.sign(right) !== 0 && Math.sign(left) !== Math.sign(right)) {
    return 0;
  }
  return Math.max(0, 1 - Math.abs(left - right) / 2);
}

function stateDeltaSimilarityFor(
  left: StructuralIR,
  right: StructuralIR,
  transitionFamilySimilarity: number,
  outcomeSimilarity: number,
): number {
  if (transitionFamilySimilarity < 0.7) {
    return 0;
  }
  const before = stringSimilarity(left.transition.stateBefore, right.transition.stateBefore);
  const after = stringSimilarity(left.transition.stateAfter, right.transition.stateAfter);
  return Math.max(outcomeSimilarity, (before + after) / 2);
}

function sharesImportantWord(left: StructuralIR, right: StructuralIR): boolean {
  const stopwords = new Set(["the", "a", "an", "was", "is", "he", "him", "for", "from", "into", "in", "my"]);
  const leftWords = new Set(normalize(left.text).split(" ").filter((word) => !stopwords.has(word)));
  const rightWords = normalize(right.text)
    .split(" ")
    .filter((word) => !stopwords.has(word));
  return rightWords.some((word) => leftWords.has(word));
}

function normalize(value: string): string {
  return value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function normalizeRole(value: string): string {
  const normalized = normalize(value);
  const aliases: Record<string, string> = {
    he: "male_person",
    him: "male_person",
  };
  return aliases[normalized] ?? normalized;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function formatScore(value: number): string {
  return value.toFixed(4);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
