import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

interface DatasetRow {
  id: string;
  split: "train" | "dev" | "test";
  archetype: string;
  domain: string;
  text: string;
  motif_vector: number[];
}

interface EvalPair {
  id: string;
  relation: "positive_cross_domain" | "hard_negative";
  left: string;
  right: string;
  expected_similarity: "high" | "low";
}

interface Metrics {
  rows: number;
  cosine: number;
  mae: number;
  rmse: number;
  activeMotifRecallAt4: number;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const dataDir = path.join(projectRoot, "artifacts", "motif2vec");
const trainPath = path.join(dataDir, "train.jsonl");
const devPath = path.join(dataDir, "dev.jsonl");
const testPath = path.join(dataDir, "test.jsonl");
const evalPairPath = path.join(dataDir, "eval_pairs.jsonl");
const modelDir = path.join(projectRoot, "models", "motif-embed-v0");
const modelPath = path.join(modelDir, "model.json");
const reportPath = path.join(projectRoot, "motif2vec_training.md");

const FEATURE_DIMS = 2048;
const OUTPUT_DIMS = 32;
const EPOCHS = 9;
const LEARNING_RATE = 0.16;
const WEIGHT_DECAY = 0.00003;

async function main(): Promise<void> {
  await mkdir(modelDir, { recursive: true });
  const trainRows = await readJsonl<DatasetRow>(trainPath);
  const devRows = await readJsonl<DatasetRow>(devPath);
  const testRows = await readJsonl<DatasetRow>(testPath);
  const evalPairs = await readJsonl<EvalPair>(evalPairPath);
  const allRows = [...trainRows, ...devRows, ...testRows];
  const model = train(trainRows, devRows);
  const trainMetrics = evaluateRows(trainRows, model);
  const devMetrics = evaluateRows(devRows, model);
  const testMetrics = evaluateRows(testRows, model);
  const pairMetrics = evaluatePairs(evalPairs, allRows, model);

  await writeFile(modelPath, `${JSON.stringify(serializeModel(model), null, 2)}\n`);
  await writeFile(reportPath, buildReport(trainMetrics, devMetrics, testMetrics, pairMetrics));
  console.log(`motif-embed-v0 model written to ${modelPath}`);
  console.log(`motif2vec training report written to ${reportPath}`);
}

function train(trainRows: DatasetRow[], devRows: DatasetRow[]): Float64Array {
  const weights = new Float64Array((FEATURE_DIMS + 1) * OUTPUT_DIMS);
  let bestWeights = new Float64Array(weights);
  let bestDev = Number.POSITIVE_INFINITY;

  for (let epoch = 0; epoch < EPOCHS; epoch += 1) {
    const ordered = deterministicShuffle(trainRows, epoch);
    for (const row of ordered) {
      const features = featurize(row.text);
      const prediction = predictFromFeatures(features, weights, false);
      for (let output = 0; output < OUTPUT_DIMS; output += 1) {
        const error = prediction[output] - row.motif_vector[output];
        const offset = output * (FEATURE_DIMS + 1);
        weights[offset] -= LEARNING_RATE * error;
        for (const feature of features) {
          const index = offset + 1 + feature.index;
          weights[index] = weights[index] * (1 - WEIGHT_DECAY) - LEARNING_RATE * error * feature.value;
        }
      }
    }

    const dev = evaluateRows(devRows, weights);
    if (dev.rmse < bestDev) {
      bestDev = dev.rmse;
      bestWeights = new Float64Array(weights);
    }
  }

  return bestWeights;
}

function evaluateRows(rows: DatasetRow[], model: Float64Array): Metrics {
  let cosineSum = 0;
  let absoluteError = 0;
  let squaredError = 0;
  let activeRecall = 0;

  for (const row of rows) {
    const predicted = predict(row.text, model);
    cosineSum += cosineSimilarity(predicted, row.motif_vector);
    for (let index = 0; index < OUTPUT_DIMS; index += 1) {
      const error = predicted[index] - row.motif_vector[index];
      absoluteError += Math.abs(error);
      squaredError += error * error;
    }
    activeRecall += recallAt4(predicted, row.motif_vector);
  }

  const denominator = rows.length * OUTPUT_DIMS;
  return {
    rows: rows.length,
    cosine: cosineSum / rows.length,
    mae: absoluteError / denominator,
    rmse: Math.sqrt(squaredError / denominator),
    activeMotifRecallAt4: activeRecall / rows.length,
  };
}

function evaluatePairs(pairs: EvalPair[], rows: DatasetRow[], model: Float64Array): {
  total: number;
  passed: number;
  positiveAccuracy: number;
  hardNegativeAccuracy: number;
  examples: Array<{ id: string; relation: string; score: number; pass: boolean }>;
} {
  const byId = new Map(rows.map((row) => [row.id, row]));
  const examples: Array<{ id: string; relation: string; score: number; pass: boolean }> = [];
  for (const pair of pairs) {
    const left = byId.get(pair.left);
    const right = byId.get(pair.right);
    if (!left || !right) continue;
    const score = cosineSimilarity(predict(left.text, model), predict(right.text, model));
    const pass = pair.expected_similarity === "high" ? score >= 0.82 : score <= 0.78;
    examples.push({ id: pair.id, relation: pair.relation, score, pass });
  }

  const positives = examples.filter((item) => item.relation === "positive_cross_domain");
  const negatives = examples.filter((item) => item.relation === "hard_negative");
  return {
    total: examples.length,
    passed: examples.filter((item) => item.pass).length,
    positiveAccuracy: positives.filter((item) => item.pass).length / positives.length,
    hardNegativeAccuracy: negatives.filter((item) => item.pass).length / negatives.length,
    examples: examples.slice(0, 12),
  };
}

function predict(text: string, model: Float64Array): number[] {
  return predictFromFeatures(featurize(text), model, true);
}

function predictFromFeatures(features: Array<{ index: number; value: number }>, model: Float64Array, shouldClamp: boolean): number[] {
  const output = Array.from({ length: OUTPUT_DIMS }, () => 0);
  for (let dimension = 0; dimension < OUTPUT_DIMS; dimension += 1) {
    const offset = dimension * (FEATURE_DIMS + 1);
    let value = model[offset];
    for (const feature of features) value += model[offset + 1 + feature.index] * feature.value;
    output[dimension] = shouldClamp ? clamp(value, 0, 1) : value;
  }
  return output;
}

function featurize(text: string): Array<{ index: number; value: number }> {
  const tokens = tokenize(text);
  const raw = [
    ...tokens.map((token) => `tok:${token}`),
    ...ngrams(tokens, 2).map((token) => `bi:${token}`),
    ...ngrams(tokens, 3).map((token) => `tri:${token}`),
    ...characterNgrams(text, 4),
  ];
  const byIndex = new Map<number, number>();
  const scale = raw.length === 0 ? 1 : 1 / Math.sqrt(raw.length);
  for (const item of raw) {
    const index = positiveHash(item) % FEATURE_DIMS;
    const sign = positiveHash(`sign:${item}`) % 2 === 0 ? 1 : -1;
    byIndex.set(index, (byIndex.get(index) ?? 0) + sign * scale);
  }
  return [...byIndex.entries()].map(([index, value]) => ({ index, value }));
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
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

function characterNgrams(text: string, size: number): string[] {
  const compact = text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const output: string[] = [];
  for (let index = 0; index <= compact.length - size; index += 1) {
    output.push(`c${size}:${compact.slice(index, index + size)}`);
  }
  return output;
}

function recallAt4(predicted: number[], expected: number[]): number {
  const expectedActive = topK(expected, 4);
  const predictedActive = new Set(topK(predicted, 4));
  return expectedActive.filter((index) => predictedActive.has(index)).length / expectedActive.length;
}

function topK(vector: number[], k: number): number[] {
  return vector
    .map((value, index) => ({ value, index }))
    .sort((left, right) => right.value - left.value)
    .slice(0, k)
    .map((item) => item.index);
}

function deterministicShuffle(rows: DatasetRow[], epoch: number): DatasetRow[] {
  return [...rows].sort((left, right) => positiveHash(`${epoch}:${left.id}`) - positiveHash(`${epoch}:${right.id}`));
}

function serializeModel(model: Float64Array): {
  kind: string;
  featureDims: number;
  outputDims: number;
  weights: number[][];
} {
  const weights: number[][] = [];
  for (let output = 0; output < OUTPUT_DIMS; output += 1) {
    const offset = output * (FEATURE_DIMS + 1);
    weights.push(Array.from(model.slice(offset, offset + FEATURE_DIMS + 1)).map((value) => Number(value.toFixed(6))));
  }
  return {
    kind: "motif-embed-v0-hashed-ngram-linear-regressor",
    featureDims: FEATURE_DIMS,
    outputDims: OUTPUT_DIMS,
    weights,
  };
}

function buildReport(
  trainMetrics: Metrics,
  devMetrics: Metrics,
  testMetrics: Metrics,
  pairMetrics: ReturnType<typeof evaluatePairs>,
): string {
  return [
    "# motif2vec Training Report",
    "",
    "## Model",
    "",
    "- Name: `motif-embed-v0`",
    "- Type: no-dependency hashed n-gram linear regressor",
    `- Feature dimensions: ${FEATURE_DIMS}`,
    `- Output dimensions: ${OUTPUT_DIMS}`,
    `- Epochs: ${EPOCHS}`,
    "",
    "This is the runnable local baseline for the embedding library. It preserves the 32-D output contract that a future MiniLM regressor should share.",
    "",
    "## Split Metrics",
    "",
    "| Split | Rows | Cosine | MAE | RMSE | Active motif recall@4 |",
    "| --- | ---: | ---: | ---: | ---: | ---: |",
    metricRow("train", trainMetrics),
    metricRow("dev", devMetrics),
    metricRow("test", testMetrics),
    "",
    "## Retrieval Pair Evaluation",
    "",
    `- Pairs evaluated: ${pairMetrics.total}`,
    `- Passed: ${pairMetrics.passed}/${pairMetrics.total}`,
    `- Positive cross-domain accuracy: ${pairMetrics.positiveAccuracy.toFixed(4)}`,
    `- Hard-negative accuracy: ${pairMetrics.hardNegativeAccuracy.toFixed(4)}`,
    "",
    "| Pair | Relation | Predicted similarity | Pass |",
    "| --- | --- | ---: | --- |",
    ...pairMetrics.examples.map((item) => `| ${item.id} | ${item.relation} | ${item.score.toFixed(4)} | ${item.pass ? "yes" : "no"} |`),
    "",
    "## Next Trainer",
    "",
    "Replace this baseline with `all-MiniLM-L6-v2 -> 32-D regression head` once the Python torch/sentence-transformers stack is installed. Keep the same JSONL inputs, report metrics, and output contract.",
    "",
  ].join("\n");
}

function metricRow(name: string, metrics: Metrics): string {
  return `| ${name} | ${metrics.rows} | ${metrics.cosine.toFixed(4)} | ${metrics.mae.toFixed(4)} | ${metrics.rmse.toFixed(4)} | ${metrics.activeMotifRecallAt4.toFixed(4)} |`;
}

async function readJsonl<T>(filePath: string): Promise<T[]> {
  const body = await readFile(filePath, "utf8");
  return body
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line) as T);
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

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
