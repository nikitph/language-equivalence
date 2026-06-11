import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

type Verdict = "TRUST" | "WRAP" | "SWAP" | "PIERCE" | "MIRACLE" | "COLLISION";

interface MotifDef {
  id: number;
  name: string;
  group: string;
  question: string;
}

interface ValenceRule {
  motif: string;
  requires: string[];
  rationale: string;
}

interface CollisionRule {
  motifs: string[];
  verdict: "COLLISION";
  rationale: string;
}

interface CompositionRule {
  composite: string;
  requires: string[];
  provides: string[];
  rationale: string;
}

interface PatternNode {
  id: string;
  label: string;
  domain: string;
  motifs: string[];
  claims?: string[];
  implementation?: {
    coverage: string[];
    fidelity: "low" | "medium" | "high";
    stressAssumptions: string[];
  };
}

interface TransferContract {
  sourcePattern: string;
  targetDomain: string;
  transferredMotifs: string[];
  substrateAssumptionMismatches: string[];
  engineeringBridge: string[];
  verdict: Verdict;
}

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const projectRoot = path.resolve(__dirname, "..");
const outputDir = path.join(projectRoot, "artifacts", "usc");
const reportPath = path.join(projectRoot, "usc_atlas_kernel.md");
const jsonPath = path.join(outputDir, "atlas_kernel_audit.json");
const bioContractsPath = path.join(projectRoot, "artifacts", "bio_contracts", "P00533_ast_execution_contracts.json");

const motifs: MotifDef[] = [
  motif(1, "State", "Existence & Change", "What currently exists?"),
  motif(2, "Transition", "Existence & Change", "How does it change?"),
  motif(3, "Invariant", "Existence & Change", "What must remain true?"),
  motif(4, "Identity", "Existence & Change", "What makes this uniquely itself?"),
  motif(5, "Boundary", "Existence & Change", "What separates inside from outside?"),
  motif(6, "Terminal State", "Existence & Change", "When is it done?"),
  motif(7, "Decay", "Existence & Change", "What degrades without maintenance?"),
  motif(8, "Storage", "Memory & Persistence", "Where does information persist?"),
  motif(9, "Addressing", "Memory & Persistence", "How do you find it?"),
  motif(10, "Replication", "Memory & Persistence", "Can multiple copies exist?"),
  motif(11, "Synchronization", "Memory & Persistence", "How do copies stay consistent?"),
  motif(12, "Representation", "Intelligence & Learning", "How is reality encoded?"),
  motif(13, "Feedback", "Intelligence & Learning", "How does outcome influence future behavior?"),
  motif(14, "Prediction", "Intelligence & Learning", "What happens next?"),
  motif(15, "Search", "Intelligence & Learning", "How do you find a valid path?"),
  motif(16, "Model", "Intelligence & Learning", "What internal simulation exists?"),
  motif(17, "Compression", "Intelligence & Learning", "How can less describe more?"),
  motif(18, "Optimization", "Intelligence & Learning", "What should improve?"),
  motif(19, "Explore/Exploit", "Intelligence & Learning", "Learn or use?"),
  motif(20, "Self-Reference", "Intelligence & Learning", "When does a system reference itself?"),
  motif(21, "Composition", "Structure & Scale", "How do pieces combine?"),
  motif(22, "Hierarchy", "Structure & Scale", "How do small things form larger things under direction?"),
  motif(23, "Modularity", "Structure & Scale", "What can change independently?"),
  motif(24, "Abstraction", "Structure & Scale", "What can be hidden?"),
  motif(25, "Emergence", "Structure & Scale", "How do micro-behaviors produce macro-properties?"),
  motif(26, "Scarcity", "Resources & Allocation", "What is limited?"),
  motif(27, "Queue", "Resources & Allocation", "Who waits?"),
  motif(28, "Scheduling", "Resources & Allocation", "Who gets resources next?"),
  motif(29, "Communication", "Coordination & Governance", "How does information move?"),
  motif(30, "Authority", "Coordination & Governance", "Who decides?"),
  motif(31, "Reconciliation", "Coordination & Governance", "How do divergent states converge?"),
  motif(32, "Negotiation", "Coordination & Governance", "How do competing interests reach agreement?"),
];

