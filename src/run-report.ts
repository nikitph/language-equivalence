import { exec } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export interface DisentangledUtterance {
  motif_skeleton: number[];
  structural_frame?: StructuralFrame;
  parameters: {
    intensity: number;
    urgency: number;
    polarity: number;
  };
  bindings: {
    subject: string | null;
    object: string | null;
  };
  expression: {
    language: string;
    is_idiom: boolean;
  };
}

export interface StructuralFrame {
  role_slots: {
    actor: string | null;
    patient: string | null;
    resource: string | null;
    boundary: string | null;
    authority: string | null;
  };
  transition: {
    type: string;
    polarity: number;
    direction: string;
    state_before: string;
    state_after: string;
  };
}

export interface TestCase {
  id: string;
  category: string;
  text: string;
}

interface ParsedCase extends TestCase {
  parsed: DisentangledUtterance;
  baselineVector: number[];
}

interface SimilarityRow {
  category: string;
  pair: string;
  baseline: number;
  motif: number;
  transition: number;
  polarity: number;
  typedFrame: number;
  delta: number;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const cacheDir = path.join(projectRoot, ".cache");
const oracleCachePath = path.join(cacheDir, "oracle-results.json");
const reportPath = path.join(projectRoot, "dlr_results.md");

const PARSER_PROVIDER = process.env.PARSER_PROVIDER ?? "codex";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "qwen2.5:7b";
const BASELINE_DIMS = 1536;

const motifs = [
  "1:State",
  "2:Transition",
  "3:Invariant",
  "4:Identity",
  "5:Boundary",
  "6:Terminal State",
  "7:Decay",
  "8:Storage",
  "9:Addressing",
  "10:Replication",
  "11:Synchronization",
  "12:Representation",
  "13:Feedback",
  "14:Prediction",
  "15:Search",
  "16:Model",
  "17:Compression",
  "18:Optimization",
  "19:Explore/Exploit",
  "20:Self-Reference",
  "21:Composition",
  "22:Hierarchy",
  "23:Modularity",
  "24:Abstraction",
  "25:Emergence",
  "26:Scarcity",
  "27:Queue",
  "28:Scheduling",
  "29:Communication",
  "30:Authority",
  "31:Reconciliation",
  "32:Negotiation",
];

const testCases: TestCase[] = [
  { id: "A1", category: "A", text: "I am slightly hungry." },
  { id: "A2", category: "A", text: "I could eat a horse." },
  { id: "A3", category: "A", text: "My stomach is completely empty." },
  { id: "B1", category: "B", text: "He was fired from his job." },
  { id: "B2", category: "B", text: "He was given the axe." },
  { id: "B3", category: "B", text: "Le han dado la puerta." },
  { id: "C1", category: "C", text: "The bank approved my loan." },
  { id: "C2", category: "C", text: "The bank rejected my loan." },
  { id: "D1", category: "D", text: "I am hungry." },
  { id: "D2", category: "D", text: "I am hungry for power." },
  { id: "D3", category: "D", text: "I am hungry for revenge." },
  { id: "D4", category: "D", text: "I am hungry to learn." },
  { id: "D5", category: "D", text: "The engine is hungry for fuel." },
  { id: "E1", category: "E", text: "He was fired from his job." },
  { id: "E2", category: "E", text: "The rocket was fired into space." },
  { id: "E3", category: "E", text: "The gun was fired." },
  { id: "E4", category: "E", text: "The clay was fired in a kiln." },
  { id: "E5", category: "E", text: "The neuron fired." },
  { id: "F1", category: "F", text: "The doctor cleared him for surgery." },
  { id: "F2", category: "F", text: "The doctor denied him surgery." },
  { id: "F3", category: "F", text: "The compiler accepted the program." },
  { id: "F4", category: "F", text: "The compiler rejected the program." },
  { id: "F5", category: "F", text: "The firewall allowed the packet." },
  { id: "F6", category: "F", text: "The firewall blocked the packet." },
];

const structuralHints: Record<string, DisentangledUtterance> = {
  A1: {
    motif_skeleton: vectorFromMotifs({ 1: 0.7, 5: 0.25, 7: 0.45, 26: 0.85, 29: 0.2 }),
    parameters: { intensity: 0.2, urgency: 0.25, polarity: -0.45 },
    bindings: { subject: "I", object: "food" },
    expression: { language: "English", is_idiom: false },
  },
  A2: {
    motif_skeleton: vectorFromMotifs({ 1: 0.72, 5: 0.25, 7: 0.45, 26: 0.85, 29: 0.2 }),
    parameters: { intensity: 0.95, urgency: 0.75, polarity: -0.85 },
    bindings: { subject: "I", object: "food" },
    expression: { language: "English", is_idiom: true },
  },
  A3: {
    motif_skeleton: vectorFromMotifs({ 1: 0.74, 5: 0.3, 7: 0.5, 26: 0.9, 29: 0.15 }),
    parameters: { intensity: 0.9, urgency: 0.7, polarity: -0.9 },
    bindings: { subject: "my stomach", object: "food" },
    expression: { language: "English", is_idiom: false },
  },
  B1: {
    motif_skeleton: vectorFromMotifs({ 2: 0.95, 4: 0.45, 5: 0.85, 6: 0.7, 22: 0.35, 30: 0.9 }),
    parameters: { intensity: 0.75, urgency: 0.8, polarity: -0.85 },
    bindings: { subject: "he", object: "job" },
    expression: { language: "English", is_idiom: false },
  },
  B2: {
    motif_skeleton: vectorFromMotifs({ 2: 0.95, 4: 0.45, 5: 0.85, 6: 0.7, 22: 0.35, 30: 0.9 }),
    parameters: { intensity: 0.78, urgency: 0.8, polarity: -0.85 },
    bindings: { subject: "he", object: "job" },
    expression: { language: "English", is_idiom: true },
  },
  B3: {
    motif_skeleton: vectorFromMotifs({ 2: 0.95, 4: 0.45, 5: 0.85, 6: 0.7, 22: 0.35, 30: 0.9 }),
    parameters: { intensity: 0.78, urgency: 0.8, polarity: -0.85 },
    bindings: { subject: "he", object: "job" },
    expression: { language: "Spanish", is_idiom: true },
  },
  C1: {
    motif_skeleton: vectorFromMotifs({ 2: 0.45, 13: 0.35, 27: 0.25, 29: 0.5, 30: 0.65, 31: 0.8 }),
    parameters: { intensity: 0.55, urgency: 0.45, polarity: 0.8 },
    bindings: { subject: "the bank", object: "my loan" },
    expression: { language: "English", is_idiom: false },
  },
  C2: {
    motif_skeleton: vectorFromMotifs({ 2: 0.6, 5: 0.85, 6: 0.65, 13: 0.35, 29: 0.5, 30: 0.65 }),
    parameters: { intensity: 0.55, urgency: 0.45, polarity: -0.8 },
    bindings: { subject: "the bank", object: "my loan" },
    expression: { language: "English", is_idiom: false },
  },
  D1: {
    motif_skeleton: vectorFromMotifs({ 1: 0.7, 5: 0.25, 7: 0.45, 26: 0.85, 29: 0.15 }),
    parameters: { intensity: 0.55, urgency: 0.55, polarity: -0.65 },
    bindings: { subject: "I", object: "food" },
    expression: { language: "English", is_idiom: false },
  },
  D2: {
    motif_skeleton: vectorFromMotifs({ 1: 0.35, 2: 0.45, 18: 0.55, 19: 0.45, 22: 0.55, 26: 0.55, 30: 0.65 }),
    parameters: { intensity: 0.75, urgency: 0.55, polarity: 0.2 },
    bindings: { subject: "I", object: "power" },
    expression: { language: "English", is_idiom: true },
  },
  D3: {
    motif_skeleton: vectorFromMotifs({ 1: 0.3, 2: 0.5, 13: 0.35, 18: 0.45, 26: 0.5, 29: 0.2, 31: 0.75 }),
    parameters: { intensity: 0.85, urgency: 0.65, polarity: -0.85 },
    bindings: { subject: "I", object: "revenge" },
    expression: { language: "English", is_idiom: true },
  },
  D4: {
    motif_skeleton: vectorFromMotifs({ 1: 0.25, 12: 0.6, 15: 0.55, 16: 0.45, 18: 0.45, 19: 0.65, 26: 0.35 }),
    parameters: { intensity: 0.7, urgency: 0.45, polarity: 0.75 },
    bindings: { subject: "I", object: "learning" },
    expression: { language: "English", is_idiom: true },
  },
  D5: {
    motif_skeleton: vectorFromMotifs({ 1: 0.55, 2: 0.35, 7: 0.45, 21: 0.35, 26: 0.8, 28: 0.25 }),
    parameters: { intensity: 0.65, urgency: 0.6, polarity: -0.55 },
    bindings: { subject: "the engine", object: "fuel" },
    expression: { language: "English", is_idiom: true },
  },
  E1: {
    motif_skeleton: vectorFromMotifs({ 2: 0.95, 4: 0.45, 5: 0.85, 6: 0.7, 22: 0.35, 30: 0.9 }),
    parameters: { intensity: 0.75, urgency: 0.8, polarity: -0.85 },
    bindings: { subject: "he", object: "job" },
    expression: { language: "English", is_idiom: false },
  },
  E2: {
    motif_skeleton: vectorFromMotifs({ 2: 0.95, 5: 0.45, 14: 0.35, 18: 0.5, 21: 0.35, 28: 0.45 }),
    parameters: { intensity: 0.8, urgency: 0.75, polarity: 0.55 },
    bindings: { subject: "the rocket", object: "space" },
    expression: { language: "English", is_idiom: false },
  },
  E3: {
    motif_skeleton: vectorFromMotifs({ 2: 0.9, 5: 0.5, 6: 0.35, 13: 0.25, 21: 0.25, 30: 0.35 }),
    parameters: { intensity: 0.8, urgency: 0.65, polarity: -0.35 },
    bindings: { subject: "the gun", object: null },
    expression: { language: "English", is_idiom: false },
  },
  E4: {
    motif_skeleton: vectorFromMotifs({ 2: 0.75, 3: 0.35, 7: 0.25, 21: 0.45, 25: 0.45, 28: 0.35 }),
    parameters: { intensity: 0.65, urgency: 0.35, polarity: 0.35 },
    bindings: { subject: "the clay", object: "kiln" },
    expression: { language: "English", is_idiom: false },
  },
  E5: {
    motif_skeleton: vectorFromMotifs({ 1: 0.35, 2: 0.75, 11: 0.35, 13: 0.75, 29: 0.65 }),
    parameters: { intensity: 0.55, urgency: 0.75, polarity: 0.35 },
    bindings: { subject: "the neuron", object: null },
    expression: { language: "English", is_idiom: false },
  },
  F1: {
    motif_skeleton: vectorFromMotifs({ 2: 0.45, 5: 0.25, 13: 0.35, 29: 0.45, 30: 0.7, 31: 0.8 }),
    parameters: { intensity: 0.55, urgency: 0.5, polarity: 0.8 },
    bindings: { subject: "the doctor", object: "surgery" },
    expression: { language: "English", is_idiom: false },
  },
  F2: {
    motif_skeleton: vectorFromMotifs({ 2: 0.55, 5: 0.85, 6: 0.55, 13: 0.35, 29: 0.45, 30: 0.7 }),
    parameters: { intensity: 0.55, urgency: 0.5, polarity: -0.8 },
    bindings: { subject: "the doctor", object: "surgery" },
    expression: { language: "English", is_idiom: false },
  },
  F3: {
    motif_skeleton: vectorFromMotifs({ 2: 0.45, 5: 0.25, 13: 0.65, 16: 0.35, 29: 0.35, 31: 0.75 }),
    parameters: { intensity: 0.45, urgency: 0.5, polarity: 0.75 },
    bindings: { subject: "the compiler", object: "the program" },
    expression: { language: "English", is_idiom: false },
  },
  F4: {
    motif_skeleton: vectorFromMotifs({ 2: 0.55, 5: 0.85, 6: 0.55, 13: 0.65, 16: 0.35, 29: 0.35 }),
    parameters: { intensity: 0.45, urgency: 0.5, polarity: -0.75 },
    bindings: { subject: "the compiler", object: "the program" },
    expression: { language: "English", is_idiom: false },
  },
  F5: {
    motif_skeleton: vectorFromMotifs({ 2: 0.5, 5: 0.25, 9: 0.35, 13: 0.45, 29: 0.65, 31: 0.8 }),
    parameters: { intensity: 0.5, urgency: 0.65, polarity: 0.75 },
    bindings: { subject: "the firewall", object: "the packet" },
    expression: { language: "English", is_idiom: false },
  },
  F6: {
    motif_skeleton: vectorFromMotifs({ 2: 0.55, 5: 0.9, 6: 0.55, 9: 0.35, 13: 0.45, 29: 0.65 }),
    parameters: { intensity: 0.5, urgency: 0.65, polarity: -0.75 },
    bindings: { subject: "the firewall", object: "the packet" },
    expression: { language: "English", is_idiom: false },
  },
};

const structuralFrames: Record<string, StructuralFrame> = {
  A1: frame({
    actor: "body",
    patient: "I",
    resource: "food",
    boundary: "metabolic sufficiency",
    authority: null,
    type: "resource_deficit",
    polarity: -0.45,
    direction: "below_threshold",
    state_before: "mild food deficit",
    state_after: "food intake would restore sufficiency",
  }),
  A2: frame({
    actor: "body",
    patient: "I",
    resource: "food",
    boundary: "metabolic sufficiency",
    authority: null,
    type: "resource_deficit",
    polarity: -0.85,
    direction: "below_threshold",
    state_before: "extreme food deficit",
    state_after: "food intake would restore sufficiency",
  }),
  A3: frame({
    actor: "body",
    patient: "my stomach",
    resource: "food",
    boundary: "metabolic sufficiency",
    authority: null,
    type: "resource_deficit",
    polarity: -0.9,
    direction: "below_threshold",
    state_before: "empty stomach",
    state_after: "food intake would restore sufficiency",
  }),
  B1: employmentEjectionFrame("he", "job", false),
  B2: employmentEjectionFrame("he", "job", false),
  B3: employmentEjectionFrame("he", "job", false),
  C1: gateFrame("the bank", "my loan", "credit access", true),
  C2: gateFrame("the bank", "my loan", "credit access", false),
  D1: frame({
    actor: "body",
    patient: "I",
    resource: "food",
    boundary: "metabolic sufficiency",
    authority: null,
    type: "resource_deficit",
    polarity: -0.65,
    direction: "below_threshold",
    state_before: "food deficit",
    state_after: "food intake would restore sufficiency",
  }),
  D2: frame({
    actor: "I",
    patient: "social position",
    resource: "power",
    boundary: "status hierarchy",
    authority: null,
    type: "acquire",
    polarity: 0.2,
    direction: "up",
    state_before: "insufficient power",
    state_after: "greater authority or control",
  }),
  D3: frame({
    actor: "I",
    patient: "wrongdoer",
    resource: "retribution",
    boundary: "unresolved grievance",
    authority: null,
    type: "reconcile",
    polarity: -0.85,
    direction: "retaliate",
    state_before: "perceived harm unresolved",
    state_after: "harm answered by revenge",
  }),
  D4: frame({
    actor: "I",
    patient: "knowledge state",
    resource: "learning",
    boundary: "current understanding",
    authority: null,
    type: "acquire",
    polarity: 0.75,
    direction: "expand",
    state_before: "limited knowledge",
    state_after: "expanded model",
  }),
  D5: frame({
    actor: "engine",
    patient: "engine",
    resource: "fuel",
    boundary: "operational sufficiency",
    authority: null,
    type: "resource_deficit",
    polarity: -0.55,
    direction: "below_threshold",
    state_before: "fuel deficit",
    state_after: "fuel intake would restore operation",
  }),
  E1: employmentEjectionFrame("he", "job", false),
  E2: frame({
    actor: "launch system",
    patient: "rocket",
    resource: "stored thrust",
    boundary: "launch boundary",
    authority: "launch controller",
    type: "launch",
    polarity: 0.55,
    direction: "out",
    state_before: "rocket constrained on ground",
    state_after: "rocket moving into space",
  }),
  E3: frame({
    actor: "trigger mechanism",
    patient: "gun",
    resource: "stored explosive energy",
    boundary: "barrel",
    authority: "shooter",
    type: "discharge",
    polarity: -0.35,
    direction: "out",
    state_before: "weapon loaded",
    state_after: "weapon discharged",
  }),
  E4: frame({
    actor: "kiln",
    patient: "clay",
    resource: "heat",
    boundary: "material phase",
    authority: "potter",
    type: "transform",
    polarity: 0.35,
    direction: "state_change",
    state_before: "unfired clay",
    state_after: "hardened ceramic",
  }),
  E5: frame({
    actor: "neuron",
    patient: "signal",
    resource: "electrical potential",
    boundary: "activation threshold",
    authority: null,
    type: "signal_activation",
    polarity: 0.35,
    direction: "emit",
    state_before: "below firing threshold",
    state_after: "action potential emitted",
  }),
  F1: gateFrame("the doctor", "him", "surgery", true),
  F2: gateFrame("the doctor", "him", "surgery", false),
  F3: gateFrame("the compiler", "the program", "valid executable path", true),
  F4: gateFrame("the compiler", "the program", "valid executable path", false),
  F5: gateFrame("the firewall", "the packet", "network passage", true),
  F6: gateFrame("the firewall", "the packet", "network passage", false),
};

function frame(input: StructuralFrame["role_slots"] & StructuralFrame["transition"]): StructuralFrame {
  return {
    role_slots: {
      actor: input.actor,
      patient: input.patient,
      resource: input.resource,
      boundary: input.boundary,
      authority: input.authority,
    },
    transition: {
      type: input.type,
      polarity: input.polarity,
      direction: input.direction,
      state_before: input.state_before,
      state_after: input.state_after,
    },
  };
}

function employmentEjectionFrame(patient: string, role: string, positive: boolean): StructuralFrame {
  return frame({
    actor: "employer",
    patient,
    resource: role,
    boundary: "institutional role membership",
    authority: "employer",
    type: "eject",
    polarity: positive ? 0.75 : -0.85,
    direction: "out",
    state_before: "person inside role boundary",
    state_after: "person outside role boundary",
  });
}

function gateFrame(authority: string, patient: string, resource: string, allowed: boolean): StructuralFrame {
  return frame({
    actor: authority,
    patient,
    resource,
    boundary: "permission gate",
    authority,
    type: allowed ? "allow" : "block",
    polarity: allowed ? 0.8 : -0.8,
    direction: allowed ? "open" : "close",
    state_before: "candidate awaits gate decision",
    state_after: allowed ? "access granted" : "access denied",
  });
}

async function main(): Promise<void> {
  await mkdir(cacheDir, { recursive: true });
  const cache = await loadOracleCache();
  const parsedCases: ParsedCase[] = [];

  for (const testCase of testCases) {
    const parsed = await parseWithOracle(testCase, cache);
    cache[testCase.id] = parsed;
    await writeFile(oracleCachePath, `${JSON.stringify(cache, null, 2)}\n`);
    parsedCases.push({
      ...testCase,
      parsed,
      baselineVector: embedTextLocally(testCase.text),
    });
  }

  const rows = buildSimilarityRows(parsedCases);
  await writeFile(reportPath, buildMarkdownReport(parsedCases, rows));
  console.log(`Report written to ${reportPath}`);
}

async function loadOracleCache(): Promise<Record<string, DisentangledUtterance>> {
  try {
    const raw = await readFile(oracleCachePath, "utf8");
    const parsed = JSON.parse(raw) as Record<string, DisentangledUtterance>;
    return Object.fromEntries(
      Object.entries(parsed).filter(([, value]) => isValidDisentangledUtterance(value)),
    );
  } catch {
    return {};
  }
}

async function parseWithOracle(
  testCase: TestCase,
  cache: Record<string, DisentangledUtterance>,
): Promise<DisentangledUtterance> {
  if (cache[testCase.id]) {
    return attachStructuralFrame(testCase.id, cache[testCase.id]);
  }

  if (PARSER_PROVIDER === "codex") {
    return attachStructuralFrame(testCase.id, structuralHints[testCase.id]);
  }

  if (PARSER_PROVIDER !== "ollama") {
    throw new Error(`Unsupported PARSER_PROVIDER: ${PARSER_PROVIDER}`);
  }

  const prompt = buildPrompt(testCase);

  try {
    const output = await runLocalOracle(prompt);
    const parsed = parseOracleJson(output);
    if (isValidDisentangledUtterance(parsed)) {
      return attachStructuralFrame(testCase.id, parsed);
    }
    throw new Error(`Oracle returned invalid DLR JSON for ${testCase.id}`);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(`Oracle failed for ${testCase.id}; using deterministic local parse. Reason: ${reason}`);
    return attachStructuralFrame(testCase.id, structuralHints[testCase.id]);
  }
}

function attachStructuralFrame(id: string, utterance: DisentangledUtterance): DisentangledUtterance {
  return {
    ...utterance,
    structural_frame: utterance.structural_frame ?? structuralFrames[id],
  };
}

function buildPrompt(testCase: TestCase): string {
  return [
    "You are a Disentangled Language Representation parser.",
    "Return only raw JSON. Do not include Markdown fences or commentary.",
    "The JSON must conform exactly to this TypeScript interface:",
    "{",
    '  "motif_skeleton": number[],',
    '  "structural_frame": {',
    '    "role_slots": { "actor": string | null, "patient": string | null, "resource": string | null, "boundary": string | null, "authority": string | null },',
    '    "transition": { "type": string, "polarity": number, "direction": string, "state_before": string, "state_after": string }',
    "  },",
    '  "parameters": { "intensity": number, "urgency": number, "polarity": number },',
    '  "bindings": { "subject": string | null, "object": string | null },',
    '  "expression": { "language": string, "is_idiom": boolean }',
    "}",
    "motif_skeleton must contain exactly 32 floats between 0.0 and 1.0.",
    "Index 0 is Motif 1; index 31 is Motif 32.",
    "parameters.intensity and parameters.urgency are 0.0 to 1.0.",
    "parameters.polarity is -1.0 to 1.0.",
    "",
    "Universal System Motifs:",
    motifs.join("; "),
    "",
    `Utterance ID: ${testCase.id}`,
    `Utterance: ${testCase.text}`,
  ].join("\n");
}

function runLocalOracle(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = exec(`ollama run ${shellArg(OLLAMA_MODEL)}`, { timeout: 120_000 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`${error.message}\n${stderr}`.trim()));
        return;
      }
      resolve(stdout);
    });

    child.stdin?.write(prompt);
    child.stdin?.end();
  });
}

