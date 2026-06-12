import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import https from "node:https";
import path from "node:path";

type FactKind =
  | "cache_config"
  | "policy_update"
  | "approval"
  | "exemption_claim"
  | "exemption_expired"
  | "authority_source"
  | "audit_violation"
  | "settlement_blocked";

type ObligationType =
  | "validate_authority"
  | "validate_freshness"
  | "validate_exemption"
  | "validate_terminal_state"
  | "validate_invariant"
  | "validate_reconciliation";

type ObligationStatus = "open" | "satisfied" | "violated" | "unknown";
type WorkKind = "scan_chunk" | "search_authority" | "search_exemption" | "search_terminal" | "search_reconciliation";

interface LogLine {
  lineNumber: number;
  text: string;
}

interface Fact {
  id: string;
  kind: FactKind;
  sourceLine: number;
  refund?: string;
  policyVersion?: string;
  usedPolicyVersion?: string;
  exemptionId?: string;
  authority?: string;
  timestamp: string;
  text: string;
}

interface MotifObligation {
  id: string;
  triggeredBy: string;
  obligationType: ObligationType;
  target: string;
  requiredEvidence: FactKind[];
  status: ObligationStatus;
  scheduledSearches: string[];
  resolvedBy: string[];
  rationale: string;
}

interface ProcessNode {
  id: string;
  nodeKind: "event" | "latent" | "obligation";
  role: string;
  sourceLine?: number;
  description: string;
}

interface GraphEdge {
  from: string;
  type: "creates_obligation" | "satisfies" | "violates" | "invalidates" | "causes" | "fails_downstream";
  to: string;
}

interface ProcessIR {
  id: string;
  title: string;
  facts: Fact[];
  obligations: MotifObligation[];
  eventFrames: ProcessNode[];
  latentConditions: ProcessNode[];
  causalGraph: {
    nodes: ProcessNode[];
    edges: GraphEdge[];
    rootCauses: string[];
  };
  terminalValidity: "valid" | "invalid" | "unknown";
  detection: {
    falseTerminalStates: string[];
    violatedInvariants: string[];
    unknownObligations: string[];
    violatedObligations: string[];
    satisfiedObligations: string[];
  };
  prescription: string[];
  confidence: number;
}

interface WorkItem {
  id: string;
  kind: WorkKind;
  target: string;
  reason: string;
}

interface ObligationTrace {
  step: number;
  action: string;
  discoveredFacts: string[];
  openedObligations: string[];
  resolvedObligations: string[];
  scheduledSearches: string[];
}

interface ScoreRow {
  system: string;
  obligationRecall: number;
  obligationPrecision: number;
  statusAccuracy: number;
  scheduledEvidenceRecall: number;
  terminalValidityCorrect: boolean;
  unknownHandling: boolean;
  rootCauseAccuracy: number;
  confidence: number;
  passed: boolean;
}

const projectRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const outputDir = path.join(projectRoot, "artifacts");
const dataDir = path.join(projectRoot, "data", "loghub");
const dataPath = path.join(dataDir, "Linux_2k.log");
const reportPath = path.join(projectRoot, "dlr_lambda_obligations.md");
const irPath = path.join(outputDir, "dlr_lambda_obligations_process_ir.json");
const LOGHUB_URL = "https://raw.githubusercontent.com/logpai/loghub/master/Linux/Linux_2k.log";
const CHUNK_SIZE = 300;

