import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
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

interface UniProtFeature {
  type: string;
  description?: string;
  location?: {
    start?: { value?: number };
    end?: { value?: number };
  };
}

interface ProteinFeature {
  id: string;
  type: string;
  description: string;
  start: number;
  end: number;
  motifs: Motif[];
  motifRationale: string;
}

interface ResidueCA {
  residue: number;
  x: number;
  y: number;
  z: number;
  plddt: number;
}

interface PocketCandidate {
  id: string;
  source: "uniprot_feature_proxy" | "fpocket" | "confidence_geometry_proxy";
  label: string;
  center: Point3D;
  residueStart: number;
  residueEnd: number;
  nearestFeature: string | null;
  motifs: Motif[];
  allostericScore: number;
  orthostericPenalty: number;
  confidence: number;
  rationale: string;
}

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface PathwayRecord {
  stId: string;
  displayName: string;
  source: "Reactome";
}

interface MacroPathwayNode {
  id: string;
  label: string;
  motifs: Motif[];
  role: "signal_flow" | "authority_process" | "disease_variant" | "feedback_module" | "pathway_context";
}

interface BioMotifIR {
  accession: string;
  proteinName: string;
  gene: string;
  dataSources: string[];
  pathwayContext: PathwayRecord[];
  macroPathwayAst: MacroPathwayNode[];
  structuralFeatures: ProteinFeature[];
  structureSummary: {
    residueCount: number;
    meanPlddt: number;
    lowConfidenceResidues: number;
    pdbPath: string;
  };
  pocketCandidates: PocketCandidate[];
  topAllostericTargets: PocketCandidate[];
  caveats: string[];
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const outputDir = path.join(projectRoot, "artifacts", "bio_motif");
const reportPath = path.join(projectRoot, "bio_motif_compiler.md");
const DEFAULT_ACCESSION = process.env.BIO_MOTIF_ACCESSION ?? "P00533";
const AFDB_VERSION = process.env.AFDB_VERSION ?? "6";
const userAgent = "language-equivalence-bio-motif-mvp/0.1";

async function main(): Promise<void> {
  await mkdir(outputDir, { recursive: true });
  const accession = process.argv[2] ?? DEFAULT_ACCESSION;
  const ir = await compileBioMotif(accession);
  const irPath = path.join(outputDir, `${accession}_bio_motif_ir.json`);
  await writeFile(irPath, `${JSON.stringify(ir, null, 2)}\n`);
  await writeFile(reportPath, buildReport(ir, irPath));
  console.log(`BioMotifIR written to ${irPath}`);
  console.log(`Bio motif compiler report written to ${reportPath}`);
}

async function compileBioMotif(accession: string): Promise<BioMotifIR> {
  const [uniprot, pathways, pdbPath] = await Promise.all([
    fetchUniProt(accession),
    fetchReactomePathways(accession),
    fetchAlphaFoldPdb(accession),
  ]);
  const residues = parsePdbCaAtoms(await readFile(pdbPath, "utf8"));
  const features = parseProteinFeatures(uniprot.features ?? []);
  const fpocketCandidates = await tryFpocket(pdbPath, features);
  const proxyCandidates = buildFeaturePocketProxies(features, residues);
  const geometryCandidates = buildConfidenceGeometryProxies(residues, features);
  const candidates = [...fpocketCandidates, ...proxyCandidates, ...geometryCandidates]
    .map((candidate) => scorePocket(candidate, features, residues))
    .sort((left, right) => right.allostericScore - left.allostericScore);

  return {
    accession,
    proteinName: uniprot.proteinDescription?.recommendedName?.fullName?.value ?? accession,
    gene: uniprot.genes?.[0]?.geneName?.value ?? accession,
    dataSources: [
      "UniProt REST API",
      "AlphaFold DB direct model file",
      "Reactome ContentService mapping endpoint",
      fpocketCandidates.length > 0 ? "fpocket local executable" : "fpocket not installed; deterministic geometry fallback used",
    ],
    pathwayContext: pathways.slice(0, 12),
    macroPathwayAst: buildMacroPathwayAst(pathways),
    structuralFeatures: features,
    structureSummary: {
      residueCount: residues.length,
      meanPlddt: mean(residues.map((residue) => residue.plddt)),
      lowConfidenceResidues: residues.filter((residue) => residue.plddt < 70).length,
      pdbPath,
    },
    pocketCandidates: candidates,
    topAllostericTargets: candidates.slice(0, 8),
    caveats: [
      "This MVP ranks structural intervention candidates; it does not predict clinical efficacy, toxicity, binding energy, or druggability.",
      "AlphaFold structures are predictions. Low pLDDT or disordered regions should be treated carefully.",
      "Fpocket was not available in this local run unless explicitly listed in dataSources; fallback pockets are geometry/annotation proxies.",
      "Use experimental structures, ligand co-crystals, molecular docking, and wet-lab validation before making scientific claims.",
    ],
  };
}

function buildMacroPathwayAst(pathways: PathwayRecord[]): MacroPathwayNode[] {
  return pathways.slice(0, 24).map((pathway) => {
    const lower = pathway.displayName.toLowerCase();
    const motifs = motifsForPathwayName(lower);
    return {
      id: pathway.stId,
      label: pathway.displayName,
      motifs,
      role: roleForPathwayName(lower),
    };
  });
}

function motifsForPathwayName(lowerName: string): Motif[] {
  const motifs = new Set<Motif>(["Composition", "Hierarchy"]);
  if (lowerName.includes("signaling") || lowerName.includes("signal")) {
    motifs.add("Communication");
    motifs.add("Feedback");
    motifs.add("Transition");
  }
  if (lowerName.includes("receptor") || lowerName.includes("egfr") || lowerName.includes("erbb")) {
    motifs.add("Authority");
    motifs.add("Boundary");
  }
  if (lowerName.includes("variant") || lowerName.includes("disease") || lowerName.includes("constitutive")) {
    motifs.add("Invariant");
    motifs.add("Decay");
  }
  if (lowerName.includes("activates") || lowerName.includes("activation")) {
    motifs.add("Transition");
    motifs.add("Terminal State");
  }
  if (lowerName.includes("events") || lowerName.includes("signalosome")) {
    motifs.add("Modularity");
    motifs.add("Reconciliation");
  }
  return [...motifs];
}

function roleForPathwayName(lowerName: string): MacroPathwayNode["role"] {
  if (lowerName.includes("variant") || lowerName.includes("disease") || lowerName.includes("constitutive")) return "disease_variant";
  if (lowerName.includes("activates") || lowerName.includes("activation")) return "feedback_module";
  if (lowerName.includes("egfr") || lowerName.includes("erbb")) return "authority_process";
  if (lowerName.includes("signaling") || lowerName.includes("signal")) return "signal_flow";
  return "pathway_context";
}

async function fetchUniProt(accession: string): Promise<any> {
  const cachePath = path.join(outputDir, `${accession}_uniprot.json`);
  if (existsSync(cachePath)) return JSON.parse(await readFile(cachePath, "utf8"));
  const json = await fetchJson(`https://rest.uniprot.org/uniprotkb/${accession}.json`);
  await writeFile(cachePath, `${JSON.stringify(json, null, 2)}\n`);
  return json;
}

async function fetchReactomePathways(accession: string): Promise<PathwayRecord[]> {
  const cachePath = path.join(outputDir, `${accession}_reactome_pathways.json`);
  if (existsSync(cachePath)) return JSON.parse(await readFile(cachePath, "utf8"));
  const url = `https://reactome.org/ContentService/data/mapping/UniProt/${accession}/pathways`;
  const response = await fetch(url, { headers: { "user-agent": userAgent, accept: "application/json" } });
  if (!response.ok) {
    await writeFile(cachePath, "[]\n");
    return [];
  }
  const rows = (await response.json()) as Array<{ stId?: string; displayName?: string }>;
  const pathways = rows
    .filter((row) => row.stId && row.displayName)
    .map((row) => ({ stId: row.stId!, displayName: row.displayName!, source: "Reactome" as const }));
  await writeFile(cachePath, `${JSON.stringify(pathways, null, 2)}\n`);
  return pathways;
}

async function fetchAlphaFoldPdb(accession: string): Promise<string> {
  const pdbPath = path.join(outputDir, `AF-${accession}-F1-model_v${AFDB_VERSION}.pdb`);
  if (existsSync(pdbPath)) return pdbPath;
  const directUrl = `https://alphafold.ebi.ac.uk/files/AF-${accession}-F1-model_v${AFDB_VERSION}.pdb`;
  const response = await fetch(directUrl, { headers: { "user-agent": userAgent } });
  if (!response.ok) throw new Error(`AlphaFold PDB download failed: ${response.status} ${directUrl}`);
  await writeFile(pdbPath, await response.text());
  return pdbPath;
}

async function fetchJson(url: string): Promise<any> {
  const response = await fetch(url, { headers: { "user-agent": userAgent, accept: "application/json" } });
  if (!response.ok) throw new Error(`Fetch failed: ${response.status} ${url}`);
  return response.json();
}

function parseProteinFeatures(features: UniProtFeature[]): ProteinFeature[] {
  return features
    .map((feature, index) => {
      const start = feature.location?.start?.value;
      const end = feature.location?.end?.value ?? start;
      if (!start || !end) return null;
      const description = feature.description ?? "";
      const motifs = motifsForFeature(feature.type, description);
      return {
        id: `feature_${index + 1}`,
        type: feature.type,
        description,
        start,
        end,
        motifs,
        motifRationale: rationaleForFeature(feature.type, description, motifs),
      };
    })
    .filter((feature): feature is ProteinFeature => Boolean(feature))
    .filter((feature) => feature.motifs.length > 0);
}

function motifsForFeature(type: string, description: string): Motif[] {
  const lower = `${type} ${description}`.toLowerCase();
  const motifs = new Set<Motif>();
  if (lower.includes("active site") || lower.includes("kinase") || lower.includes("catalytic")) {
    motifs.add("Transition");
    motifs.add("Authority");
  }
  if (lower.includes("binding site")) {
    motifs.add("Boundary");
    motifs.add("Transition");
  }
  if (lower.includes("topological") || lower.includes("transmembrane")) {
    motifs.add("Boundary");
    motifs.add("Communication");
  }
  if (lower.includes("dimer") || lower.includes("interaction") || lower.includes("activation")) {
    motifs.add("Communication");
    motifs.add("Feedback");
    motifs.add("Authority");
  }
  if (lower.includes("phospho") || lower.includes("modified residue")) {
    motifs.add("Feedback");
    motifs.add("Communication");
  }
  if (lower.includes("disordered") || lower.includes("composition")) {
    motifs.add("Decay");
    motifs.add("Representation");
  }
  if (lower.includes("repeat") || lower.includes("domain") || lower.includes("region")) {
    motifs.add("Modularity");
    motifs.add("Hierarchy");
  }
  return [...motifs];
}

function rationaleForFeature(type: string, description: string, motifs: Motif[]): string {
  return `${type}${description ? ` (${description})` : ""} maps to ${motifs.join(", ")} because it marks a structural role or regulatory boundary in the protein AST.`;
}

function parsePdbCaAtoms(pdb: string): ResidueCA[] {
  const residues: ResidueCA[] = [];
  for (const line of pdb.split(/\r?\n/)) {
    if (!line.startsWith("ATOM")) continue;
    const atom = line.slice(12, 16).trim();
    if (atom !== "CA") continue;
    residues.push({
      residue: Number(line.slice(22, 26).trim()),
      x: Number(line.slice(30, 38).trim()),
      y: Number(line.slice(38, 46).trim()),
      z: Number(line.slice(46, 54).trim()),
      plddt: Number(line.slice(60, 66).trim()),
    });
  }
  return residues.filter((residue) => Number.isFinite(residue.x) && Number.isFinite(residue.plddt));
}

function buildFeaturePocketProxies(features: ProteinFeature[], residues: ResidueCA[]): PocketCandidate[] {
  return features
    .filter((feature) => feature.motifs.some((motif) => ["Communication", "Feedback", "Boundary", "Authority", "Transition"].includes(motif)))
    .map((feature) => {
      const region = residuesInRange(residues, feature.start, feature.end);
      const center = centroid(region.length > 0 ? region : nearestResidues(residues, feature.start, 8));
      return {
        id: `feature_proxy_${feature.id}`,
        source: "uniprot_feature_proxy" as const,
        label: `${feature.type}${feature.description ? `: ${feature.description}` : ""}`,
        center,
        residueStart: feature.start,
        residueEnd: feature.end,
        nearestFeature: feature.id,
        motifs: feature.motifs,
        allostericScore: 0,
        orthostericPenalty: 0,
        confidence: 0,
        rationale: "UniProt feature projected onto AlphaFold residue coordinates.",
      };
    });
}

function buildConfidenceGeometryProxies(residues: ResidueCA[], features: ProteinFeature[]): PocketCandidate[] {
  const windows: PocketCandidate[] = [];
  const windowSize = 18;
  for (let index = 0; index < residues.length; index += windowSize) {
    const window = residues.slice(index, index + windowSize);
    if (window.length < 6) continue;
    const avgPlddt = mean(window.map((residue) => residue.plddt));
    if (avgPlddt > 82) continue;
    const start = window[0].residue;
    const end = window[window.length - 1].residue;
    const nearest = nearestFeature(features, start, end);
    windows.push({
      id: `geometry_low_conf_${start}_${end}`,
      source: "confidence_geometry_proxy",
      label: `Lower-confidence flexible window ${start}-${end}`,
      center: centroid(window),
      residueStart: start,
      residueEnd: end,
      nearestFeature: nearest?.id ?? null,
      motifs: nearest?.motifs ?? ["Decay", "Representation"],
      allostericScore: 0,
      orthostericPenalty: 0,
      confidence: 0,
      rationale: "AlphaFold pLDDT suggests a flexible or uncertain region that may participate in regulation or disorder.",
    });
  }
  return windows.slice(0, 20);
}

async function tryFpocket(pdbPath: string, features: ProteinFeature[]): Promise<PocketCandidate[]> {
  const hasFpocket = await executableExists("fpocket");
  if (!hasFpocket) return [];
  await execFilePromise("fpocket", ["-f", pdbPath]);
  const outputDirName = pdbPath.replace(/\.pdb$/i, "_out");
  const infoPath = path.join(outputDirName, "pockets", "pocket1_atm.pdb");
  if (!existsSync(infoPath)) return [];
  const pocketResidues = parsePdbCaAtoms(await readFile(infoPath, "utf8"));
  if (pocketResidues.length === 0) return [];
  const start = Math.min(...pocketResidues.map((residue) => residue.residue));
  const end = Math.max(...pocketResidues.map((residue) => residue.residue));
  const nearest = nearestFeature(features, start, end);
  return [
    {
      id: "fpocket_pocket_1",
      source: "fpocket",
      label: "fpocket top-ranked pocket",
      center: centroid(pocketResidues),
      residueStart: start,
      residueEnd: end,
      nearestFeature: nearest?.id ?? null,
      motifs: nearest?.motifs ?? ["Boundary", "Transition"],
      allostericScore: 0,
      orthostericPenalty: 0,
      confidence: 0,
      rationale: "Pocket detected by local fpocket executable.",
    },
  ];
}

function scorePocket(candidate: PocketCandidate, features: ProteinFeature[], residues: ResidueCA[]): PocketCandidate {
  const motifScore =
    1.3 * count(candidate.motifs, "Communication") +
    1.2 * count(candidate.motifs, "Feedback") +
    0.9 * count(candidate.motifs, "Authority") +
    0.7 * count(candidate.motifs, "Boundary") +
    0.3 * count(candidate.motifs, "Modularity") -
    1.0 * count(candidate.motifs, "Transition");
  const activeSites = features.filter((feature) => feature.type.toLowerCase().includes("active site"));
  const distanceToActiveSite = Math.min(
    ...activeSites.map((feature) => distance(candidate.center, centroid(residuesInRange(residues, feature.start, feature.end)))),
    Number.POSITIVE_INFINITY,
  );
  const orthostericPenalty = Number.isFinite(distanceToActiveSite) && distanceToActiveSite < 15 ? 1.4 : 0;
  const plddt = mean(residuesInRange(residues, candidate.residueStart, candidate.residueEnd).map((residue) => residue.plddt));
  const confidence = clamp((plddt || 70) / 100, 0.25, 0.95);
  const allostericScore = clamp(motifScore + confidence - orthostericPenalty, 0, 5);
  return {
    ...candidate,
    allostericScore,
    orthostericPenalty,
    confidence,
    rationale: `${candidate.rationale} Motif score favors Communication/Feedback/Authority and penalizes direct active-site Transition proximity.`,
  };
}

function nearestFeature(features: ProteinFeature[], start: number, end: number): ProteinFeature | null {
  let best: ProteinFeature | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  const mid = (start + end) / 2;
  for (const feature of features) {
    const featureMid = (feature.start + feature.end) / 2;
    const current = Math.abs(mid - featureMid);
    if (current < bestDistance) {
      bestDistance = current;
      best = feature;
    }
  }
  return best;
}

function nearestResidues(residues: ResidueCA[], residue: number, radius: number): ResidueCA[] {
  return residues.filter((item) => Math.abs(item.residue - residue) <= radius);
}

function residuesInRange(residues: ResidueCA[], start: number, end: number): ResidueCA[] {
  return residues.filter((residue) => residue.residue >= start && residue.residue <= end);
}

function centroid(points: Array<Point3D>): Point3D {
  if (points.length === 0) return { x: 0, y: 0, z: 0 };
  return {
    x: mean(points.map((point) => point.x)),
    y: mean(points.map((point) => point.y)),
    z: mean(points.map((point) => point.z)),
  };
}

function distance(left: Point3D, right: Point3D): number {
  return Math.sqrt((left.x - right.x) ** 2 + (left.y - right.y) ** 2 + (left.z - right.z) ** 2);
}

function mean(values: number[]): number {
  const filtered = values.filter(Number.isFinite);
  return filtered.length === 0 ? 0 : filtered.reduce((sum, value) => sum + value, 0) / filtered.length;
}

function count<T>(values: T[], value: T): number {
  return values.filter((item) => item === value).length;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

async function executableExists(name: string): Promise<boolean> {
  try {
    await execFilePromise("which", [name]);
    return true;
  } catch {
    return false;
  }
}

function execFilePromise(command: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(command, args, (error, stdout, stderr) => {
      if (error) reject(new Error(`${command} failed: ${stderr || error.message}`));
      else resolve(stdout);
    });
  });
}