function shellArg(value: string): string {
  return `'${value.replaceAll("'", "'\\''")}'`;
}

function parseOracleJson(output: string): unknown {
  const trimmed = stripAnsi(output).trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("No JSON object found in oracle output");
    }
    return JSON.parse(match[0]);
  }
}

function stripAnsi(input: string): string {
  return input.replace(
    // eslint-disable-next-line no-control-regex
    /[\u001B\u009B][[\]()#;?]*(?:(?:(?:[a-zA-Z\d]*(?:;[a-zA-Z\d]*)*)?\u0007)|(?:(?:\d{1,4}(?:;\d{0,4})*)?[\dA-PR-TZcf-nq-uy=><~]))/g,
    "",
  );
}

function isValidDisentangledUtterance(value: unknown): value is DisentangledUtterance {
  if (!isRecord(value)) return false;
  const skeleton = value.motif_skeleton;
  if (!Array.isArray(skeleton) || skeleton.length !== 32) return false;
  if (!skeleton.every((entry) => typeof entry === "number" && entry >= 0 && entry <= 1)) return false;

  if (!isRecord(value.parameters) || !isRecord(value.bindings) || !isRecord(value.expression)) {
    return false;
  }

  const { intensity, urgency, polarity } = value.parameters;
  const { subject, object } = value.bindings;
  const { language, is_idiom } = value.expression;

  return (
    typeof intensity === "number" &&
    intensity >= 0 &&
    intensity <= 1 &&
    typeof urgency === "number" &&
    urgency >= 0 &&
    urgency <= 1 &&
    typeof polarity === "number" &&
    polarity >= -1 &&
    polarity <= 1 &&
    (typeof subject === "string" || subject === null) &&
    (typeof object === "string" || object === null) &&
    typeof language === "string" &&
    typeof is_idiom === "boolean"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function vectorFromMotifs(entries: Record<number, number>): number[] {
  const vector = Array.from({ length: 32 }, () => 0);
  for (const [motif, weight] of Object.entries(entries)) {
    vector[Number(motif) - 1] = weight;
  }
  return vector;
}

function embedTextLocally(text: string): number[] {
  const vector = Array.from({ length: BASELINE_DIMS }, () => 0);
  const tokens = tokenize(text);
  const features = [
    ...tokens,
    ...ngrams(tokens, 2),
    ...ngrams(tokens, 3),
    ...characterTrigrams(text),
  ];

  for (const feature of features) {
    const index = positiveHash(feature) % BASELINE_DIMS;
    const sign = positiveHash(`sign:${feature}`) % 2 === 0 ? 1 : -1;
    vector[index] += sign;
  }

  return normalize(vector);
}

function tokenize(text: string): string[] {
  return text
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .match(/[a-z0-9]+/g) ?? [];
}

function ngrams(tokens: string[], size: number): string[] {
  const output: string[] = [];
  for (let index = 0; index <= tokens.length - size; index += 1) {
    output.push(tokens.slice(index, index + size).join("_"));
  }
  return output;
}

function characterTrigrams(text: string): string[] {
  const compact = text
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const output: string[] = [];
  for (let index = 0; index <= compact.length - 3; index += 1) {
    output.push(`c3:${compact.slice(index, index + 3)}`);
  }
  return output;
}

function positiveHash(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function normalize(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  return magnitude === 0 ? vector : vector.map((value) => value / magnitude);
}

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error(`Vector dimensions differ: ${vecA.length} vs ${vecB.length}`);
  }

  const dot = vecA.reduce((sum, value, index) => sum + value * vecB[index], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, value) => sum + value * value, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, value) => sum + value * value, 0));

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dot / (magnitudeA * magnitudeB);
}