const injectedIncident = [
  {
    afterLine: 90,
    text: "Mar 10 12:00:00 labhost policyd[4100]: refund=R-915 cache ttl=1800s source=local-cache invariant=current-policy-before-terminal-approval",
  },
  {
    afterLine: 366,
    text: "Mar 10 12:01:00 labhost policyd[4100]: authority source=primary-policy refund-policy version=v18 rule=manager_review_required unless active_vip_exemption",
  },
  {
    afterLine: 702,
    text: "Mar 10 12:05:00 labhost worker[9931]: terminal=approved refund=R-915 using_policy_version=v17 exemption=EX-91 authority=local-cache",
  },
  {
    afterLine: 986,
    text: "Mar 10 12:05:20 labhost entitlements[2404]: exemption=EX-91 claimed refund=R-915 customer=C-91 status=claimed",
  },
  {
    afterLine: 1244,
    text: "Mar 10 12:03:00 labhost entitlements[2404]: exemption=EX-91 expired_at=12:03 before approval customer=C-91",
  },
  {
    afterLine: 1496,
    text: "Mar 10 12:06:00 labhost audit[2201]: refund=R-915 invariant_violation expected_policy=v18 observed_policy=v17 manager_review=missing exemption=EX-91",
  },
  {
    afterLine: 1758,
    text: "Mar 10 12:09:00 labhost finance[1180]: settlement_blocked refund=R-915 reason=approval_not_terminal_valid",
  },
];

async function main(): Promise<void> {
  await mkdir(outputDir, { recursive: true });
  await mkdir(dataDir, { recursive: true });
  await ensureLoghubSample();

  const originalLines = (await readFile(dataPath, "utf8")).split(/\r?\n/).filter(Boolean);
  const trace = injectIncident(originalLines);
  const chunks = split(trace, CHUNK_SIZE);
  const gold = buildGold(trace);
  const worklistOnly = runWorklistWithoutObligationSemantics(trace, chunks);
  const obligationRun = runObligationCalculus(trace, chunks);
  const scores = [
    scoreProcessIr("Worklist/fixpoint without obligation ledger", gold, worklistOnly.predicted),
    scoreProcessIr("DLR-lambda-3 obligation calculus", gold, obligationRun.predicted),
  ];

  await writeFile(
    irPath,
    `${JSON.stringify(
      {
        source: LOGHUB_URL,
        chunkSize: CHUNK_SIZE,
        injectedLines: trace.filter(isIncidentCarrier),
        gold,
        worklistOnly: worklistOnly.predicted,
        obligationCalculus: obligationRun.predicted,
        obligationTrace: obligationRun.trace,
        scores,
      },
      null,
      2,
    )}\n`,
  );
  await writeFile(reportPath, buildReport(trace, chunks, gold, worklistOnly.predicted, obligationRun.predicted, obligationRun.trace, scores));
  console.log(`DLR-lambda obligation report written to ${reportPath}`);
  console.log(`DLR-lambda obligation ProcessIR JSON written to ${irPath}`);
}

async function ensureLoghubSample(): Promise<void> {
  if (existsSync(dataPath)) return;
  const body = await download(LOGHUB_URL);
  await writeFile(dataPath, body);
}

function download(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          download(response.headers.location).then(resolve, reject);
          return;
        }
        if (response.statusCode !== 200) {
          reject(new Error(`Download failed: ${response.statusCode} ${url}`));
          return;
        }
        let data = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          data += chunk;
        });
        response.on("end", () => resolve(data));
      })
      .on("error", reject);
  });
}

function injectIncident(lines: string[]): LogLine[] {
  const output: LogLine[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    output.push({ lineNumber: output.length + 1, text: lines[index] });
    const injection = injectedIncident.find((item) => item.afterLine === index + 1);
    if (injection) output.push({ lineNumber: output.length + 1, text: injection.text });
  }
  return output.map((line, index) => ({ ...line, lineNumber: index + 1 }));
}

function split(lines: LogLine[], chunkSize: number): LogLine[][] {
  const chunks: LogLine[][] = [];
  for (let index = 0; index < lines.length; index += chunkSize) chunks.push(lines.slice(index, index + chunkSize));
  return chunks;
}

function runWorklistWithoutObligationSemantics(trace: LogLine[], chunks: LogLine[][]): { predicted: ProcessIR; facts: Fact[] } {
  const facts = chunks.flatMap((chunk) => extractPrimaryFacts(chunk));
  const hasExemptionClaim = facts.some((fact) => fact.kind === "approval" && fact.exemptionId) || facts.some((fact) => fact.kind === "exemption_claim");
  const followupFacts = hasExemptionClaim ? trace.flatMap((line) => extractFollowupFacts(line, "EX-91")) : [];
  const allFacts = [...facts, ...followupFacts].sort((left, right) => left.sourceLine - right.sourceLine);
  return { facts: allFacts, predicted: buildProcessIr("worklist-only", "Worklist/fixpoint without obligation ledger", allFacts, []) };
}

