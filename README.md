# Language Equivalence DLR Report

This project runs the Disentangled Language Representation experiment and writes
`dlr_results.md`.

## Commands

```bash
npm install
npm run typecheck
npm run run:report
npm run run:dlr3
npm run run:dlr4
npm run run:dlr5
npm run run:dlr6
npm run run:dlr7
npm run run:dlr8
npm run run:dlr-lambda
npm run run:dlr-lambda-worklist
npm run run:dlr-lambda-obligations
npm run run:dlr-o
npm run run:dlr-o-stress
npm run run:bio-motif
npm run run:system2vec-bio
npm run run:bio-contracts
npm run run:usc-kernel
npm run run:motif2vec
npm run train:motif2vec
```

By default, `run:report` uses Codex-authored local parses for the 32-D motif
skeletons so the report can be regenerated without a billed API call or an
unattended model prompt.

To exercise the local CLI oracle wrapper instead, run:

```bash
PARSER_PROVIDER=ollama OLLAMA_MODEL=qwen2.5:7b npm run run:report
```

The high-dimensional baseline is a deterministic local 1536-D hashed lexical
embedding over tokens, token n-grams, and character trigrams.

The report now includes two structural scores:

- `32-D motif skeleton`: raw cosine similarity over motif weights.
- `Typed frame`: a polarity-aware score that combines motif similarity,
  transition-family compatibility, transition polarity, direction, and role
  slots. This separates "same gate schema" from "same outcome."

## DLR-3 Structural IR Validation

`npm run run:dlr3` writes:

- `dlr3_structural_ir.md`: pairwise validation report with expected relation,
  predicted relation, pass/fail, category accuracy, and failure examples.
- `artifacts/dlr3_structural_ir.json`: machine-readable Structural IR fixtures.

DLR-3 validates a typed IR with motif basis, frame roles, transition family,
transition polarity, constraints, and expression metadata. It adds role inversion
and invalid-authority categories on top of the earlier A-F contrast sets.

## DLR-4 Parser Robustness & Perturbation

`npm run run:dlr4` writes:

- `dlr4_parser_robustness.md`: robustness report for active/passive
  equivalence, ambiguous authority, context-dependent meaning, negation/modality,
  and sarcasm/pragmatic inversion.
- `artifacts/dlr4_parser_robustness_ir.json`: Structural IR fixtures with
  confidence, ambiguity status, and candidate frames.

DLR-4 keeps the DLR-3 scoring channels but treats calibrated uncertainty as a
success condition. Ambiguous inputs may remain ambiguous instead of being forced
into a single overconfident frame.

## DLR-5 Adversarial IR Falsification

`npm run run:dlr5` writes:

- `dlr5_adversarial_ir_falsification.md`: adversarial falsification report for
  multi-metaphor composition, institutional ambiguity, deceptive authority,
  invariant violations, temporal ambiguity, and local-vs-global process success.
- `artifacts/dlr5_adversarial_ir_falsification_ir.json`: extended Structural IR
  fixtures with parse mode, authority legitimacy, event status, process scope,
  invariant status, composite frame graphs, and confidence calibration.

DLR-5 is not tuned for perfect accuracy. It is meant to reveal when the current
typed motif IR should output `ambiguous_frame`, `composite_frame_graph`, or
`insufficient_context` instead of pretending every utterance is a clean single
frame.

## DLR-6 Causal Frame Graph Validation

`npm run run:dlr6` writes:

- `dlr6_causal_frame_graph.md`: graph-level validation report for authority
  legitimacy, invariant status, transition completion, causal order,
  local/global separation, terminal outcome, and overconfidence failures.
- `artifacts/dlr6_causal_frame_graph_ir.json`: typed causal frame graph fixtures.

DLR-6 extends DLR-5 frame graphs with causal node roles such as
`legitimacy_failure`, `invariant_violation`, `local_transition`, and
`terminal_outcome`, plus typed causal edges such as `violates`, `blocks`,
`preserves`, `attempts`, and `fails_downstream`.

## DLR-7 Trace-to-Causal-IR Diagnosis

`npm run run:dlr7` writes:

- `dlr7_trace_to_causal_ir.md`: process trace diagnosis report with predicted
  and gold causal graphs, node/edge recall, root-cause accuracy, false-terminal
  detection, local/global separation, invariant/authority detection,
  prescriptions, and overconfidence failures.