function buildReport(ir: BioMotifIR, irPath: string): string {
  return [
    "# Bio Motif Compiler MVP",
    "",
    "## Status",
    "",
    "This is a structural biology Motif compiler MVP. It stitches together open data adapters and emits BioMotifIR. It does not perform molecular dynamics, docking, clinical prediction, or drug validation.",
    "",
    "## Input",
    "",
    `- UniProt accession: \`${ir.accession}\``,
    `- Protein: ${ir.proteinName}`,
    `- Gene: ${ir.gene}`,
    `- IR artifact: \`${path.relative(projectRoot, irPath)}\``,
    "",
    "## Data Sources",
    "",
    ...ir.dataSources.map((source) => `- ${source}`),
    "",
    "## Pathway Context",
    "",
    "| Reactome ID | Pathway |",
    "| --- | --- |",
    ...ir.pathwayContext.slice(0, 10).map((pathway) => `| ${pathway.stId} | ${pathway.displayName} |`),
    "",
    "## Macro Pathway AST",
    "",
    "| Node | Role | Motifs |",
    "| --- | --- | --- |",
    ...ir.macroPathwayAst
      .slice(0, 12)
      .map((node) => `| ${node.label} | ${node.role} | ${node.motifs.join(", ")} |`),
    "",
    "## Structure Summary",
    "",
    `- Residues parsed from AlphaFold PDB: ${ir.structureSummary.residueCount}`,
    `- Mean pLDDT: ${ir.structureSummary.meanPlddt.toFixed(2)}`,
    `- Low-confidence residues (pLDDT < 70): ${ir.structureSummary.lowConfidenceResidues}`,
    `- PDB cache: \`${path.relative(projectRoot, ir.structureSummary.pdbPath)}\``,
    "",
    "## Motif-Annotated Protein Features",
    "",
    "| Feature | Residues | Motifs | Description |",
    "| --- | ---: | --- | --- |",
    ...ir.structuralFeatures
      .slice(0, 24)
      .map((feature) => `| ${feature.type} | ${feature.start}-${feature.end} | ${feature.motifs.join(", ")} | ${feature.description || "-"} |`),
    "",
    "## Ranked Allosteric-Style Targets",
    "",
    "| Rank | Candidate | Residues | Score | Conf. | Motifs | Source | Rationale |",
    "| ---: | --- | ---: | ---: | ---: | --- | --- | --- |",
    ...ir.topAllostericTargets.map(
      (candidate, index) =>
        `| ${index + 1} | ${candidate.label} | ${candidate.residueStart}-${candidate.residueEnd} | ${candidate.allostericScore.toFixed(3)} | ${candidate.confidence.toFixed(3)} | ${candidate.motifs.join(", ")} | ${candidate.source} | ${candidate.rationale} |`,
    ),
    "",
    "## Caveats",
    "",
    ...ir.caveats.map((caveat) => `- ${caveat}`),
    "",
    "## What This Proves",
    "",
    "- The open-source adapters are enough to build a macro/micro biological AST prototype.",
    "- UniProt feature annotations can be projected onto AlphaFold coordinates as typed motif roles.",
    "- Local pocket tools such as fpocket can be plugged in when installed; the MVP still runs with deterministic geometry proxies.",
    "- The proprietary layer is the motif scoring and compilation logic, not the raw biological databases.",
    "",
  ].join("\n");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