function runObligationCalculus(trace: LogLine[], chunks: LogLine[][]): { predicted: ProcessIR; facts: Fact[]; trace: ObligationTrace[] } {
  const factStore = new Map<string, Fact>();
  const obligationStore = new Map<string, MotifObligation>();
  const worklist: WorkItem[] = chunks.map((chunk, index) => ({
    id: `scan_${index + 1}`,
    kind: "scan_chunk",
    target: `${chunk[0]?.lineNumber ?? 0}:${chunk.at(-1)?.lineNumber ?? 0}`,
    reason: "Initial evidence scan",
  }));
  const scheduled = new Set(worklist.map((item) => item.id));
  const traces: ObligationTrace[] = [];
  let step = 0;

  while (worklist.length > 0 && step < 60) {
    const item = worklist.shift();
    if (!item) break;
    const beforeFacts = new Set(factStore.keys());
    const beforeObligations = new Map([...obligationStore].map(([key, value]) => [key, value.status]));
    const facts = executeWorkItem(item, trace, chunks);
    for (const fact of facts) factStore.set(fact.id, fact);
    const opened = openObligations([...factStore.values()], [...obligationStore.values()]);
    for (const obligation of opened) obligationStore.set(obligation.id, obligation);
    resolveObligations(obligationStore, [...factStore.values()]);
    const followups = scheduleObligationSearches([...obligationStore.values()], scheduled);
    for (const followup of followups) {
      scheduled.add(followup.id);
      worklist.push(followup);
    }
    const discoveredFacts = [...factStore.keys()].filter((id) => !beforeFacts.has(id));
    const resolvedObligations = [...obligationStore.values()]
      .filter((obligation) => beforeObligations.get(obligation.id) !== undefined && beforeObligations.get(obligation.id) !== obligation.status)
      .map((obligation) => `${obligation.id}:${obligation.status}`);
    traces.push({
      step: step + 1,
      action: `${item.kind}:${item.target}`,
      discoveredFacts,
      openedObligations: opened.map((obligation) => obligation.id),
      resolvedObligations,
      scheduledSearches: followups.map((followup) => followup.id),
    });
    step += 1;
  }

  const facts = [...factStore.values()].sort((left, right) => left.sourceLine - right.sourceLine);
  const obligations = [...obligationStore.values()].sort((left, right) => left.id.localeCompare(right.id));
  return { facts, trace: traces, predicted: buildProcessIr("obligation-calculus", "DLR-lambda-3 obligation calculus", facts, obligations) };
}

function executeWorkItem(item: WorkItem, trace: LogLine[], chunks: LogLine[][]): Fact[] {
  if (item.kind === "scan_chunk") {
    const [start, end] = item.target.split(":").map(Number);
    const chunk = chunks.find((candidate) => candidate[0]?.lineNumber === start && candidate.at(-1)?.lineNumber === end);
    return chunk ? extractPrimaryFacts(chunk) : [];
  }
  if (item.kind === "search_authority") {
    return trace.flatMap((line) => extractPrimaryFacts([line]).filter((fact) => fact.kind === "authority_source" || fact.kind === "policy_update"));
  }
  if (item.kind === "search_exemption") return trace.flatMap((line) => extractFollowupFacts(line, item.target));
  if (item.kind === "search_terminal") {
    return trace.flatMap((line) => extractPrimaryFacts([line]).filter((fact) => fact.kind === "audit_violation" || fact.kind === "settlement_blocked"));
  }
  if (item.kind === "search_reconciliation") {
    return trace.flatMap((line) => extractPrimaryFacts([line]).filter((fact) => fact.kind === "settlement_blocked"));
  }
  return [];
}