const valenceRules: ValenceRule[] = [
  { motif: "Reconciliation", requires: ["Communication", "Authority", "Invariant"], rationale: "Convergence requires state exchange, a deciding rule, and a target truth condition." },
  { motif: "Optimization", requires: ["Prediction", "Search", "Scarcity"], rationale: "Improvement needs alternatives, expected outcomes, and a scarce objective." },
  { motif: "Scheduling", requires: ["Queue", "Scarcity", "Authority"], rationale: "Scheduling exists only when limited resources force a priority rule." },
  { motif: "Feedback", requires: ["State", "Transition", "Communication"], rationale: "Outcome must be observed and routed back into future transitions." },
  { motif: "Authority", requires: ["Boundary", "Invariant"], rationale: "Authority is scoped decision power over a rule." },
  { motif: "Replication", requires: ["Identity", "Storage"], rationale: "Copies need persistent state and identity boundaries." },
  { motif: "Synchronization", requires: ["Replication", "Communication", "Invariant"], rationale: "Copies can only stay aligned by communicating against a shared invariant." },
  { motif: "Negotiation", requires: ["Communication", "Identity", "Scarcity"], rationale: "Agreement requires actors, exchange, and conflicting constraints." },
  { motif: "Self-Reference", requires: ["Representation", "Model"], rationale: "A system must represent itself before it can refer to itself." },
];

const compositionRules: CompositionRule[] = [
  { composite: "Prediction", requires: ["Representation", "Feedback"], provides: ["anticipation"], rationale: "Prediction is representation refined by prior outcomes." },
  { composite: "Model", requires: ["Representation", "Prediction", "Boundary"], provides: ["counterfactual simulation"], rationale: "A model is a bounded internal simulation of possible states." },
  { composite: "Compression", requires: ["Representation", "Scarcity"], provides: ["generalization"], rationale: "Compression is representation optimized under storage or attention scarcity." },
  { composite: "Optimization", requires: ["Prediction", "Search", "Scarcity"], provides: ["directed improvement"], rationale: "Optimization requires expected outcomes, alternatives, and a constrained objective." },
  { composite: "Hierarchy", requires: ["Composition", "Authority"], provides: ["directed scale"], rationale: "Hierarchy is composition under direction." },
  { composite: "Modularity", requires: ["Boundary", "Composition"], provides: ["independent change"], rationale: "A module is a composed unit with a boundary." },
  { composite: "Abstraction", requires: ["Boundary", "Representation"], provides: ["interface hiding"], rationale: "Abstraction hides internal representation behind a boundary." },
  { composite: "Emergence", requires: ["Composition", "Feedback"], provides: ["macro behavior"], rationale: "Emergence arises when composed parts feed back into system-level behavior." },
  { composite: "Queue", requires: ["Scarcity", "Composition"], provides: ["visible waiting"], rationale: "Queues expose competing demands under scarcity." },
  { composite: "Scheduling", requires: ["Queue", "Authority"], provides: ["priority over time"], rationale: "Scheduling is authoritative ordering of queued scarcity." },
  { composite: "Reconciliation", requires: ["Communication", "Invariant", "Authority"], provides: ["divergence resolution"], rationale: "Reconciliation compares divergent states against a rule and resolves conflict." },
  { composite: "Negotiation", requires: ["Communication", "Scarcity", "Authority"], provides: ["agreement under conflict"], rationale: "Negotiation coordinates competing claims under constraint." },
];

const collisionRules: CollisionRule[] = [
  { motifs: ["Prediction", "Self-Reference", "Terminal State"], verdict: "COLLISION", rationale: "A self-referential predictor with a forced terminal verdict recreates the halting-style paradox." },
  { motifs: ["Authority", "Boundary"], verdict: "COLLISION", rationale: "Authority without a scoped boundary is unbounded power; the compiler treats this as a missing-valence collision when Boundary is absent." },
];

async function main(): Promise<void> {
  await mkdir(outputDir, { recursive: true });
  const patterns = await loadPatterns();
  const audits = patterns.map((node) => ({ node, audit: auditNode(node) }));
  const transfers = buildTransferContracts(patterns);
  await writeFile(jsonPath, `${JSON.stringify({ motifs, compositionRules, valenceRules, collisionRules, audits, transfers }, null, 2)}\n`);
  await writeFile(reportPath, buildReport(audits, transfers));
  console.log(`USC Atlas Kernel audit written to ${jsonPath}`);
  console.log(`USC Atlas Kernel report written to ${reportPath}`);
}