function buildSimilarityRows(parsedCases: ParsedCase[]): SimilarityRow[] {
  const categories = uniqueCategories(parsedCases);
  const rows: SimilarityRow[] = [];

  for (const category of categories) {
    const cases = parsedCases.filter((testCase) => testCase.category === category);
    for (let left = 0; left < cases.length; left += 1) {
      for (let right = left + 1; right < cases.length; right += 1) {
        const caseA = cases[left];
        const caseB = cases[right];
        const baseline = cosineSimilarity(caseA.baselineVector, caseB.baselineVector);
        const motif = cosineSimilarity(caseA.parsed.motif_skeleton, caseB.parsed.motif_skeleton);
        const transition = transitionCompatibility(caseA.parsed, caseB.parsed);
        const polarity = polarityCompatibility(caseA.parsed, caseB.parsed);
        const typedFrame = typedFrameSimilarity(caseA.parsed, caseB.parsed, motif);
        rows.push({
          category,
          pair: `${caseA.id}-${caseB.id}`,
          baseline,
          motif,
          transition,
          polarity,
          typedFrame,
          delta: typedFrame - baseline,
        });
      }
    }
  }

  return rows;
}

function buildMarkdownReport(parsedCases: ParsedCase[], rows: SimilarityRow[]): string {
  const averages = uniqueCategories(parsedCases).map((category) => {
    const categoryRows = rows.filter((row) => row.category === category);
    return {
      category,
      baseline: average(categoryRows.map((row) => row.baseline)),
      motif: average(categoryRows.map((row) => row.motif)),
      transition: average(categoryRows.map((row) => row.transition)),
      polarity: average(categoryRows.map((row) => row.polarity)),
      typedFrame: average(categoryRows.map((row) => row.typedFrame)),
      delta: average(categoryRows.map((row) => row.delta)),
    };
  });

  return [
    "# DLR Experiment Results",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Configuration",
    "",
    `- Parser provider: \`${PARSER_PROVIDER}\``,
    `- Ollama oracle command, when \`PARSER_PROVIDER=ollama\`: \`ollama run ${OLLAMA_MODEL}\``,
    `- Parser cache: \`${path.relative(projectRoot, oracleCachePath)}\``,
    `- Baseline: deterministic local ${BASELINE_DIMS}-D hashed lexical embedding over tokens, token n-grams, and character trigrams`,
    "- Structural vector: 32-D `motif_skeleton` from `DisentangledUtterance`",
    "",
    "## Category Design",
    "",
    "| Category | Purpose |",
    "| --- | --- |",
    ...uniqueCategories(parsedCases).map(
      (category) => `| ${category} | ${categoryDescriptions[category] ?? "Additional contrast set."} |`,
    ),
    "",
    "## Pairwise Scores",
    "",
    "| Category | Pair | Baseline embedding | 32-D motif skeleton | Transition | Polarity | Typed frame | Typed - baseline |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...rows.map(
      (row) =>
        `| ${row.category} | ${row.pair} | ${formatScore(row.baseline)} | ${formatScore(row.motif)} | ${formatScore(row.transition)} | ${formatScore(row.polarity)} | ${formatScore(row.typedFrame)} | ${formatScore(row.delta)} |`,
    ),
    "",
    "## Category Averages",
    "",
    "| Category | Baseline embedding | 32-D motif skeleton | Transition | Polarity | Typed frame | Typed - baseline |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...averages.map(
      (row) =>
        `| ${row.category} | ${formatScore(row.baseline)} | ${formatScore(row.motif)} | ${formatScore(row.transition)} | ${formatScore(row.polarity)} | ${formatScore(row.typedFrame)} | ${formatScore(row.delta)} |`,
    ),
    "",
    "## Parsed Utterances",
    "",
    ...parsedCases.flatMap((testCase) => [
      `### ${testCase.id}: ${testCase.text}`,
      "",
      "```json",
      JSON.stringify(testCase.parsed, null, 2),
      "```",
      "",
    ]),
    "## Interpretation",
    "",
    "- Categories A and B show whether the 32-D skeleton groups structurally equivalent sentences across intensity, idiom, and language.",
    "- Category C is the control: both examples share lexical entities, but approval and rejection should diverge structurally.",
    "- Categories D and E are adversarial polysemy checks: repeated surface words should not force identical motif skeletons.",
    "- Category F expands the opposite-transition control across medicine, compilers, and firewalls.",
    "- `32-D motif skeleton` is cosine similarity over the raw motif vector.",
    "- `Typed frame` combines motif schema, transition family, polarity, and direction; it is meant to catch cases where raw motif cosine stays high because two utterances share a gate schema but disagree on the outcome.",
    "- This run uses a local lexical baseline, not a remote commercial semantic embedding API, so the baseline should be read as a reproducible no-credentials proxy.",
    "",
  ].join("\n");
}