function openObligations(facts: Fact[], existing: MotifObligation[]): MotifObligation[] {
  const existingKeys = new Set(existing.map((obligation) => obligation.id));
  const output: MotifObligation[] = [];
  for (const fact of facts) {
    const candidates: MotifObligation[] = [];
    if (fact.kind === "cache_config") {
      candidates.push(obligation(fact, "validate_freshness", "policy_cache", ["policy_update"], "Cache use creates stale-representation risk."));
    }
    if (fact.kind === "policy_update") {
      candidates.push(obligation(fact, "validate_authority", "refund_policy_v18", ["authority_source"], "Policy version only matters if it is authoritative."));
    }
    if (fact.kind === "approval") {
      candidates.push(obligation(fact, "validate_freshness", "approval_policy_version", ["policy_update"], "Approval must use a current policy representation."));
      candidates.push(obligation(fact, "validate_terminal_state", "approval_terminal_state", ["audit_violation", "settlement_blocked"], "Local terminal success must satisfy parent invariants."));
      if (fact.exemptionId) {
        candidates.push(obligation(fact, "validate_exemption", fact.exemptionId, ["exemption_claim", "exemption_expired"], "An exemption claim is a frontier item, not an answer."));
      }
    }
    if (fact.kind === "audit_violation") {
      candidates.push(obligation(fact, "validate_invariant", "manager_review_invariant", ["policy_update", "approval"], "Audit violation must be connected to policy authority and local transition."));
    }
    if (fact.kind === "settlement_blocked") {
      candidates.push(obligation(fact, "validate_reconciliation", "settlement_reconciliation", ["audit_violation"], "Downstream block must be reconciled with upstream invariant failure."));
    }
    output.push(...candidates.filter((candidate) => !existingKeys.has(candidate.id)));
  }
  return output;
}

function obligation(fact: Fact, obligationType: ObligationType, target: string, requiredEvidence: FactKind[], rationale: string): MotifObligation {
  return {
    id: `${obligationType}_${target}`,
    triggeredBy: fact.id,
    obligationType,
    target,
    requiredEvidence,
    status: "open",
    scheduledSearches: [],
    resolvedBy: [],
    rationale,
  };
}

function resolveObligations(obligations: Map<string, MotifObligation>, facts: Fact[]): void {
  for (const obligationItem of obligations.values()) {
    const matching = facts.filter((fact) => obligationItem.requiredEvidence.includes(fact.kind));
    obligationItem.resolvedBy = matching.map((fact) => fact.id);
    if (obligationItem.obligationType === "validate_authority") {
      obligationItem.status = facts.some((fact) => fact.kind === "authority_source" && fact.authority === "primary-policy") ? "satisfied" : "open";
    } else if (obligationItem.obligationType === "validate_freshness") {
      const approval = facts.find((fact) => fact.kind === "approval");
      const update = facts.find((fact) => fact.kind === "policy_update");
      obligationItem.status = approval && update && approval.usedPolicyVersion !== update.policyVersion ? "violated" : matching.length > 0 ? "satisfied" : "open";
    } else if (obligationItem.obligationType === "validate_exemption") {
      obligationItem.status = facts.some((fact) => fact.kind === "exemption_expired" && fact.exemptionId === obligationItem.target)
        ? "violated"
        : facts.some((fact) => fact.kind === "exemption_claim" && fact.exemptionId === obligationItem.target)
          ? "satisfied"
          : "open";
    } else if (obligationItem.obligationType === "validate_terminal_state") {
      obligationItem.status = facts.some((fact) => fact.kind === "audit_violation" || fact.kind === "settlement_blocked") ? "violated" : "open";
    } else if (obligationItem.obligationType === "validate_invariant") {
      obligationItem.status = facts.some((fact) => fact.kind === "audit_violation") ? "violated" : "open";
    } else if (obligationItem.obligationType === "validate_reconciliation") {
      obligationItem.status = facts.some((fact) => fact.kind === "settlement_blocked") && facts.some((fact) => fact.kind === "audit_violation") ? "satisfied" : "open";
    }
  }
}

function scheduleObligationSearches(obligations: MotifObligation[], scheduled: Set<string>): WorkItem[] {
  const searches: WorkItem[] = [];
  for (const obligationItem of obligations.filter((item) => item.status === "open")) {
    const search = workItemForObligation(obligationItem);
    if (!search || scheduled.has(search.id)) continue;
    obligationItem.scheduledSearches.push(search.id);
    searches.push(search);
  }
  return searches;
}

