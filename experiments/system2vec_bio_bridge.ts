import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

type Motif =
  | "State"
  | "Transition"
  | "Invariant"
  | "Identity"
  | "Boundary"
  | "Terminal State"
  | "Decay"
  | "Storage"
  | "Addressing"
  | "Replication"
  | "Synchronization"
  | "Representation"
  | "Feedback"
  | "Prediction"
  | "Search"
  | "Model"
  | "Compression"
  | "Optimization"
  | "Explore/Exploit"
  | "Self-Reference"
  | "Composition"
  | "Hierarchy"
  | "Modularity"
  | "Abstraction"
  | "Emergence"
  | "Scarcity"
  | "Queue"
  | "Scheduling"
  | "Communication"
  | "Authority"
  | "Reconciliation"
  | "Negotiation";

interface BioPocket {
  id: string;
  label: string;
  residueStart: number;
  residueEnd: number;
  motifs: Motif[];
  allostericScore: number;
  confidence: number;
  source: string;
  rationale: string;
}

interface BioMotifIR {
  accession: string;
  proteinName: string;
  gene: string;
  topAllostericTargets: BioPocket[];
}

interface SystemPattern {
  id: string;
  name: string;
  domain: "software" | "distributed systems" | "control systems" | "security" | "operations";
  vector: number[];
  activeMotifs: Motif[];
  mechanism: string;
  designPrescription: string;
}