- `artifacts/dlr7_trace_to_causal_ir.json`: synthetic multi-event traces plus
  gold and predicted ProcessIR objects.

DLR-7 moves from single utterances to timestamped traces. Its main target is
detecting local subsystem success reports that are not valid terminal states for
the parent process.

## DLR-8 Hidden Preconditions and Boundary Decay

`npm run run:dlr8` writes:

- `dlr8_hidden_preconditions.md`: report for hidden structural preconditions,
  latent condition recall, edge recall, root-cause accuracy, false-terminal
  detection, boundary/identity/decay detection, and corrected prescriptions.
- `artifacts/dlr8_hidden_preconditions_ir.json`: ProcessIR fixtures with
  `latentConditions` and `nodeKind` added to the causal graph.

DLR-8 tests traces where local transitions appear valid but operate over stale,
aliased, queued, replicated, or decayed representations.

## DLR-Lambda Loghub Synergy Experiment

`npm run run:dlr-lambda` writes:

- `dlr_lambda_loghub.md`: a Loghub-backed demonstration of lambda-RLM-style
  deterministic `SPLIT/MAP/FILTER/REDUCE` control composed with DLR ProcessIR.
- `artifacts/dlr_lambda_loghub_process_ir.json`: gold and predicted ProcessIR
  objects plus baseline scores.

The experiment downloads Loghub's small Linux sample on demand, injects a
distributed stale-policy incident across distant chunks, and compares direct
first-window parsing, naive chunk event merge, and DLR-lambda ProcessIR
composition.

The standalone paper for this result is in `paper/dlr_lambda_loghub.tex`; the
compiled PDF is written to `output/pdf/dlr_lambda_loghub.pdf`.

## DLR-Lambda Worklist/Fixpoint Experiment

`npm run run:dlr-lambda-worklist` writes:

- `dlr_lambda_worklist.md`: a Loghub-backed comparison of one-pass
  MapReduce-style DLR-lambda against a typed worklist/fixpoint controller.
- `artifacts/dlr_lambda_worklist_process_ir.json`: gold, MapReduce, and
  worklist ProcessIR outputs plus the worklist trace.

The experiment injects a marker-free refund incident where a VIP exemption claim
initially weakens the stale-policy hypothesis, but a scheduled follow-up join
finds that the exemption expired before approval. The goal is to test whether
DLR-lambda should be treated as batch reduction or as recursive investigative
control with joins, hypothesis revision, and coverage verification.

The standalone DLR-lambda-2 paper is in `paper/dlr_lambda_worklist.tex`; the
compiled PDF is written to `output/pdf/dlr_lambda_worklist.pdf`.

## DLR-Lambda Motif Obligation Calculus

`npm run run:dlr-lambda-obligations` writes:

- `dlr_lambda_obligations.md`: a Loghub-backed DLR-lambda-3 report comparing
  worklist/fixpoint recovery against an explicit motif obligation ledger.
- `artifacts/dlr_lambda_obligations_process_ir.json`: gold, worklist-only, and
  obligation-calculus ProcessIR outputs plus the obligation trace.

DLR-lambda-3 treats facts such as cache use, exemption claims, authority
assertions, and terminal success reports as obligation-generating facts.
ProcessIR is terminal-valid only when mandatory obligations are satisfied,
violated, or explicitly unknown under budget.

## DLR-O Cross-Domain Obligation Transfer

`npm run run:dlr-o` writes:

- `dlr_obligation_transfer.md`: a cross-domain obligation-transfer report.
- `artifacts/dlr_obligation_transfer.json`: cases, predictions, scores, and
  summary metrics.

DLR-O tests whether the obligation ledger is motif-native rather than
log-specific. The same obligation types are applied to graph traversal, agent
deletion, compliance approval, payment/order reconciliation, and code security.
The key claim is that terminal claims are unsafe unless the motif obligations
they generate are discharged.

`npm run run:dlr-o-stress` writes:

- `dlr_obligation_stress.md`: an adversarial unknown-handling stress test.
- `artifacts/dlr_obligation_stress.json`: stress cases, predictions, scores,
  and summary metrics.

The stress test verifies that DLR-O preserves `unknown` as a valid terminal
state when required evidence is unavailable, instead of forcing local success
into global validity.

The standalone DLR-O paper is in `paper/dlr_obligation_ledger.tex`; the
compiled PDF is written to `output/pdf/dlr_obligation_ledger.pdf`.