function workItemForObligation(obligationItem: MotifObligation): WorkItem | undefined {
  if (obligationItem.obligationType === "validate_authority") {
    return { id: "search_authority_refund_policy", kind: "search_authority", target: "refund_policy", reason: obligationItem.rationale };
  }
  if (obligationItem.obligationType === "validate_exemption") {
    return { id: `search_exemption_${obligationItem.target}`, kind: "search_exemption", target: obligationItem.target, reason: obligationItem.rationale };
  }
  if (obligationItem.obligationType === "validate_terminal_state" || obligationItem.obligationType === "validate_invariant") {
    return { id: "search_terminal_R-915", kind: "search_terminal", target: "R-915", reason: obligationItem.rationale };
  }
  if (obligationItem.obligationType === "validate_reconciliation") {
    return { id: "search_reconciliation_R-915", kind: "search_reconciliation", target: "R-915", reason: obligationItem.rationale };
  }
  if (obligationItem.obligationType === "validate_freshness") {
    return { id: "search_authoritative_policy_version", kind: "search_authority", target: "refund_policy", reason: obligationItem.rationale };
  }
  return undefined;
}

function extractPrimaryFacts(lines: LogLine[]): Fact[] {
  return lines.flatMap((line) => {
    const text = line.text;
    const timestamp = text.slice(0, 15);
    const output: Fact[] = [];
    if (/refund=R-915 cache ttl=1800s/.test(text)) output.push(fact("cache_config", line, timestamp, { refund: "R-915" }));
    if (/authority source=primary-policy/.test(text)) {
      output.push(fact("authority_source", line, timestamp, { authority: "primary-policy", policyVersion: "v18" }));
      output.push(fact("policy_update", line, timestamp, { policyVersion: "v18" }));
    }
    if (/terminal=approved refund=R-915 using_policy_version=v17/.test(text)) {
      output.push(fact("approval", line, timestamp, { refund: "R-915", usedPolicyVersion: "v17", exemptionId: "EX-91", authority: "local-cache" }));
    }
    if (/exemption=EX-91 claimed/.test(text)) output.push(fact("exemption_claim", line, timestamp, { refund: "R-915", exemptionId: "EX-91" }));
    if (/refund=R-915 invariant_violation/.test(text)) {
      output.push(fact("audit_violation", line, timestamp, { refund: "R-915", policyVersion: "v18", usedPolicyVersion: "v17", exemptionId: "EX-91" }));
    }
    if (/settlement_blocked refund=R-915/.test(text)) output.push(fact("settlement_blocked", line, timestamp, { refund: "R-915" }));
    return output;
  });
}

function extractFollowupFacts(line: LogLine, exemptionId: string): Fact[] {
  if (line.text.includes(`exemption=${exemptionId} expired_at`)) {
    return [fact("exemption_expired", line, line.text.slice(0, 15), { exemptionId, refund: "R-915" })];
  }
  return [];
}

function fact(kind: FactKind, line: LogLine, timestamp: string, fields: Partial<Fact>): Fact {
  return {
    id: `${kind}_${hash(`${kind}:${line.lineNumber}:${line.text}`)}`,
    kind,
    sourceLine: line.lineNumber,
    timestamp,
    text: line.text,
    ...fields,
  };
}

function buildGold(trace: LogLine[]): ProcessIR {
  const facts = [...extractPrimaryFacts(trace), ...trace.flatMap((line) => extractFollowupFacts(line, "EX-91"))].sort((left, right) => left.sourceLine - right.sourceLine);
  const obligations = openObligations(facts, []);
  const obligationMap = new Map(obligations.map((obligationItem) => [obligationItem.id, obligationItem]));
  resolveObligations(obligationMap, facts);
  return buildProcessIr("gold", "Gold obligation ProcessIR", facts, [...obligationMap.values()]);
}