async function loadPatterns(): Promise<PatternNode[]> {
  const seed: PatternNode[] = [
    {
      id: "market_volatility_circuit_breaker",
      label: "Market volatility circuit breaker",
      domain: "finance",
      motifs: ["State", "Transition", "Invariant", "Boundary", "Feedback", "Representation", "Prediction", "Communication", "Authority"],
      claims: ["Feedback", "Authority"],
      implementation: {
        coverage: ["State", "Transition", "Invariant", "Boundary", "Feedback", "Representation", "Prediction", "Communication", "Authority"],
        fidelity: "high",
        stressAssumptions: ["Markets have observable price ticks.", "Halt rules are enforceable by exchange authority."],
      },
    },
    {
      id: "static_allosteric_wedge",
      label: "Static allosteric wedge",
      domain: "biology",
      motifs: ["Boundary", "Communication", "Transition"],
      claims: ["Feedback", "Authority"],
      implementation: {
        coverage: ["Boundary", "Communication", "Transition"],
        fidelity: "low",
        stressAssumptions: ["Constant binding friction is acceptable across healthy and pathological contexts."],
      },
    },
  ];

  try {
    const body = await readFile(bioContractsPath, "utf8");
    const json = JSON.parse(body) as { contracts?: any[] };
    const contracts =
      json.contracts?.map((contract) => ({
        id: contract.id,
        label: contract.target.label,
        domain: "bio_contract",
        motifs: contract.target.bioMotifs ?? [],
        claims: ["Feedback", "Authority"],
        implementation: {
          coverage: [
            ...(contract.target.bioMotifs ?? []),
            ...(contract.smartModulatorSpec ? ["Prediction", "Boundary", "Feedback", "Communication"] : []),
          ],
          fidelity: contract.smartModulatorSpec ? "high" : "medium",
          stressAssumptions: contract.validationGates ?? [],
        },
      })) ?? [];
    return [...seed, ...contracts];
  } catch {
    return seed;
  }
}

function auditNode(node: PatternNode): {
  verdict: Verdict;
  missingValences: string[];
  missingCompositions: string[];
  collisions: string[];
  fepViable: boolean;
  threeTestGate: { coverage: "pass" | "fail"; fidelity: "pass" | "warn" | "fail"; stress: "pass" | "warn" };
  recommendation: string;
} {
  const available = new Set([...(node.motifs ?? []), ...(node.implementation?.coverage ?? [])]);
  const claims = new Set([...(node.motifs ?? []), ...(node.claims ?? [])]);
  const missingValences: string[] = [];
  const missingCompositions: string[] = [];

  for (const rule of valenceRules) {
    if (!claims.has(rule.motif)) continue;
    for (const required of rule.requires) {
      if (!available.has(required)) missingValences.push(`${rule.motif} requires ${required}`);
    }
  }

  for (const rule of compositionRules) {
    if (!claims.has(rule.composite)) continue;
    for (const required of rule.requires) {
      if (!available.has(required)) missingCompositions.push(`${rule.composite} requires ${required}`);
    }
  }

  const collisions = collisionRules
    .filter((rule) => {
      if (rule.motifs.includes("Boundary") && rule.motifs.includes("Authority")) {
        return claims.has("Authority") && !available.has("Boundary");
      }
      return rule.motifs.every((motifName) => claims.has(motifName));
    })
    .map((rule) => rule.rationale);

  const fidelity = node.implementation?.fidelity ?? "medium";
  const fepViable = ["State", "Boundary", "Transition", "Feedback"].every((motifName) => available.has(motifName));
  const coverage = missingValences.length === 0 && missingCompositions.length === 0 ? "pass" : "fail";
  const fidelityGate = fidelity === "high" ? "pass" : fidelity === "medium" ? "warn" : "fail";
  const stressGate = (node.implementation?.stressAssumptions.length ?? 0) > 0 ? "warn" : "pass";
  const verdict: Verdict =
    collisions.length > 0
      ? "COLLISION"
      : missingValences.length > 0 || missingCompositions.length > 0
        ? "MIRACLE"
        : fidelity === "low"
          ? "PIERCE"
          : fidelity === "medium" || !fepViable
            ? "WRAP"
            : "TRUST";
  const recommendation =
    verdict === "MIRACLE"
      ? "Add missing valence prerequisites before transfer."
      : verdict === "PIERCE"
        ? "Replace or wrap impoverished implementation with a higher-fidelity pattern."
        : verdict === "WRAP"
          ? "Keep implementation but add safeguards and stress validation."
          : verdict === "COLLISION"
            ? "Reject transfer until motif contradiction is removed."
            : "Transfer is structurally admissible subject to substrate validation.";

  return {
    verdict,
    missingValences,
    missingCompositions,
    collisions,
    fepViable,
    threeTestGate: { coverage, fidelity: fidelityGate, stress: stressGate },
    recommendation,
  };
}

