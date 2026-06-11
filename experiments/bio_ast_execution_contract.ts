import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

interface BridgeArtifact {
  protein: string;
  gene: string;
  bridge: BridgeMatch[];
}

interface BridgeMatch {
  target: {
    id: string;
    label: string;
    residueStart: number;
    residueEnd: number;
    motifs: string[];
    allostericScore: number;
    confidence: number;
    source: string;
  };
  matches: Array<{
    id: string;
    name: string;
    domain: string;
    similarity: number;
    mechanism: string;
    designPrescription: string;
  }>;
}

interface ExecutionContract {
  id: string;
  protein: string;
  gene: string;
  target: {
    label: string;
    residues: string;
    source: string;
    bioMotifs: string[];
    allostericScore: number;
    confidence: number;
  };
  systemsAnalogy: {
    primaryPattern: string;
    domain: string;
    similarity: number;
    mechanism: string;
  };
  motifPayload: {
    intent: string;
    requiredEffects: string[];
    prohibitedEffects: string[];
  };
  fidelityTest: {
    baselineDrugArchitecture: string;
    richerReferenceArchitectures: string[];
    fidelityGap: string;
    upgradePrinciple: string;
  };
  smartModulatorSpec: {
    volatilityTrigger: string;
    downstreamSensor: string;
    dualGateLogic: string;
    suggestedEnvironmentalGates: string[];
  };
  geometryConstraints: string[];
  kineticStructuralConstraints: string[];
  validationGates: string[];
  generatorPrompt: string;
  caveats: string[];
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const bridgePath = path.join(projectRoot, "artifacts", "system2vec", "P00533_system2vec_bridge.json");
const outputDir = path.join(projectRoot, "artifacts", "bio_contracts");
const contractsPath = path.join(outputDir, "P00533_ast_execution_contracts.json");
const reportPath = path.join(projectRoot, "bio_ast_execution_contracts.md");

async function main(): Promise<void> {
  await mkdir(outputDir, { recursive: true });
  const artifact = JSON.parse(await readFile(bridgePath, "utf8")) as BridgeArtifact;
  const contracts = artifact.bridge.slice(0, 8).map((match, index) => buildContract(artifact, match, index + 1));
  await writeFile(contractsPath, `${JSON.stringify({ source: bridgePath, contracts }, null, 2)}\n`);
  await writeFile(reportPath, buildReport(contracts));
  console.log(`Bio AST execution contracts written to ${contractsPath}`);
  console.log(`Bio AST execution contract report written to ${reportPath}`);
}

function buildContract(artifact: BridgeArtifact, match: BridgeMatch, rank: number): ExecutionContract {
  const primary = choosePrimaryPattern(match);
  const residues = `${match.target.residueStart}-${match.target.residueEnd}`;
  const intent = intentFor(primary.name, match.target.motifs);
  const requiredEffects = requiredEffectsFor(primary.name, match.target.motifs);
  const prohibitedEffects = [
    "Do not directly lock the ATP/catalytic active site as the primary mechanism.",
    "Do not force a permanent terminal inactive state unless explicitly validated as selective.",
    "Do not disrupt unrelated housekeeping signaling without selectivity evidence.",
  ];
  const geometryConstraints = [
    `Prefer candidate binders near EGFR residues ${residues}.`,
    "Prefer interface-adjacent poses over catalytic active-site poses.",
    "Avoid poses whose primary contact map is dominated by orthosteric Transition residues.",
    "Prioritize contacts that can perturb Communication, Feedback, Authority, Boundary, or Modularity motifs.",
  ];
  const kineticStructuralConstraints = kineticConstraintsFor(primary.name);
  const fidelityTest = buildFidelityTest(primary.name, match);
  const smartModulatorSpec = buildSmartModulatorSpec(primary.name, match);
  const validationGates = [
    "Docking or generative model must return a pose and contact map, not only a molecule string.",
    "Contact map should overlap the target residue window or a justified adjacent regulatory interface.",
    "Predicted mechanism should modulate dimerization/interface signaling rather than ATP chemistry alone.",
    "Run selectivity checks against related kinases or receptor family members before claiming specificity.",
    "Treat all output as a hypothesis until validated by experimental structure, binding, signaling, and toxicity assays.",
  ];

  return {
    id: `egfr_contract_${rank}_${slug(primary.name)}_${match.target.residueStart}_${match.target.residueEnd}`,
    protein: artifact.protein,
    gene: artifact.gene,
    target: {
      label: match.target.label,
      residues,
      source: match.target.source,
      bioMotifs: match.target.motifs,
      allostericScore: match.target.allostericScore,
      confidence: match.target.confidence,
    },
    systemsAnalogy: {
      primaryPattern: primary.name,
      domain: primary.domain,
      similarity: primary.similarity,
      mechanism: primary.mechanism,
    },
    motifPayload: {
      intent,
      requiredEffects,
      prohibitedEffects,
    },
    fidelityTest,
    smartModulatorSpec,
    geometryConstraints,
    kineticStructuralConstraints,
    validationGates,
    generatorPrompt: buildGeneratorPrompt(
      artifact,
      match,
      primary,
      intent,
      geometryConstraints,
      kineticStructuralConstraints,
      fidelityTest,
      smartModulatorSpec,
    ),
    caveats: [
      "This contract is a cross-domain design hypothesis, not a drug candidate.",
      "It does not estimate binding affinity, ADMET, clinical efficacy, or safety.",
      "Use chemistry-specific and biology-specific validation before scientific or medical claims.",
    ],
  };
}

function choosePrimaryPattern(match: BridgeMatch): BridgeMatch["matches"][number] {
  const label = match.target.label.toLowerCase();
  const dimerization = label.includes("dimer") || label.includes("activation") || label.includes("phosphorylation");
  if (dimerization) {
    return (
      match.matches.find((item) => item.name === "Debounce filter") ??
      match.matches.find((item) => item.name === "Backpressure") ??
      match.matches[0]
    );
  }
  return match.matches[0];
}

function intentFor(pattern: string, motifs: string[]): string {
  if (pattern === "Debounce filter") return "Suppress transient regulatory-interface activation while preserving sustained physiological signaling.";
  if (pattern === "Backpressure") return "Introduce reversible friction into upstream signaling throughput without hard catalytic shutdown.";
  if (pattern === "Circuit breaker") return "Open a reversible safety boundary when pathological feedback loops dominate.";
  if (pattern === "Bulkhead isolation") return "Reduce propagation from one signaling module into adjacent downstream modules.";
  if (pattern === "Token bucket rate limiter") return "Meter activation events so bursts are constrained without permanent inhibition.";
  if (pattern === "Semaphore") return "Limit simultaneous receptor-interface activation states.";
  return `Regulate ${motifs.join(" + ")} motifs through a reversible allosteric mechanism.`;
}

function requiredEffectsFor(pattern: string, motifs: string[]): string[] {
  const common = [
    `Modulate the target's ${motifs.join(" + ")} motif signature.`,
    "Act through an allosteric/interface mechanism rather than direct orthosteric shutdown.",
    "Prefer reversible, tunable modulation over irreversible blockade.",
  ];
  if (pattern === "Debounce filter") {
    return [
      ...common,
      "Increase the persistence threshold required for productive dimer/interface activation.",
      "Filter noisy or transient contacts more strongly than sustained physiological contacts.",
    ];
  }
  if (pattern === "Backpressure") {
    return [...common, "Slow upstream-to-downstream signal transfer through interface friction."];
  }
  if (pattern === "Bulkhead isolation") {
    return [...common, "Reduce propagation across modular handoff surfaces."];
  }
  if (pattern === "Circuit breaker") {
    return [...common, "Bias the protein toward a recoverable inactive or open-loop regulatory state under excessive activation."];
  }
  return common;
}

function kineticConstraintsFor(pattern: string): string[] {
  if (pattern === "Debounce filter") {
    return [
      "Increase the time or persistence threshold for productive interface engagement.",
      "Avoid permanent locking; healthy sustained signaling should remain plausible.",
      "Prefer mechanisms that alter on/off kinetics at the interface rather than abolishing catalytic capability.",
    ];
  }
  if (pattern === "Backpressure") {
    return [
      "Increase steric or conformational friction at the regulatory interface.",
      "Reduce throughput of pathological activation cascades without requiring full receptor shutdown.",
    ];
  }
  if (pattern === "Bulkhead isolation") {
    return [
      "Disrupt pathological module-to-module coupling while preserving unrelated local structure.",
      "Prefer local interface insulation over global unfolding or destabilization.",
    ];
  }
  if (pattern === "Circuit breaker") {
    return [
      "Favor reversible inactive-state stabilization under excessive activation pressure.",
      "Avoid irreversible terminal-state traps unless validated as selective.",
    ];
  }
  return ["Prefer reversible modulation, allosteric selectivity, and preserved baseline structure."];
}

function buildFidelityTest(pattern: string, match: BridgeMatch): ExecutionContract["fidelityTest"] {
  const richer = [
    "Market volatility circuit breaker: dormant until rate-of-change exceeds a threshold.",
    "Highway ramp metering: local gate controlled by downstream congestion feedback.",
    "Debounce filter: transient contacts are ignored; persistent signals pass.",
    "Backpressure: downstream overload slows upstream throughput without full shutdown.",
  ];
  const baseline =
    "Conventional allosteric modulation is often a static wedge: once bound, it applies constant friction regardless of signaling context.";
  const gap =
    "The static wedge lacks an internal Feedback loop and therefore cannot distinguish healthy baseline signaling from pathological high-frequency or tumor-context signaling.";
  const upgrade =
    pattern === "Debounce filter"
      ? "Upgrade the molecule from passive friction to a context-aware kinetic filter."
      : "Upgrade the molecule from static binding to state-dependent, feedback-gated modulation.";
  return {
    baselineDrugArchitecture: baseline,
    richerReferenceArchitectures: richer,
    fidelityGap: gap,
    upgradePrinciple: `${upgrade} Target ${match.target.residueStart}-${match.target.residueEnd} should be regulated by signal dynamics and environment, not geometry alone.`,
  };
}

function buildSmartModulatorSpec(pattern: string, match: BridgeMatch): ExecutionContract["smartModulatorSpec"] {
  const residues = `${match.target.residueStart}-${match.target.residueEnd}`;
  const dimerRegion = match.target.label.toLowerCase().includes("dimer") || residues === "688-704";
  return {
    volatilityTrigger: dimerRegion
      ? "Prefer high affinity for open/active or transition-like hinge conformations; avoid strong resting-state affinity. The hypothesized binder should require repeated or persistent interface exposure before stable engagement."
      : "Prefer state-dependent affinity that rises under pathological activation dynamics and remains weak in resting conformations.",
    downstreamSensor:
      "Add an environment-gated activation concept: the binding interface should be masked or weak at healthy extracellular pH and become exposed or stronger under tumor-like context such as lower pH or oxidative stress. This is a hypothesis specification, not a validated chemistry claim.",
    dualGateLogic:
      "Engage only when both gates are satisfied: (1) target conformation indicates high-frequency/pathological activation and (2) local environment indicates disease-context stress. If either gate is absent, remain weakly binding or inactive.",
    suggestedEnvironmentalGates: ["lower pH tumor microenvironment", "elevated reactive oxygen species", "protease-cleavable tumor-context linker", "redox-sensitive steric shield"],
  };
}

function buildGeneratorPrompt(
  artifact: BridgeArtifact,
  match: BridgeMatch,
  primary: BridgeMatch["matches"][number],
  intent: string,
  geometryConstraints: string[],
  kineticStructuralConstraints: string[],
  fidelityTest?: ExecutionContract["fidelityTest"],
  smartModulatorSpec?: ExecutionContract["smartModulatorSpec"],
): string {
  return [
    `Design-hypothesis contract for ${artifact.gene} (${artifact.protein}).`,
    `Target region: residues ${match.target.residueStart}-${match.target.residueEnd}.`,
    `Target annotation: ${match.target.label}.`,
    `Motif payload: ${match.target.motifs.join(" + ")}.`,
    `Systems analogy: ${primary.name} (${primary.domain}), similarity ${primary.similarity.toFixed(4)}.`,
    `Mechanistic intent: ${intent}`,
    "Fidelity upgrade:",
    "- Avoid static allosteric friction as the only mechanism.",
    "- Prefer a context-aware smart modulator with feedback-like gating.",
    ...(fidelityTest ? [`- Fidelity gap: ${fidelityTest.fidelityGap}`, `- Upgrade principle: ${fidelityTest.upgradePrinciple}`] : []),
    ...(smartModulatorSpec
      ? [
          "Smart modulator gates:",
          `- Volatility trigger: ${smartModulatorSpec.volatilityTrigger}`,
          `- Downstream sensor: ${smartModulatorSpec.downstreamSensor}`,
          `- Dual gate logic: ${smartModulatorSpec.dualGateLogic}`,
        ]
      : []),
    "Geometry constraints:",
    ...geometryConstraints.map((item) => `- ${item}`),
    "Kinetic/structural constraints:",
    ...kineticStructuralConstraints.map((item) => `- ${item}`),
    "Return candidate molecules or binders only with predicted pose, contact map, and rationale. Do not claim therapeutic efficacy.",
  ].join("\n");
}

function buildReport(contracts: ExecutionContract[]): string {
  return [
    "# Bio AST Execution Contracts",
    "",
    "## Status",
    "",
    "These contracts convert BioMotifIR + System2Vec matches into molecule-generator-facing design hypotheses. They are not therapeutics, not docking results, and not biological validation.",
    "",
    `Artifact: \`${path.relative(projectRoot, contractsPath)}\``,
    "",
    "## Contracts",
    "",
    ...contracts.flatMap((contract, index) => [
      `### ${index + 1}. ${contract.id}`,
      "",
      `- Target: ${contract.target.label}`,
      `- Residues: ${contract.target.residues}`,
      `- Bio motifs: ${contract.target.bioMotifs.join(", ")}`,
      `- Systems analogy: ${contract.systemsAnalogy.primaryPattern} (${contract.systemsAnalogy.similarity.toFixed(4)})`,
      `- Intent: ${contract.motifPayload.intent}`,
      `- Fidelity gap: ${contract.fidelityTest.fidelityGap}`,
      `- Upgrade principle: ${contract.fidelityTest.upgradePrinciple}`,
      "",
      "Required effects:",
      ...contract.motifPayload.requiredEffects.map((item) => `- ${item}`),
      "",
      "Smart modulator spec:",
      `- Volatility trigger: ${contract.smartModulatorSpec.volatilityTrigger}`,
      `- Downstream sensor: ${contract.smartModulatorSpec.downstreamSensor}`,
      `- Dual-gate logic: ${contract.smartModulatorSpec.dualGateLogic}`,
      `- Candidate environmental gates: ${contract.smartModulatorSpec.suggestedEnvironmentalGates.join(", ")}`,
      "",
      "Prohibited effects:",
      ...contract.motifPayload.prohibitedEffects.map((item) => `- ${item}`),
      "",
      "Validation gates:",
      ...contract.validationGates.map((item) => `- ${item}`),
      "",
      "Generator prompt:",
      "",
      "```text",
      contract.generatorPrompt,
      "```",
      "",
    ]),
    "## Safety Boundary",
    "",
    "- These are executable design specifications for downstream computational chemistry workflows.",
    "- They should be evaluated with docking, contact maps, selectivity screens, structural biology, signaling assays, and toxicity assays.",
    "- No medical, clinical, or therapeutic claim follows from this contract alone.",
    "",
  ].join("\n");
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