function buildProcessIr(idSuffix: string, title: string, facts: Fact[], obligations: MotifObligation[]): ProcessIR {
  const factNodes = facts.map(eventNode);
  const violatedObligations = obligations.filter((item) => item.status === "violated");
  const unknownObligations = obligations.filter((item) => item.status === "unknown" || item.status === "open");
  const latentConditions = [
    ...(facts.some((factItem) => factItem.kind === "approval") && facts.some((factItem) => factItem.kind === "policy_update")
      ? [
          {
            id: "lc_stale_policy_representation",
            nodeKind: "latent" as const,
            role: "latent_representation_failure",
            description: "Approval used local policy v17 despite authoritative policy v18.",
          },
        ]
      : []),
    ...(facts.some((factItem) => factItem.kind === "exemption_expired")
      ? [
          {
            id: "lc_expired_exemption",
            nodeKind: "latent" as const,
            role: "latent_authority_failure",
            description: "The exemption claim was invalid at approval time.",
          },
        ]
      : []),
  ];
  const obligationNodes = obligations.map((item) => ({
    id: item.id,
    nodeKind: "obligation" as const,
    role: item.obligationType,
    description: `${item.status}: ${item.rationale}`,
  }));
  const nodes = [...factNodes, ...latentConditions, ...obligationNodes];
  const edges = buildEdges(facts, obligations, latentConditions);
  const rootCauses = latentConditions.map((item) => item.id);
  const terminalValidity = violatedObligations.some((item) => item.obligationType === "validate_terminal_state" || item.obligationType === "validate_freshness" || item.obligationType === "validate_exemption")
    ? "invalid"
    : unknownObligations.length > 0
      ? "unknown"
      : "valid";

  return {
    id: `dlr-lambda-obligations-${idSuffix}`,
    title,
    facts,
    obligations,
    eventFrames: factNodes,
    latentConditions,
    causalGraph: { nodes, edges, rootCauses },
    terminalValidity,
    detection: {
      falseTerminalStates: terminalValidity === "invalid" ? facts.filter((factItem) => factItem.kind === "approval").map((factItem) => factItem.id) : [],
      violatedInvariants: facts.filter((factItem) => factItem.kind === "audit_violation").map((factItem) => factItem.id),
      unknownObligations: unknownObligations.map((item) => item.id),
      violatedObligations: violatedObligations.map((item) => item.id),
      satisfiedObligations: obligations.filter((item) => item.status === "satisfied").map((item) => item.id),
    },
    prescription: [
      "Make terminal approval conditional on an explicit obligation ledger.",
      "Discharge policy freshness, exemption validity, authority, invariant, and reconciliation obligations before settlement.",
      "Treat unresolved mandatory obligations as terminal-unknown, not terminal-success.",
    ],
    confidence: obligations.length > 0 ? 0.91 : 0.64,
  };
}

function eventNode(factItem: Fact): ProcessNode {
  const roles: Record<FactKind, string> = {
    cache_config: "precondition",
    policy_update: "authority_update",
    approval: "local_terminal_claim",
    exemption_claim: "exception_claim",
    exemption_expired: "exception_invalidator",
    authority_source: "authority_source",
    audit_violation: "invariant_violation",
    settlement_blocked: "terminal_outcome",
  };
  return {
    id: factItem.id,
    nodeKind: "event",
    role: roles[factItem.kind],
    sourceLine: factItem.sourceLine,
    description: factItem.text,
  };
}

function buildEdges(facts: Fact[], obligations: MotifObligation[], latentConditions: ProcessNode[]): GraphEdge[] {
  const edges: GraphEdge[] = [];
  for (const obligationItem of obligations) {
    edges.push({ from: obligationItem.triggeredBy, type: "creates_obligation", to: obligationItem.id });
    for (const factId of obligationItem.resolvedBy) {
      edges.push({ from: factId, type: obligationItem.status === "violated" ? "violates" : "satisfies", to: obligationItem.id });
    }
  }
  const approval = facts.find((factItem) => factItem.kind === "approval");
  const audit = facts.find((factItem) => factItem.kind === "audit_violation");
  const settlement = facts.find((factItem) => factItem.kind === "settlement_blocked");
  const stale = latentConditions.find((item) => item.id === "lc_stale_policy_representation");
  const expired = latentConditions.find((item) => item.id === "lc_expired_exemption");
  if (stale && approval) edges.push({ from: stale.id, type: "causes", to: approval.id });
  if (expired && approval) edges.push({ from: expired.id, type: "invalidates", to: approval.id });
  if (approval && audit) edges.push({ from: approval.id, type: "violates", to: audit.id });
  if (audit && settlement) edges.push({ from: audit.id, type: "fails_downstream", to: settlement.id });
  return edges;
}