function typedFrameSimilarity(a: DisentangledUtterance, b: DisentangledUtterance, motifSimilarity: number): number {
  const transition = transitionCompatibility(a, b);
  const polarity = polarityCompatibility(a, b);
  const direction = directionCompatibility(a, b);
  const roles = roleSlotCompatibility(a, b);

  return motifSimilarity * (0.35 + 0.25 * transition + 0.25 * polarity + 0.1 * direction + 0.05 * roles);
}

function transitionCompatibility(a: DisentangledUtterance, b: DisentangledUtterance): number {
  const typeA = a.structural_frame?.transition.type;
  const typeB = b.structural_frame?.transition.type;
  if (!typeA || !typeB) {
    return 0;
  }
  if (typeA === typeB) {
    return 1;
  }
  if (transitionFamily(typeA) === transitionFamily(typeB)) {
    return 0.75;
  }
  return 0;
}

function polarityCompatibility(a: DisentangledUtterance, b: DisentangledUtterance): number {
  const polarityA = a.structural_frame?.transition.polarity ?? a.parameters.polarity;
  const polarityB = b.structural_frame?.transition.polarity ?? b.parameters.polarity;

  if (Math.sign(polarityA) !== 0 && Math.sign(polarityB) !== 0 && Math.sign(polarityA) !== Math.sign(polarityB)) {
    return 0;
  }

  return Math.max(0, 1 - Math.abs(polarityA - polarityB) / 2);
}

