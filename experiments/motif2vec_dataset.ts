import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

interface Motif {
  index: number;
  name: string;
  group: string;
}

interface DomainExample {
  domain: string;
  text: string;
}

interface Archetype {
  id: string;
  title: string;
  description: string;
  vector: Record<number, number>;
  examples: DomainExample[];
  hardNegative?: DomainExample;
}

interface DatasetRow {
  id: string;
  split: "train" | "dev" | "test";
  archetype: string;
  domain: string;
  text: string;
  motif_vector: number[];
  active_motifs: Array<{ index: number; name: string; weight: number }>;
  source?: "seed" | "synthetic_10k";
  oracle?: {
    labeler: string;
    rationale: string;
  };
}

interface PairRow {
  id: string;
  relation: "positive_cross_domain" | "hard_negative";
  left: string;
  right: string;
  expected_similarity: "high" | "low";
  rationale: string;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const outputDir = path.join(projectRoot, "artifacts", "motif2vec");
const datasetPath = path.join(outputDir, "seed.jsonl");
const corpus10kPath = path.join(outputDir, "corpus_10k.jsonl");
const trainPath = path.join(outputDir, "train.jsonl");
const devPath = path.join(outputDir, "dev.jsonl");
const testPath = path.join(outputDir, "test.jsonl");
const pairPath = path.join(outputDir, "eval_pairs.jsonl");
const reportPath = path.join(projectRoot, "motif2vec_dataset.md");
const TARGET_CORPUS_ROWS = 10_000;

const motifs: Motif[] = [
  motif(1, "State", "Existence"),
  motif(2, "Transition", "Existence"),
  motif(3, "Invariant", "Existence"),
  motif(4, "Identity", "Existence"),
  motif(5, "Boundary", "Existence"),
  motif(6, "Terminal State", "Existence"),
  motif(7, "Decay", "Existence"),
  motif(8, "Storage", "Persistence"),
  motif(9, "Addressing", "Persistence"),
  motif(10, "Replication", "Persistence"),
  motif(11, "Synchronization", "Persistence"),
  motif(12, "Representation", "Intelligence"),
  motif(13, "Feedback", "Intelligence"),
  motif(14, "Prediction", "Intelligence"),
  motif(15, "Search", "Intelligence"),
  motif(16, "Model", "Intelligence"),
  motif(17, "Compression", "Intelligence"),
  motif(18, "Optimization", "Intelligence"),
  motif(19, "Explore/Exploit", "Intelligence"),
  motif(20, "Self-Reference", "Intelligence"),
  motif(21, "Composition", "Structure"),
  motif(22, "Hierarchy", "Structure"),
  motif(23, "Modularity", "Structure"),
  motif(24, "Abstraction", "Structure"),
  motif(25, "Emergence", "Structure"),
  motif(26, "Scarcity", "Allocation"),
  motif(27, "Queue", "Allocation"),
  motif(28, "Scheduling", "Allocation"),
  motif(29, "Communication", "Coordination"),
  motif(30, "Authority", "Coordination"),
  motif(31, "Reconciliation", "Coordination"),
  motif(32, "Negotiation", "Coordination"),
];

const archetypes: Archetype[] = [
  {
    id: "authority_reconciles_divergence",
    title: "Authority reconciles divergent replicas",
    description: "A legitimate coordinator compares inconsistent copies and resolves them into one accepted state.",
    vector: { 1: 0.55, 10: 0.82, 11: 0.72, 29: 0.45, 30: 0.86, 31: 0.92 },
    examples: [
      ex("software", "The merge controller reconciled two diverging Git branches and blessed the canonical history."),
      ex("distributed systems", "The consensus leader compared stale replicas and committed the authoritative ledger entry."),
      ex("biology", "Mismatch repair enzymes reconciled the copied DNA strand against the trusted template."),
      ex("finance", "The clearing house resolved two inconsistent ledgers and issued the settlement record."),
      ex("human organization", "The mediator aligned conflicting department reports into a single approved plan."),
    ],
    hardNegative: ex("finance", "The central bank announced a speech about ledger modernization without comparing any divergent records."),
  },
  {
    id: "boundary_blocks_invalid_transition",
    title: "Boundary blocks invalid transition",
    description: "A guard prevents a transition because required invariants or authorization are missing.",
    vector: { 2: 0.8, 3: 0.78, 5: 0.9, 6: 0.45, 13: 0.35, 30: 0.62 },
    examples: [
      ex("software", "The type checker rejected the cast because the value could not cross the interface boundary safely."),
      ex("security", "The firewall blocked the packet before it entered the protected network zone."),
      ex("medicine", "The surgeon refused to proceed because the preoperative clearance invariant was missing."),
      ex("law", "The clerk rejected the filing because jurisdiction had not been established."),
      ex("manufacturing", "The safety gate stopped the press when the guard rail sensor was open."),
    ],
    hardNegative: ex("security", "The firewall appliance was mounted beside a network boundary diagram."),
  },
  {
    id: "local_success_global_failure",
    title: "Local transition falsely reports global completion",
    description: "A subsystem emits success while the parent process remains incomplete or invalid.",
    vector: { 1: 0.45, 2: 0.72, 3: 0.72, 6: 0.86, 21: 0.48, 22: 0.55, 31: 0.7 },
    examples: [
      ex("release engineering", "The deploy step reported success, but the release was invalid because migration verification never ran."),
      ex("payments", "The checkout page showed paid while inventory reservation failed downstream."),
      ex("healthcare", "The triage form was marked complete even though physician review was still pending."),
      ex("agentic AI", "The tool returned deleted successfully, but the requested workspace cleanup had removed the wrong target."),
      ex("operations", "The ticket was closed locally while the customer-visible incident remained unresolved."),
    ],
    hardNegative: ex("operations", "The ticket mentioned success and failure counts in a weekly dashboard."),
  },
  {
    id: "stale_representation_causes_bad_action",
    title: "Stale representation causes action against old state",
    description: "A decision is made from a cached or obsolete model of the world.",
    vector: { 1: 0.5, 2: 0.55, 7: 0.82, 8: 0.45, 12: 0.95, 16: 0.55, 31: 0.5 },
    examples: [
      ex("software", "The worker approved the refund using cached policy v17 after the authority had moved to v18."),
      ex("logistics", "The dispatcher routed trucks from yesterday's map after the bridge closure changed the network."),
      ex("medicine", "The dosage calculator used an old allergy profile and recommended the unsafe drug."),
      ex("finance", "The risk engine priced the trade from a stale market snapshot."),
      ex("robotics", "The robot grasped at the old object position after the camera feed lagged."),
    ],
    hardNegative: ex("software", "The worker cached static icons to make the refund page load faster."),
  },
  {
    id: "queue_scarcity_schedules_access",
    title: "Scarcity creates queue and scheduling pressure",
    description: "Limited capacity forces ordered access to a scarce resource.",
    vector: { 1: 0.35, 2: 0.45, 26: 0.92, 27: 0.9, 28: 0.88, 29: 0.35 },
    examples: [
      ex("compute", "The scheduler queued low-priority jobs until GPU capacity became available."),
      ex("healthcare", "Patients waited in triage because only one imaging room was open."),
      ex("transportation", "Aircraft held in a landing queue while the runway accepted one plane at a time."),
      ex("manufacturing", "Orders backed up behind the single heat-treatment furnace."),
      ex("customer support", "Urgent tickets jumped the queue when the support team hit staffing limits."),
    ],
    hardNegative: ex("transportation", "The runway queue was painted with fresh lane markings."),
  },
  {
    id: "feedback_corrects_prediction",
    title: "Feedback corrects a predictive model",
    description: "Observed error updates a model or policy to reduce future mismatch.",
    vector: { 12: 0.7, 13: 0.95, 14: 0.78, 16: 0.8, 18: 0.52, 29: 0.35 },
    examples: [
      ex("machine learning", "The recommender updated its ranking model after users ignored the predicted items."),
      ex("biology", "The organism adjusted its movement after sensory feedback contradicted the predicted path."),
      ex("education", "The tutor changed the lesson plan after quiz results revealed a misconception."),
      ex("operations", "The on-call rota was tuned after incident response times missed the forecast."),
      ex("finance", "The fraud model lowered its threshold after chargeback feedback exposed false negatives."),
    ],
    hardNegative: ex("machine learning", "The prediction dashboard displayed feedback buttons in the footer."),
  },
  {
    id: "identity_alias_crosses_boundary",
    title: "Identity alias crosses ownership boundary",
    description: "Two identifiers collapse or split incorrectly, causing access or state to attach to the wrong entity.",
    vector: { 4: 0.95, 5: 0.72, 9: 0.78, 12: 0.5, 29: 0.38, 31: 0.6 },
    examples: [
      ex("identity systems", "Two accounts shared an email alias, so entitlements attached to the wrong user."),
      ex("filesystems", "A symlink made the cleanup job treat the archive path as the live directory."),
      ex("biology", "The lab mislabeled two samples and attributed the mutation to the wrong patient."),
      ex("legal", "A duplicate corporate name caused the filing to bind the wrong entity."),
      ex("payments", "The processor matched the refund to a reused customer token instead of the current order."),
    ],
    hardNegative: ex("identity systems", "The user changed the display name shown beside the email field."),
  },
  {
    id: "modular_composition_emerges_behavior",
    title: "Local modules compose into emergent behavior",
    description: "Independent components combine into a higher-level behavior not visible in one component alone.",
    vector: { 21: 0.95, 22: 0.55, 23: 0.82, 24: 0.45, 25: 0.88, 29: 0.4 },
    examples: [
      ex("software", "Small services composed through events produced a new fraud-review workflow."),
      ex("biology", "Cells following simple chemical gradients formed a coordinated tissue boundary."),
      ex("economics", "Individual bids aggregated into a market price none of the traders set directly."),
      ex("robotics", "Simple swarm rules produced coordinated coverage of the search area."),
      ex("organization", "Independent team rituals combined into an informal release governance process."),
    ],
    hardNegative: ex("software", "The service had a module named EmergentBehavior in the source tree."),
  },
  {
    id: "compression_loses_invariant",
    title: "Compression drops a necessary invariant",
    description: "A simplified representation omits a constraint required for correct reconstruction or action.",
    vector: { 3: 0.82, 12: 0.62, 17: 0.94, 24: 0.58, 31: 0.45 },
    examples: [
      ex("analytics", "The dashboard grouped refunds by day and hid the approval-version invariant."),
      ex("medicine", "The summary note omitted the allergy constraint that made the prescription unsafe."),
      ex("software", "The API DTO dropped the tenant field required for authorization."),
      ex("law", "The contract abstract omitted the exception that controlled the dispute."),
      ex("finance", "The compressed risk report hid the exposure netting rule."),
    ],
    hardNegative: ex("analytics", "The dashboard compressed images before sending the weekly email."),
  },
  {
    id: "negotiation_resolves_conflicting_goals",
    title: "Negotiation resolves conflicting objectives",
    description: "Agents with different goals exchange constraints until they reach an acceptable agreement.",
    vector: { 3: 0.35, 22: 0.45, 29: 0.76, 30: 0.35, 31: 0.7, 32: 0.95 },
    examples: [
      ex("business", "Procurement and engineering traded constraints until both accepted the vendor contract."),
      ex("distributed systems", "Nodes exchanged proposals until the quorum accepted one value."),
      ex("diplomacy", "The parties conceded border inspections in exchange for sanctions relief."),
      ex("product", "Design and compliance negotiated a flow that preserved conversion and auditability."),
      ex("family logistics", "Parents swapped pickup duties until the schedule covered both children."),
    ],
    hardNegative: ex("business", "The vendor contract used the word negotiation in its title."),
  },
  {
    id: "search_explore_exploit_optimization",
    title: "Search balances exploration and exploitation",
    description: "A system probes alternatives while spending more effort on promising options.",
    vector: { 14: 0.35, 15: 0.9, 18: 0.82, 19: 0.94, 26: 0.38 },
    examples: [
      ex("machine learning", "The bandit tested new ads while allocating most traffic to the best performer."),
      ex("science", "The lab screened many compounds and then concentrated assays on the strongest candidates."),
      ex("hiring", "The recruiter tried new sourcing channels while prioritizing the one producing qualified candidates."),
      ex("robotics", "The rover sampled unknown paths but returned to routes with higher expected traction."),
      ex("product", "The growth team explored onboarding variants and exploited the version with higher retention."),
    ],
    hardNegative: ex("science", "The paper mentioned a search bar and an optimization appendix."),
  },
  {
    id: "self_reference_model_updates_self",
    title: "Self-reference changes the system model",
    description: "A system represents or modifies itself, making its own state part of the computation.",
    vector: { 12: 0.6, 16: 0.72, 20: 0.95, 21: 0.35, 29: 0.35 },
    examples: [
      ex("software", "The compiler recompiled its own optimizer and changed the rules used for the next build."),
      ex("governance", "The committee amended the procedure that defines how future amendments are approved."),
      ex("AI agents", "The agent inspected its tool policy and rewrote the plan constraints before acting."),
      ex("biology", "The cell regulated the genes that regulate its own stress response."),
      ex("law", "The constitution defined the process by which the constitution could be changed."),
    ],
    hardNegative: ex("software", "The compiler documentation referred readers to its own manual."),
  },
];

const syntheticDomains = [
  "software",
  "distributed systems",
  "biology",
  "medicine",
  "law",
  "finance",
  "logistics",
  "manufacturing",
  "robotics",
  "education",
  "security",
  "operations",
  "public policy",
  "energy",
  "research",
  "agentic AI",
];

const actors = [
  "controller",
  "reviewer",
  "scheduler",
  "auditor",
  "agent",
  "coordinator",
  "service",
  "operator",
  "model",
  "committee",
  "gateway",
  "worker",
];

const resources = [
  "record",
  "workflow",
  "policy",
  "request",
  "state",
  "queue",
  "replica",
  "case",
  "artifact",
  "plan",
  "boundary",
  "model",
];

const pluralResources: Record<string, string> = {
  boundary: "boundaries",
  policy: "policies",
};

const modifiers = [
  "during a routine run",
  "after a delayed update",
  "under peak load",
  "while inputs were changing",
  "after the handoff",
  "before final approval",
  "during reconciliation",
  "after a local success signal",
  "when the parent process checked completion",
  "while the cached view was still active",
];

const patternByArchetype: Record<string, string[]> = {
  authority_reconciles_divergence: [
    "In {domain}, the {actor} compared diverging {resource}s and declared one authoritative state {modifier}.",
    "The {actor} reconciled inconsistent {resource}s so downstream teams could trust a single version {modifier}.",
    "Two replicas disagreed, and the {actor} resolved them into a canonical {resource} {modifier}.",
  ],
  boundary_blocks_invalid_transition: [
    "In {domain}, the {actor} blocked the {resource} from crossing the boundary because an invariant was missing {modifier}.",
    "The transition was rejected when the {actor} found that the required authorization did not hold {modifier}.",
    "A guard stopped the {resource} before it entered the protected state {modifier}.",
  ],
  local_success_global_failure: [
    "In {domain}, the {actor} reported local success, but the parent workflow had not reached a valid terminal state {modifier}.",
    "The {resource} looked complete inside one subsystem while global reconciliation later failed {modifier}.",
    "A local transition returned done even though the broader process still violated completion rules {modifier}.",
  ],
  stale_representation_causes_bad_action: [
    "In {domain}, the {actor} acted on an obsolete representation of the {resource} {modifier}.",
    "The decision used a stale model, so the resulting transition no longer matched the current state {modifier}.",
    "A cached view made the {actor} choose the wrong action after the source of truth changed {modifier}.",
  ],
  queue_scarcity_schedules_access: [
    "In {domain}, scarce capacity forced the {actor} to queue requests and schedule access to the {resource} {modifier}.",
    "The bottleneck admitted one {resource} at a time while the backlog waited {modifier}.",
    "Limited supply made the scheduler prioritize urgent work and defer the rest {modifier}.",
  ],
  feedback_corrects_prediction: [
    "In {domain}, feedback contradicted the prediction and caused the {actor} to update its model {modifier}.",
    "Observed error from the {resource} adjusted the policy so future predictions improved {modifier}.",
    "The system compared expected and actual outcomes, then corrected the model {modifier}.",
  ],
  identity_alias_crosses_boundary: [
    "In {domain}, an alias made the {actor} attach the {resource} to the wrong identity boundary {modifier}.",
    "Two identifiers collapsed together, so state crossed into the wrong owner {modifier}.",
    "The address resolved to an unexpected entity and moved access across a boundary {modifier}.",
  ],
  modular_composition_emerges_behavior: [
    "In {domain}, small modules composed into a higher-level behavior no single part contained {modifier}.",
    "Independent components interacted until an emergent workflow appeared {modifier}.",
    "Local rules combined through communication and produced a system-level pattern {modifier}.",
  ],
  compression_loses_invariant: [
    "In {domain}, a compressed representation of the {resource} omitted the invariant needed for safe action {modifier}.",
    "The summary preserved the headline state but dropped the constraint that made reconstruction valid {modifier}.",
    "An abstracted model hid the rule required to decide the transition correctly {modifier}.",
  ],
  negotiation_resolves_conflicting_goals: [
    "In {domain}, agents exchanged constraints and negotiated an acceptable shared {resource} {modifier}.",
    "The parties revised offers until conflicting goals reconciled into one agreement {modifier}.",
    "Communication converted incompatible objectives into a negotiated plan {modifier}.",
  ],
  search_explore_exploit_optimization: [
    "In {domain}, the {actor} explored alternatives while exploiting the best known {resource} {modifier}.",
    "The search process sampled uncertain options and concentrated effort on promising candidates {modifier}.",
    "Optimization balanced new probes against the current winner {modifier}.",
  ],
  self_reference_model_updates_self: [
    "In {domain}, the {actor} represented its own rules and updated the model that controls future action {modifier}.",
    "The system made its own state part of the computation and changed its next transition {modifier}.",
    "A self-referential policy edited the procedure used to evaluate later procedures {modifier}.",
  ],
};

async function main(): Promise<void> {
  await mkdir(outputDir, { recursive: true });
  const rows = buildRows();
  const corpus10k = buildSyntheticCorpus(TARGET_CORPUS_ROWS);
  const allRows = [...rows, ...corpus10k];
  const pairs = buildPairs(rows);
  await writeFile(datasetPath, `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`);
  await writeFile(corpus10kPath, `${corpus10k.map((row) => JSON.stringify(row)).join("\n")}\n`);
  await writeFile(trainPath, `${allRows.filter((row) => row.split === "train").map((row) => JSON.stringify(row)).join("\n")}\n`);
  await writeFile(devPath, `${allRows.filter((row) => row.split === "dev").map((row) => JSON.stringify(row)).join("\n")}\n`);
  await writeFile(testPath, `${allRows.filter((row) => row.split === "test").map((row) => JSON.stringify(row)).join("\n")}\n`);
  await writeFile(pairPath, `${pairs.map((row) => JSON.stringify(row)).join("\n")}\n`);
  await writeFile(reportPath, buildReport(rows, corpus10k, pairs));
  console.log(`motif2vec seed dataset written to ${datasetPath}`);
  console.log(`motif2vec 10k corpus written to ${corpus10kPath}`);
  console.log(`motif2vec train/dev/test splits written to ${outputDir}`);
  console.log(`motif2vec eval pairs written to ${pairPath}`);
  console.log(`motif2vec dataset report written to ${reportPath}`);
}

function buildRows(): DatasetRow[] {
  const rows: DatasetRow[] = [];
  for (const archetype of archetypes) {
    archetype.examples.forEach((example, index) => {
      rows.push({
        id: `${archetype.id}:${example.domain.replace(/\W+/g, "_")}`,
        split: splitFor(index),
        archetype: archetype.id,
        domain: example.domain,
        text: example.text,
        motif_vector: vectorFromMotifs(archetype.vector),
        active_motifs: activeMotifs(archetype.vector),
        source: "seed",
        oracle: oracleFor(archetype),
      });
    });
    if (archetype.hardNegative) {
      const hardVector = hardNegativeVector(archetype.vector);
      rows.push({
        id: `${archetype.id}:hard_negative`,
        split: "test",
        archetype: `${archetype.id}_lexical_negative`,
        domain: archetype.hardNegative.domain,
        text: archetype.hardNegative.text,
        motif_vector: vectorFromMotifs(hardVector),
        active_motifs: activeMotifs(hardVector),
        source: "seed",
        oracle: {
          labeler: "deterministic_motif_oracle_v0",
          rationale: "Lexical hard negative: shares some surface terms but lacks the archetype's structural relation.",
        },
      });
    }
  }
  return rows;
}

function buildSyntheticCorpus(targetRows: number): DatasetRow[] {
  const rows: DatasetRow[] = [];
  for (let index = 0; index < targetRows; index += 1) {
    const archetype = archetypes[index % archetypes.length];
    const domain = syntheticDomains[(index * 7 + archetype.id.length) % syntheticDomains.length];
    if (archetype.hardNegative && Math.floor(index / archetypes.length) % 8 === 7) {
      const hardVector = hardNegativeVector(archetype.vector);
      rows.push({
        id: `synthetic:${String(index + 1).padStart(5, "0")}:${archetype.id}:lexical_negative`,
        split: splitForIndex(index),
        archetype: `${archetype.id}_lexical_negative`,
        domain,
        text: syntheticHardNegativeText(archetype, domain, index),
        motif_vector: vectorFromMotifs(hardVector),
        active_motifs: activeMotifs(hardVector),
        source: "synthetic_10k",
        oracle: {
          labeler: "deterministic_motif_oracle_v0",
          rationale: "Synthetic lexical hard negative: preserves some nouns from the archetype but removes the structural relation.",
        },
      });
      continue;
    }
    const base = archetype.examples[index % archetype.examples.length];
    const text = syntheticText(archetype, domain, base.text, index);
    const sparseVector = jitterVector(archetype.vector, index);
    rows.push({
      id: `synthetic:${String(index + 1).padStart(5, "0")}:${archetype.id}`,
      split: splitForIndex(index),
      archetype: archetype.id,
      domain,
      text,
      motif_vector: vectorFromMotifs(sparseVector),
      active_motifs: activeMotifs(sparseVector),
      source: "synthetic_10k",
      oracle: oracleFor(archetype),
    });
  }
  return rows;
}

function buildPairs(rows: DatasetRow[]): PairRow[] {
  const pairs: PairRow[] = [];
  for (const archetype of archetypes) {
    const positives = rows.filter((row) => row.archetype === archetype.id);
    for (let index = 0; index < positives.length - 1; index += 1) {
      pairs.push({
        id: `${archetype.id}:positive:${index + 1}`,
        relation: "positive_cross_domain",
        left: positives[index].id,
        right: positives[index + 1].id,
        expected_similarity: "high",
        rationale: "Different domains share the same motif skeleton.",
      });
    }
    const hardNegative = rows.find((row) => row.archetype === `${archetype.id}_lexical_negative`);
    if (hardNegative) {
      pairs.push({
        id: `${archetype.id}:hard-negative`,
        relation: "hard_negative",
        left: positives[0].id,
        right: hardNegative.id,
        expected_similarity: "low",
        rationale: "Lexical overlap should not dominate structural motif mismatch.",
      });
    }
  }
  return pairs;
}

function buildReport(rows: DatasetRow[], corpus10k: DatasetRow[], pairs: PairRow[]): string {
  const allRows = [...rows, ...corpus10k];
  const coverage = motifs.map((item) => ({
    ...item,
    examples: allRows.filter((row) => row.motif_vector[item.index - 1] > 0).length,
  }));
  const retrievalProbe = retrieve(
    vectorFromMotifs({ 1: 0.55, 10: 0.82, 11: 0.72, 29: 0.45, 30: 0.86, 31: 0.92 }),
    allRows,
  ).slice(0, 8);
  const splitCounts = {
    train: allRows.filter((row) => row.split === "train").length,
    dev: allRows.filter((row) => row.split === "dev").length,
    test: allRows.filter((row) => row.split === "test").length,
  };

  return [
    "# motif2vec Dataset Generation Scope",
    "",
    "## Thesis",
    "",
    "The 32-D motif vector is not sufficient for causal reasoning, but it is a strong retrieval vector. `motif2vec` should therefore be packaged as a structural embedding layer: small, inspectable, cross-domain, and designed to complement ordinary semantic embeddings in dual-vector RAG.",
    "",
    "## Generated Seed Artifacts",
    "",
    `- Dataset JSONL: \`${path.relative(projectRoot, datasetPath)}\``,
    `- 10k corpus JSONL: \`${path.relative(projectRoot, corpus10kPath)}\``,
    `- Train split: \`${path.relative(projectRoot, trainPath)}\``,
    `- Dev split: \`${path.relative(projectRoot, devPath)}\``,
    `- Test split: \`${path.relative(projectRoot, testPath)}\``,
    `- Eval pairs JSONL: \`${path.relative(projectRoot, pairPath)}\``,
    `- Seed rows: ${rows.length}`,
    `- Synthetic rows: ${corpus10k.length}`,
    `- Total rows: ${allRows.length}`,
    `- Split counts: train ${splitCounts.train}, dev ${splitCounts.dev}, test ${splitCounts.test}`,
    `- Archetypes: ${archetypes.length}`,
    `- Pairwise eval cases: ${pairs.length}`,
    "",
    "## Row Schema",
    "",
    "```ts",
    "interface Motif2VecRow {",
    "  id: string;",
    "  split: 'train' | 'dev' | 'test';",
    "  archetype: string;",
    "  domain: string;",
    "  text: string;",
    "  motif_vector: number[]; // exactly 32 floats in [0, 1]",
    "  active_motifs: Array<{ index: number; name: string; weight: number }>;",
    "  oracle: { labeler: string; rationale: string };",
    "}",
    "```",
    "",
    "## Dataset Strategy",
    "",
    "1. Start with canonical structural archetypes, not topics.",
    "2. Generate 10,000 synthetic cross-domain phrasings from archetype templates.",
    "3. Treat archetype vectors as oracle-labeled training targets and keep active-motif rationales in every row.",
    "4. Attach lexical hard negatives for retrieval evaluation.",
    "5. Train a small regressor from text to the 32-D vector.",
    "6. Evaluate by cross-domain retrieval, lexical hard negatives, motif coverage, and calibration.",
    "",
    "## Seed Archetypes",
    "",
    "| Archetype | Examples | Dominant motifs |",
    "| --- | ---: | --- |",
    ...archetypes.map((item) => {
      const dominant = activeMotifs(item.vector)
        .slice(0, 4)
        .map((motifItem) => `${motifItem.name} ${motifItem.weight.toFixed(2)}`)
        .join(", ");
      return `| ${item.title} | ${item.examples.length} + hard negative | ${dominant} |`;
    }),
    "",
    "## Motif Coverage",
    "",
    "| # | Motif | Group | Rows |",
    "| ---: | --- | --- | ---: |",
    ...coverage.map((item) => `| ${item.index} | ${item.name} | ${item.group} | ${item.examples} |`),
    "",
    "## Structural Retrieval Probe",
    "",
    "Query vector: `Authority + Reconciliation + Replication + Synchronization + State + Communication`.",
    "",
    "| Rank | Score | ID | Domain | Text |",
    "| ---: | ---: | --- | --- | --- |",
    ...retrievalProbe.map(
      (item, index) => `| ${index + 1} | ${item.score.toFixed(4)} | ${item.row.id} | ${item.row.domain} | ${item.row.text} |`,
    ),
    "",
    "## Training Plan",
    "",
    "- Phase 0: deterministic seed set in this repo, used to prove schema and eval mechanics. Done.",
    "- Phase 1: generate 10k examples by expanding archetypes across software, biology, law, medicine, finance, logistics, organizations, and distributed systems. Done.",
    "- Phase 2: use an LLM oracle prompt to audit vectors, but keep every row as JSONL with inspectable active motifs. Next quality gate.",
    "- Phase 3: fine-tune a small sentence encoder or local regressor to emit 32 bounded floats. Implemented as a no-dependency baseline trainer in this repo.",
    "- Phase 4: publish `motif-embed-v1` with a dual-vector RAG example: `score = alpha * semantic + (1 - alpha) * motif`.",
    "",
    "## Evaluation Gates",
    "",
    "- Cross-domain positives: structurally equivalent examples should retrieve each other despite topic distance.",
    "- Lexical hard negatives: same nouns without the same structure should rank lower.",
    "- Motif coverage: every motif must appear in enough contexts before training.",
    "- Sparsity calibration: predictions should stay sparse when the input expresses a clean structure.",
    "- Dual-vector utility: blended retrieval should improve structural queries without harming ordinary topical lookup.",
    "",
  ].join("\n");
}

function syntheticText(archetype: Archetype, domain: string, baseText: string, index: number): string {
  const templates = patternByArchetype[archetype.id] ?? ["In {domain}, {base}"];
  const template = templates[index % templates.length];
  const actor = actors[(index * 5 + archetype.id.length) % actors.length];
  const resource = resources[(index * 11 + domain.length) % resources.length];
  const pluralResource = pluralResources[resource] ?? `${resource}s`;
  const modifier = modifiers[(index * 13 + archetype.title.length) % modifiers.length];
  const filled = template
    .replaceAll("{domain}", domain)
    .replaceAll("{actor}", actor)
    .replaceAll("{resource}", resource)
    .replaceAll("{resources}", pluralResource)
    .replaceAll("{modifier}", modifier)
    .replaceAll("{base}", baseText);
  if (index % 5 === 0) return `${filled} Example analogue: ${baseText}`;
  if (index % 7 === 0) return `${filled} The important structure is ${archetype.description.toLowerCase()}`;
  return filled;
}

function syntheticHardNegativeText(archetype: Archetype, domain: string, index: number): string {
  const actor = actors[(index * 3 + archetype.title.length) % actors.length];
  const resource = resources[(index * 17 + domain.length) % resources.length];
  const base = archetype.hardNegative?.text ?? `${archetype.title} was mentioned in a report.`;
  const variants = [
    `In ${domain}, the ${actor} mentioned ${resource} terminology from "${archetype.title}" but did not perform the structural operation.`,
    `The ${domain} note used words like ${resource}, authority, and state as labels without comparing, blocking, updating, or reconciling anything.`,
    `${base} The sentence is topical metadata rather than a process description.`,
    `A glossary entry in ${domain} defined the phrase "${archetype.title}" without any event, invariant, transition, or causal relation.`,
  ];
  return variants[index % variants.length];
}

function jitterVector(source: Record<number, number>, index: number): Record<number, number> {
  const output: Record<number, number> = {};
  for (const [motifIndex, weight] of Object.entries(source)) {
    const delta = ((positiveHash(`${index}:${motifIndex}`) % 9) - 4) / 100;
    output[Number(motifIndex)] = clamp(Number((weight + delta).toFixed(2)), 0.05, 1);
  }
  return output;
}

function oracleFor(archetype: Archetype): DatasetRow["oracle"] {
  const dominant = activeMotifs(archetype.vector)
    .slice(0, 4)
    .map((item) => item.name)
    .join(", ");
  return {
    labeler: "deterministic_motif_oracle_v0",
    rationale: `${archetype.title}: ${archetype.description} Dominant motifs: ${dominant}.`,
  };
}

function splitForIndex(index: number): DatasetRow["split"] {
  const bucket = positiveHash(`split:${index}`) % 10;
  if (bucket < 8) return "train";
  if (bucket === 8) return "dev";
  return "test";
}

function retrieve(query: number[], rows: DatasetRow[]): Array<{ row: DatasetRow; score: number }> {
  return rows
    .map((row) => ({ row, score: cosineSimilarity(query, row.motif_vector) }))
    .sort((left, right) => right.score - left.score);
}

function activeMotifs(entries: Record<number, number>): Array<{ index: number; name: string; weight: number }> {
  return Object.entries(entries)
    .map(([index, weight]) => {
      const motifItem = motifs[Number(index) - 1];
      return { index: Number(index), name: motifItem.name, weight };
    })
    .sort((left, right) => right.weight - left.weight);
}

function hardNegativeVector(source: Record<number, number>): Record<number, number> {
  const dominant = Object.keys(source)
    .map(Number)
    .sort((left, right) => source[right] - source[left])
    .slice(0, 2);
  const output: Record<number, number> = { 1: 0.25, 12: 0.25, 29: 0.25 };
  for (const index of dominant) output[index] = 0.12;
  return output;
}

function splitFor(index: number): DatasetRow["split"] {
  if (index < 3) return "train";
  if (index === 3) return "dev";
  return "test";
}

function vectorFromMotifs(entries: Record<number, number>): number[] {
  const vector = Array.from({ length: 32 }, () => 0);
  for (const [index, weight] of Object.entries(entries)) vector[Number(index) - 1] = weight;
  return vector;
}

function cosineSimilarity(left: number[], right: number[]): number {
  const dot = left.reduce((sum, value, index) => sum + value * right[index], 0);
  const leftNorm = Math.sqrt(left.reduce((sum, value) => sum + value * value, 0));
  const rightNorm = Math.sqrt(right.reduce((sum, value) => sum + value * value, 0));
  return leftNorm === 0 || rightNorm === 0 ? 0 : dot / (leftNorm * rightNorm);
}

function positiveHash(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function motif(index: number, name: string, group: string): Motif {
  return { index, name, group };
}

function ex(domain: string, text: string): DomainExample {
  return { domain, text };
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