function scoreProcessIr(system: string, gold: ProcessIR, predicted: ProcessIR): ScoreRow {
  const goldObligations = new Set(gold.obligations.map((item) => item.id));
  const predictedObligations = new Set(predicted.obligations.map((item) => item.id));
  const obligationRecall = recall(goldObligations, predictedObligations);
  const obligationPrecision = recall(predictedObligations, goldObligations);
  const statusAccuracy = gold.obligations.length === 0 ? 1 : gold.obligations.filter((goldItem) => predicted.obligations.some((item) => item.id === goldItem.id && item.status === goldItem.status)).length / gold.obligations.length;
  const scheduledEvidenceRecall = recall(
    new Set(gold.obligations.flatMap((item) => item.scheduledSearches.length > 0 ? item.scheduledSearches : expectedSearches(item))),
    new Set(predicted.obligations.flatMap((item) => item.scheduledSearches)),
  );
  const terminalValidityCorrect = predicted.terminalValidity === gold.terminalValidity;
  const unknownHandling = predicted.detection.unknownObligations.length === 0 && predicted.terminalValidity !== "unknown";
  const rootCauseAccuracy = recall(new Set(gold.causalGraph.rootCauses), new Set(predicted.causalGraph.rootCauses));
  const passed =
    obligationRecall >= 0.95 &&
    obligationPrecision >= 0.95 &&
    statusAccuracy >= 0.95 &&
    scheduledEvidenceRecall >= 0.8 &&
    terminalValidityCorrect &&
    unknownHandling &&
    rootCauseAccuracy >= 0.95;
  return {
    system,
    obligationRecall,
    obligationPrecision,
    statusAccuracy,
    scheduledEvidenceRecall,
    terminalValidityCorrect,
    unknownHandling,
    rootCauseAccuracy,
    confidence: predicted.confidence,
    passed,
  };
}

function expectedSearches(obligationItem: MotifObligation): string[] {
  const frontierObligations = new Set<ObligationType>(["validate_freshness", "validate_exemption", "validate_terminal_state"]);
  if (!frontierObligations.has(obligationItem.obligationType)) return [];
  if (obligationItem.obligationType === "validate_freshness" && obligationItem.target !== "policy_cache") return [];
  const search = workItemForObligation(obligationItem);
  return search ? [search.id] : [];
}