function buildTransferContracts(patterns: PatternNode[]): TransferContract[] {
  const source = patterns.find((pattern) => pattern.id === "market_volatility_circuit_breaker");
  const target = patterns.find((pattern) => pattern.id.includes("688_704"));
  if (!source || !target) return [];
  const shared = source.motifs.filter((motifName) => target.motifs.includes(motifName) || ["Prediction", "Boundary", "Feedback", "Communication"].includes(motifName));
  return [
    {
      sourcePattern: source.label,
      targetDomain: target.label,
      transferredMotifs: [...new Set(shared)],
      substrateAssumptionMismatches: [
        "Financial markets expose discrete price ticks; proteins expose conformational ensembles indirectly.",
        "Exchange halts are externally enforceable; molecular regulation must be encoded through affinity, kinetics, and local environment.",
        "Market time is observable and digital; protein transitions are stochastic and continuous.",
      ],
      engineeringBridge: [
        "Translate volatility threshold into use-dependent affinity for transition-like conformations.",
        "Translate exchange authority into local allosteric gating at the dimerization/interface region.",
        "Translate market halt into reversible kinetic modulation, not permanent catalytic shutdown.",
      ],
      verdict: "WRAP",
    },
  ];
}

function buildReport(
  audits: Array<{ node: PatternNode; audit: ReturnType<typeof auditNode> }>,
  transfers: TransferContract[],
): string {
  return [
    "# USC Atlas Kernel Audit",
    "",
    "## Purpose",
    "",
    "This is the deterministic Layer-1 guardrail for System2Vec transfer. It checks motif valence, collision rules, implementation fidelity, and typed substrate mismatches before allowing cross-domain grafts.",
    "",
    "## Valence Rules",
    "",
    "| Motif | Requires | Rationale |",
    "| --- | --- | --- |",
    ...valenceRules.map((rule) => `| ${rule.motif} | ${rule.requires.join(", ")} | ${rule.rationale} |`),
    "",
    "## Composition Graph",
    "",
    "| Composite | Requires | Provides | Rationale |",
    "| --- | --- | --- | --- |",
    ...compositionRules.map((rule) => `| ${rule.composite} | ${rule.requires.join(", ")} | ${rule.provides.join(", ")} | ${rule.rationale} |`),
    "",
    "## Audited Nodes",
    "",
    "| Node | Domain | Verdict | FEP viable | Coverage | Fidelity | Stress | Missing prerequisites | Recommendation |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ...audits.map(
      ({ node, audit }) =>
        `| ${node.label} | ${node.domain} | ${audit.verdict} | ${audit.fepViable ? "yes" : "no"} | ${audit.threeTestGate.coverage} | ${audit.threeTestGate.fidelity} | ${audit.threeTestGate.stress} | ${[...audit.missingValences, ...audit.missingCompositions].join("; ") || "-"} | ${audit.recommendation} |`,
    ),
    "",
    "## Typed Transfer Contracts",
    "",
    ...transfers.flatMap((transfer) => [
      `### ${transfer.sourcePattern} -> ${transfer.targetDomain}`,
      "",
      `- Verdict: ${transfer.verdict}`,
      `- Transferred motifs: ${transfer.transferredMotifs.join(", ")}`,
      "",
      "Substrate assumption mismatches:",
      ...transfer.substrateAssumptionMismatches.map((item) => `- ${item}`),
      "",
      "Engineering bridge:",
      ...transfer.engineeringBridge.map((item) => `- ${item}`),
      "",
    ]),
  ].join("\n");
}

function motif(id: number, name: string, group: string, question: string): MotifDef {
  return { id, name, group, question };
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