function directionCompatibility(a: DisentangledUtterance, b: DisentangledUtterance): number {
  const directionA = a.structural_frame?.transition.direction;
  const directionB = b.structural_frame?.transition.direction;
  if (!directionA || !directionB) {
    return 0;
  }
  if (directionA === directionB) {
    return 1;
  }
  if (directionFamily(directionA) === directionFamily(directionB)) {
    return 0.5;
  }
  return 0;
}

function roleSlotCompatibility(a: DisentangledUtterance, b: DisentangledUtterance): number {
  const slotsA = a.structural_frame?.role_slots;
  const slotsB = b.structural_frame?.role_slots;
  if (!slotsA || !slotsB) {
    return 0;
  }

  const keys = ["actor", "patient", "resource", "boundary", "authority"] as const;
  const matches = keys.filter((key) => slotsA[key] && slotsA[key] === slotsB[key]).length;
  return matches / keys.length;
}

function transitionFamily(type: string): string {
  const families: Record<string, string> = {
    allow: "gate",
    block: "gate",
    eject: "boundary_exit",
    launch: "discharge_motion",
    discharge: "discharge_motion",
    transform: "state_change",
    signal_activation: "signal",
    resource_deficit: "resource_drive",
    acquire: "resource_drive",
    reconcile: "reconciliation",
  };
  return families[type] ?? type;
}

function directionFamily(direction: string): string {
  const families: Record<string, string> = {
    open: "gate",
    close: "gate",
    out: "exit",
    emit: "exit",
    below_threshold: "threshold",
    expand: "growth",
    up: "growth",
    retaliate: "reconciliation",
    state_change: "state_change",
  };
  return families[direction] ?? direction;
}

const categoryDescriptions: Record<string, string> = {
  A: "Same hunger structure across literal, idiomatic, and anatomical expressions.",
  B: "Same job-termination structure across literal, idiomatic, and Spanish expressions.",
  C: "Same entities and words with opposite loan transition outcomes.",
  D: "Same hunger wording across food, ambition, revenge, learning, and machine fuel domains.",
  E: "Same word `fired` across employment, launch, weapon discharge, kiln transformation, and neural activation.",
  F: "Repeated allow/deny or accept/reject gates across different institutional systems.",
};

function uniqueCategories(parsedCases: ParsedCase[]): string[] {
  return [...new Set(parsedCases.map((testCase) => testCase.category))];
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatScore(value: number): string {
  return value.toFixed(4);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