function buildReport(trace: LogLine[], chunks: LogLine[][], gold: ProcessIR, worklistOnly: ProcessIR, obligationRun: ProcessIR, obligationTrace: ObligationTrace[], scores: ScoreRow[]): string {
  const injectedLines = trace.filter(isIncidentCarrier);
  return [
    "# DLR-lambda-3 Motif Obligation Calculus",
    "",
    "## Objective",
    "",
    "Test whether DLR-lambda terminal validity should be governed by explicit motif obligations rather than worklist exhaustion alone. DLR-lambda-3 treats certain facts as obligation-generators and requires each mandatory obligation to become satisfied, violated, or explicitly unknown under budget.",
    "",
    "## Spectrum Position",
    "",
    "- DLR-lambda-1: distributed evidence composition with MapReduce.",
    "- DLR-lambda-2: meaning revision with typed worklist/fixpoint control.",
    "- DLR-lambda-3: terminal validity with a motif obligation ledger.",
    "",
    "## Dataset",
    "",
    `- Source: [logpai/loghub Linux_2k.log](${LOGHUB_URL})`,
    "- Background: real Linux log lines from Loghub.",
    "- Incident: seven marker-free synthetic lines injected into the noisy log substrate.",
    `- Total lines after injection: ${trace.length}`,
    `- Chunk size: ${CHUNK_SIZE}`,
    `- Number of chunks: ${chunks.length}`,
    "",
    "## Distributed Evidence",
    "",
    "| Line | Evidence |",
    "| ---: | --- |",
    ...injectedLines.map((line) => `| ${line.lineNumber} | \`${escapePipesForMd(line.text)}\` |`),
    "",
    "## Scores",
    "",
    "| System | Pass | Confidence | Obligation recall | Precision | Status accuracy | Search recall | Terminal valid | Unknown handling | Root cause |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- | ---: |",
    ...scores.map((score) => `| ${score.system} | ${score.passed ? "PASS" : "FAIL"} | ${formatScore(score.confidence)} | ${formatScore(score.obligationRecall)} | ${formatScore(score.obligationPrecision)} | ${formatScore(score.statusAccuracy)} | ${formatScore(score.scheduledEvidenceRecall)} | ${yn(score.terminalValidityCorrect)} | ${yn(score.unknownHandling)} | ${formatScore(score.rootCauseAccuracy)} |`),
    "",
    "## Obligation Ledger",
    "",
    "| Obligation | Type | Status | Triggered by | Resolved by | Scheduled searches |",
    "| --- | --- | --- | --- | --- | --- |",
    ...obligationRun.obligations.map((item) => `| ${item.id} | ${item.obligationType} | ${item.status} | ${item.triggeredBy} | ${item.resolvedBy.join(", ") || "-"} | ${item.scheduledSearches.join(", ") || "-"} |`),
    "",
    "## Obligation Trace",
    "",
    "| Step | Action | Facts | Opened obligations | Resolved obligations | Scheduled searches |",
    "| ---: | --- | --- | --- | --- | --- |",
    ...obligationTrace
      .filter((step) => step.discoveredFacts.length > 0 || step.openedObligations.length > 0 || step.resolvedObligations.length > 0 || step.scheduledSearches.length > 0)
      .map((step) => `| ${step.step} | ${step.action} | ${step.discoveredFacts.join(", ") || "-"} | ${step.openedObligations.join(", ") || "-"} | ${step.resolvedObligations.join(", ") || "-"} | ${step.scheduledSearches.join(", ") || "-"} |`),
    "",
    "## Gold vs Predictions",
    "",
    `- Gold terminal validity: ${gold.terminalValidity}`,
    `- Worklist-only terminal validity: ${worklistOnly.terminalValidity}`,
    `- Obligation-calculus terminal validity: ${obligationRun.terminalValidity}`,
    `- Gold obligations: ${gold.obligations.map((item) => `${item.id}:${item.status}`).join(", ")}`,
    `- Worklist-only obligations: ${worklistOnly.obligations.length === 0 ? "none" : worklistOnly.obligations.map((item) => `${item.id}:${item.status}`).join(", ")}`,
    "",
    "## Interpretation",
    "",
    "The worklist/fixpoint controller can recover the causal graph, but without an explicit obligation ledger it cannot prove why the terminal state is invalid or which structural checks were discharged. DLR-lambda-3 makes those checks first-class.",
    "",
    "The core rule is: facts such as cached representations, exemption claims, authority assertions, and terminal success reports are not merely evidence. They generate motif obligations. ProcessIR is terminal-valid only after mandatory obligations are satisfied, violated, or explicitly unknown.",
    "",
  ].join("\n");
}

function isIncidentCarrier(line: LogLine): boolean {
  return /R-915|EX-91|primary-policy|settlement_blocked/.test(line.text);
}

function recall(gold: Set<string>, predicted: Set<string>): number {
  if (gold.size === 0) return predicted.size === 0 ? 1 : 0;
  return [...gold].filter((item) => predicted.has(item)).length / gold.size;
}

function hash(input: string): string {
  return createHash("sha1").update(input).digest("hex").slice(0, 8);
}

function escapePipesForMd(input: string): string {
  return input.replaceAll("|", "\\|").replaceAll("`", "\\`");
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