interface BridgeMatch {
  target: BioPocket;
  targetVector: number[];
  matches: Array<SystemPattern & { similarity: number }>;
  biologicalHypothesis: string;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const outputDir = path.join(projectRoot, "artifacts", "system2vec");
const reportPath = path.join(projectRoot, "system2vec_bio_bridge.md");
const bridgePath = path.join(outputDir, "P00533_system2vec_bridge.json");
const bioIrPath = path.join(projectRoot, "artifacts", "bio_motif", "P00533_bio_motif_ir.json");

const motifs: Motif[] = [
  "State",
  "Transition",
  "Invariant",
  "Identity",
  "Boundary",
  "Terminal State",
  "Decay",
  "Storage",
  "Addressing",
  "Replication",
  "Synchronization",
  "Representation",
  "Feedback",
  "Prediction",
  "Search",
  "Model",
  "Compression",
  "Optimization",
  "Explore/Exploit",
  "Self-Reference",
  "Composition",
  "Hierarchy",
  "Modularity",
  "Abstraction",
  "Emergence",
  "Scarcity",
  "Queue",
  "Scheduling",
  "Communication",
  "Authority",
  "Reconciliation",
  "Negotiation",
];

const patternLibrary: SystemPattern[] = [
  pattern(
    "market_volatility_circuit_breaker",
    "Market volatility circuit breaker",
    "control systems",
    { State: 0.62, Transition: 0.62, Invariant: 0.72, Boundary: 0.68, Terminal: 0.45, Feedback: 0.95, Prediction: 0.54, Communication: 0.78, Authority: 0.86 },
    "A dormant regulator activates only when the rate of change crosses a volatility threshold.",
    "Design a use-dependent regulator that preferentially binds high-frequency transition states rather than resting state.",
  ),
  pattern(
    "ramp_metering",
    "Ramp metering",
    "control systems",
    { State: 0.58, Boundary: 0.72, Queue: 0.8, Scheduling: 0.78, Feedback: 0.95, Communication: 0.86, Authority: 0.68, Reconciliation: 0.54 },
    "A local gate meters entry using downstream congestion feedback rather than local demand alone.",
    "Gate allosteric engagement using tumor-environment or downstream-pathway context instead of local hinge geometry alone.",
  ),
  pattern(
    "token_bucket",
    "Token bucket rate limiter",
    "software",
    { State: 0.45, Boundary: 0.55, Scarcity: 0.82, Queue: 0.65, Scheduling: 0.72, Communication: 0.78, Authority: 0.7, Feedback: 0.62 },
    "A regulator meters communication by issuing limited tokens, allowing bursts but throttling sustained activation.",
    "Design a regulator that limits activation throughput without permanently disabling the active site.",
  ),
  pattern(
    "semaphore",
    "Semaphore",
    "software",
    { State: 0.5, Boundary: 0.78, Scarcity: 0.8, Queue: 0.74, Scheduling: 0.6, Communication: 0.58, Authority: 0.86, Feedback: 0.55 },
    "A gate controls how many actors can enter a critical region at once.",
    "Bias the interface so only limited receptor pairings can enter the activating configuration.",
  ),
  pattern(
    "circuit_breaker",
    "Circuit breaker",
    "operations",
    { State: 0.52, Transition: 0.55, Boundary: 0.72, Terminal: 0.45, Feedback: 0.92, Communication: 0.78, Authority: 0.7, Invariant: 0.55 },
    "Feedback opens a boundary when downstream behavior becomes unsafe, stopping repeated activation attempts.",
    "Stabilize an inactive or open-loop regulatory conformation when activation feedback becomes pathological.",
  ),
  pattern(
    "backpressure",
    "Backpressure",
    "distributed systems",
    { State: 0.45, Feedback: 0.9, Communication: 0.92, Queue: 0.7, Scheduling: 0.58, Boundary: 0.45, Reconciliation: 0.62 },
    "A downstream component slows upstream senders through feedback instead of blocking the transport channel outright.",
    "Induce friction at the regulatory interface so signaling slows before catalytic shutdown is required.",
  ),
  pattern(
    "quorum_gate",
    "Quorum gate",
    "distributed systems",
    { State: 0.5, Replication: 0.62, Synchronization: 0.72, Boundary: 0.58, Communication: 0.82, Authority: 0.88, Reconciliation: 0.76 },
    "State transition requires coordinated agreement across multiple participants.",
    "Target receptor assembly so activation requires a harder-to-satisfy multi-part coordination condition.",
  ),
  pattern(
    "two_phase_commit",
    "Two-phase commit",
    "distributed systems",
    { State: 0.55, Transition: 0.58, Terminal: 0.55, Synchronization: 0.85, Communication: 0.82, Authority: 0.78, Reconciliation: 0.9 },
    "A coordinator separates prepare from commit, preventing premature terminal success.",
    "Separate dimerization readiness from kinase activation so interface contact does not immediately commit signaling.",
  ),
  pattern(
    "capability_token",
    "Capability token",
    "security",
    { Identity: 0.72, Boundary: 0.86, Addressing: 0.62, Communication: 0.55, Authority: 0.92, Invariant: 0.68 },
    "Authority is granted only when the actor presents the right bounded capability.",
    "Require a specific conformational credential at the regulatory site before activation proceeds.",
  ),
  pattern(
    "debounce",
    "Debounce filter",
    "control systems",
    { State: 0.42, Transition: 0.52, Feedback: 0.82, Prediction: 0.45, Communication: 0.7, Scheduling: 0.55, Boundary: 0.4 },
    "Fast repeated signals are ignored until a stable interval confirms intent.",
    "Suppress transient dimer-interface contacts while preserving sustained physiological signaling.",
  ),
  pattern(
    "hysteresis",
    "Hysteresis controller",
    "control systems",
    { State: 0.68, Transition: 0.58, Invariant: 0.58, Feedback: 0.88, Model: 0.52, Communication: 0.58, Boundary: 0.45 },
    "Activation and deactivation thresholds differ, preventing oscillation around a boundary.",
    "Shift activation thresholds at the regulatory interface rather than blocking ATP chemistry.",
  ),
  pattern(
    "bulkhead",
    "Bulkhead isolation",
    "operations",
    { State: 0.45, Boundary: 0.92, Modularity: 0.72, Hierarchy: 0.55, Communication: 0.48, Authority: 0.45, Invariant: 0.55 },
    "Boundaries isolate failure propagation across modules.",
    "Constrain cross-domain coupling so pathological activation does not propagate through adjacent signaling modules.",
  ),
];

async function main(): Promise<void> {
  await mkdir(outputDir, { recursive: true });
  const bioIr = JSON.parse(await readFile(bioIrPath, "utf8")) as BioMotifIR;
  const bridge = bioIr.topAllostericTargets.slice(0, 8).map((target) => bridgeTarget(target));
  await writeFile(bridgePath, `${JSON.stringify({ source: bioIrPath, protein: bioIr.proteinName, gene: bioIr.gene, bridge }, null, 2)}\n`);
  await writeFile(reportPath, buildReport(bioIr, bridge));
  console.log(`System2Vec bio bridge written to ${bridgePath}`);
  console.log(`System2Vec report written to ${reportPath}`);
}

function bridgeTarget(target: BioPocket): BridgeMatch {
  const targetVector = vectorFromMotifs(motifWeightsForTarget(target));
  const matches = patternLibrary
    .map((candidate) => ({ ...candidate, similarity: cosineSimilarity(targetVector, candidate.vector) }))
    .sort((left, right) => right.similarity - left.similarity)
    .slice(0, 5);
  return {
    target,
    targetVector,
    matches,
    biologicalHypothesis: hypothesisFor(target, matches[0]),
  };
}

function motifWeightsForTarget(target: BioPocket): Partial<Record<Motif, number>> {
  const weights: Partial<Record<Motif, number>> = {};
  for (const motif of target.motifs) weights[motif] = Math.max(weights[motif] ?? 0, baseWeight(motif));
  if (target.label.toLowerCase().includes("dimer")) {
    weights.Communication = Math.max(weights.Communication ?? 0, 0.95);
    weights.Modularity = Math.max(weights.Modularity ?? 0, 0.75);
    weights.Boundary = Math.max(weights.Boundary ?? 0, 0.65);
  }
  if (target.label.toLowerCase().includes("phosphorylation") || target.label.toLowerCase().includes("activation")) {
    weights.Feedback = Math.max(weights.Feedback ?? 0, 0.92);
    weights.Transition = Math.max(weights.Transition ?? 0, 0.45);
  }
  weights.State = Math.max(weights.State ?? 0, 0.35);
  return weights;
}

function baseWeight(motif: Motif): number {
  if (motif === "Communication") return 0.92;
  if (motif === "Feedback") return 0.9;
  if (motif === "Authority") return 0.82;
  if (motif === "Boundary") return 0.64;
  if (motif === "Modularity") return 0.62;
  if (motif === "Hierarchy") return 0.5;
  if (motif === "Transition") return 0.45;
  return 0.4;
}

function hypothesisFor(target: BioPocket, match: SystemPattern): string {
  return `Treat residues ${target.residueStart}-${target.residueEnd} as a biological analogue of ${match.name}: ${match.designPrescription}`;
}

function buildReport(bioIr: BioMotifIR, bridge: BridgeMatch[]): string {
  return [
    "# System2Vec Bio Bridge",
    "",
    "## Status",
    "",
    "This experiment bridges BioMotifIR targets into cross-domain systems patterns. It is a design-analogy and retrieval prototype, not a molecule generator or therapeutic claim.",
    "",
    "## Input",
    "",
    `- Protein: ${bioIr.proteinName}`,
    `- Gene: ${bioIr.gene}`,
    `- Source BioMotifIR: \`${path.relative(projectRoot, bioIrPath)}\``,
    `- Bridge artifact: \`${path.relative(projectRoot, bridgePath)}\``,
    "",
    "## Pattern Library",
    "",
    "| Pattern | Domain | Active motifs | Mechanism |",
    "| --- | --- | --- | --- |",
    ...patternLibrary.map((patternItem) => `| ${patternItem.name} | ${patternItem.domain} | ${patternItem.activeMotifs.join(", ")} | ${patternItem.mechanism} |`),
    "",
    "## Bio Target To Systems Pattern Matches",
    "",
    ...bridge.flatMap((item, index) => [
      `### ${index + 1}. ${item.target.label}`,
      "",
      `- Residues: ${item.target.residueStart}-${item.target.residueEnd}`,
      `- Bio motifs: ${item.target.motifs.join(", ")}`,
      `- Bio score: ${item.target.allostericScore.toFixed(3)}`,
      `- Hypothesis: ${item.biologicalHypothesis}`,
      "",
      "| Rank | Pattern | Domain | Similarity | Prescription |",
      "| ---: | --- | --- | ---: | --- |",
      ...item.matches.map(
        (match, matchIndex) =>
          `| ${matchIndex + 1} | ${match.name} | ${match.domain} | ${match.similarity.toFixed(4)} | ${match.designPrescription} |`,
      ),
      "",
    ]),
    "## Interpretation",
    "",
    "- `Communication + Feedback + Authority` biological regions retrieve throttling/gating patterns rather than active-site shutdown patterns.",
    "- This is the right abstraction boundary for a future molecule generator: provide a mechanism target such as backpressure, semaphore, token bucket, or circuit breaker, then let chemistry-specific tooling search physical implementations.",
    "- The MVP does not validate binding pockets, affinity, selectivity, toxicity, or efficacy.",
    "",
  ].join("\n");
}

function pattern(
  id: string,
  name: string,
  domain: SystemPattern["domain"],
  weights: Partial<Record<Motif | "Terminal", number>>,
  mechanism: string,
  designPrescription: string,
): SystemPattern {
  const normalizedWeights: Partial<Record<Motif, number>> = {};
  for (const [key, value] of Object.entries(weights)) {
    normalizedWeights[key === "Terminal" ? "Terminal State" : (key as Motif)] = value;
  }
  const activeMotifs = Object.entries(normalizedWeights)
    .sort((left, right) => right[1] - left[1])
    .map(([motif]) => motif as Motif);
  return { id, name, domain, vector: vectorFromMotifs(normalizedWeights), activeMotifs, mechanism, designPrescription };
}

function vectorFromMotifs(weights: Partial<Record<Motif, number>>): number[] {
  return motifs.map((motif) => weights[motif] ?? 0);
}

function cosineSimilarity(left: number[], right: number[]): number {
  const dot = left.reduce((sum, value, index) => sum + value * right[index], 0);
  const leftNorm = Math.sqrt(left.reduce((sum, value) => sum + value * value, 0));
  const rightNorm = Math.sqrt(right.reduce((sum, value) => sum + value * value, 0));
  return leftNorm === 0 || rightNorm === 0 ? 0 : dot / (leftNorm * rightNorm);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
