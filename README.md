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