## motif2vec Dataset Scope

`npm run run:motif2vec` writes:

- `motif2vec_dataset.md`: dataset-generation scope for a 32-D motif embedding
  library.
- `artifacts/motif2vec/seed.jsonl`: deterministic seed examples with
  inspectable 32-D motif vectors.
- `artifacts/motif2vec/corpus_10k.jsonl`: 10,000 synthetic oracle-labeled
  structural examples.
- `artifacts/motif2vec/train.jsonl`, `dev.jsonl`, and `test.jsonl`: training
  splits for the embedding model.
- `artifacts/motif2vec/eval_pairs.jsonl`: cross-domain positive and lexical
  hard-negative retrieval pairs.

The goal is to package the DLR motif basis as a structural retrieval embedding
layer. This is intentionally separate from ProcessIR: motif vectors are for
retrieval and similarity search; typed IR is for causal reasoning.

`npm run train:motif2vec` trains `motif-embed-v0`, a no-dependency hashed
n-gram baseline regressor that maps text to 32 motif dimensions. It writes:

- `models/motif-embed-v0/model.json`
- `motif2vec_training.md`

This baseline keeps the output contract stable for a future
`all-MiniLM-L6-v2 -> 32-D regression head` implementation.

The optional MiniLM trainer is available at
`experiments/motif2vec_train_minilm.py`. It expects:

```bash
python3.11 -m pip install sentence-transformers scikit-learn numpy joblib
python3.11 experiments/motif2vec_train_minilm.py
```

It is intentionally dependency-gated so the default repo path remains runnable
with only Node dependencies.

## Bio Motif Compiler MVP

`npm run run:bio-motif` builds a first BioMotifIR artifact for a UniProt
accession. By default it uses EGFR (`P00533`):

```bash
npm run run:bio-motif
npm run run:bio-motif -- P04637
```

It writes:

- `bio_motif_compiler.md`: macro/micro structural biology compiler report.
- `artifacts/bio_motif/<ACCESSION>_bio_motif_ir.json`: BioMotifIR with
  pathway context, protein feature motifs, structure summary, and ranked
  allosteric-style pocket candidates.
- cached UniProt, Reactome, and AlphaFold files under `artifacts/bio_motif/`.

The MVP uses UniProt REST, Reactome ContentService, and AlphaFold DB direct PDB
files. If `fpocket` is installed locally, it attempts to use it; otherwise it
falls back to deterministic UniProt-feature and AlphaFold-confidence geometry
proxies. This is a structural target-ranking prototype, not a docking, clinical,
or drug-efficacy predictor.

## System2Vec Bio Bridge

`npm run run:system2vec-bio` flattens the EGFR BioMotifIR target signatures into
32-D motif vectors and retrieves cross-domain software/control-system analogies
such as token buckets, semaphores, backpressure, circuit breakers, and quorum
gates.

It writes:

- `system2vec_bio_bridge.md`
- `artifacts/system2vec/P00533_system2vec_bridge.json`

This is a design-analogy layer. It can suggest regulatory mechanisms to hand to
chemistry-specific tooling, but it does not generate or validate molecules.

## Bio AST Execution Contracts

`npm run run:bio-contracts` converts the EGFR BioMotifIR + System2Vec bridge
into molecule-generator-facing AST execution contracts.

It writes:

- `bio_ast_execution_contracts.md`
- `artifacts/bio_contracts/P00533_ast_execution_contracts.json`

Each contract includes target residues, bio motifs, the systems analogy,
required effects, prohibited effects, geometry constraints, kinetic/structural
constraints, validation gates, and a generator prompt. These are computational
design hypotheses only, not therapeutic claims.

## USC Atlas Kernel

`npm run run:usc-kernel` runs a deterministic Layer-1 guardrail over System2Vec
and Bio AST contract patterns.

It writes:

- `usc_atlas_kernel.md`
- `artifacts/usc/atlas_kernel_audit.json`

The audit checks motif valence prerequisites, collision rules, implementation
fidelity, and typed substrate-assumption mismatches. This is the safety layer
that prevents naive cross-domain transfer from being accepted merely because two
vectors are close.

The standalone Universal Systems Compiler / Motif Atlas paper is in
`paper/usc_motif_atlas.tex`; the compiled PDF is written to
`output/pdf/usc_motif_atlas.pdf`.

The expanded theory manuscript is stored separately at
`paper/usc_motif_atlas_theory.tex`.
