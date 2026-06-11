# motif2vec Dataset Generation Scope

## Thesis

The 32-D motif vector is not sufficient for causal reasoning, but it is a strong retrieval vector. `motif2vec` should therefore be packaged as a structural embedding layer: small, inspectable, cross-domain, and designed to complement ordinary semantic embeddings in dual-vector RAG.

## Generated Seed Artifacts

- Dataset JSONL: `artifacts/motif2vec/seed.jsonl`
- 10k corpus JSONL: `artifacts/motif2vec/corpus_10k.jsonl`
- Train split: `artifacts/motif2vec/train.jsonl`
- Dev split: `artifacts/motif2vec/dev.jsonl`
- Test split: `artifacts/motif2vec/test.jsonl`
- Eval pairs JSONL: `artifacts/motif2vec/eval_pairs.jsonl`
- Seed rows: 72
- Synthetic rows: 10000
- Total rows: 10072
- Split counts: train 8056, dev 994, test 1022
- Archetypes: 12
- Pairwise eval cases: 60

## Row Schema

```ts
interface Motif2VecRow {
  id: string;
  split: 'train' | 'dev' | 'test';
  archetype: string;
  domain: string;
  text: string;
  motif_vector: number[]; // exactly 32 floats in [0, 1]
  active_motifs: Array<{ index: number; name: string; weight: number }>;
  oracle: { labeler: string; rationale: string };
}
```

## Dataset Strategy

1. Start with canonical structural archetypes, not topics.
2. Generate 10,000 synthetic cross-domain phrasings from archetype templates.
3. Treat archetype vectors as oracle-labeled training targets and keep active-motif rationales in every row.
4. Attach lexical hard negatives for retrieval evaluation.
5. Train a small regressor from text to the 32-D vector.
6. Evaluate by cross-domain retrieval, lexical hard negatives, motif coverage, and calibration.

## Seed Archetypes

| Archetype | Examples | Dominant motifs |
| --- | ---: | --- |
| Authority reconciles divergent replicas | 5 + hard negative | Reconciliation 0.92, Authority 0.86, Replication 0.82, Synchronization 0.72 |
| Boundary blocks invalid transition | 5 + hard negative | Boundary 0.90, Transition 0.80, Invariant 0.78, Authority 0.62 |
| Local transition falsely reports global completion | 5 + hard negative | Terminal State 0.86, Transition 0.72, Invariant 0.72, Reconciliation 0.70 |
| Stale representation causes action against old state | 5 + hard negative | Representation 0.95, Decay 0.82, Transition 0.55, Model 0.55 |
| Scarcity creates queue and scheduling pressure | 5 + hard negative | Scarcity 0.92, Queue 0.90, Scheduling 0.88, Transition 0.45 |
| Feedback corrects a predictive model | 5 + hard negative | Feedback 0.95, Model 0.80, Prediction 0.78, Representation 0.70 |
| Identity alias crosses ownership boundary | 5 + hard negative | Identity 0.95, Addressing 0.78, Boundary 0.72, Reconciliation 0.60 |
| Local modules compose into emergent behavior | 5 + hard negative | Composition 0.95, Emergence 0.88, Modularity 0.82, Hierarchy 0.55 |
| Compression drops a necessary invariant | 5 + hard negative | Compression 0.94, Invariant 0.82, Representation 0.62, Abstraction 0.58 |
| Negotiation resolves conflicting objectives | 5 + hard negative | Negotiation 0.95, Communication 0.76, Reconciliation 0.70, Hierarchy 0.45 |
| Search balances exploration and exploitation | 5 + hard negative | Explore/Exploit 0.94, Search 0.90, Optimization 0.82, Scarcity 0.38 |
| Self-reference changes the system model | 5 + hard negative | Self-Reference 0.95, Model 0.72, Representation 0.60, Composition 0.35 |

## Motif Coverage

| # | Motif | Group | Rows |
| ---: | --- | --- | ---: |
| 1 | State | Existence | 4199 |
| 2 | Transition | Existence | 3149 |
| 3 | Invariant | Existence | 3043 |
| 4 | Identity | Existence | 839 |
| 5 | Boundary | Existence | 1574 |
| 6 | Terminal State | Existence | 1575 |
| 7 | Decay | Existence | 840 |
| 8 | Storage | Persistence | 735 |
| 9 | Addressing | Persistence | 839 |
| 10 | Replication | Persistence | 735 |
| 11 | Synchronization | Persistence | 735 |
| 12 | Representation | Intelligence | 4931 |
| 13 | Feedback | Intelligence | 1574 |
| 14 | Prediction | Intelligence | 1468 |
| 15 | Search | Intelligence | 839 |
| 16 | Model | Intelligence | 2413 |
| 17 | Compression | Intelligence | 839 |
| 18 | Optimization | Intelligence | 1468 |
| 19 | Explore/Exploit | Intelligence | 839 |
| 20 | Self-Reference | Intelligence | 839 |
| 21 | Composition | Structure | 2308 |
| 22 | Hierarchy | Structure | 2203 |
| 23 | Modularity | Structure | 734 |
| 24 | Abstraction | Structure | 1468 |
| 25 | Emergence | Structure | 839 |
| 26 | Scarcity | Allocation | 1573 |
| 27 | Queue | Allocation | 839 |
| 28 | Scheduling | Allocation | 734 |
| 29 | Communication | Coordination | 6399 |
| 30 | Authority | Coordination | 2309 |
| 31 | Reconciliation | Coordination | 4512 |
| 32 | Negotiation | Coordination | 839 |

## Structural Retrieval Probe

Query vector: `Authority + Reconciliation + Replication + Synchronization + State + Communication`.

| Rank | Score | ID | Domain | Text |
| ---: | ---: | --- | --- | --- |
| 1 | 1.0000 | authority_reconciles_divergence:software | software | The merge controller reconciled two diverging Git branches and blessed the canonical history. |
| 2 | 1.0000 | authority_reconciles_divergence:distributed_systems | distributed systems | The consensus leader compared stale replicas and committed the authoritative ledger entry. |
| 3 | 1.0000 | authority_reconciles_divergence:biology | biology | Mismatch repair enzymes reconciled the copied DNA strand against the trusted template. |
| 4 | 1.0000 | authority_reconciles_divergence:finance | finance | The clearing house resolved two inconsistent ledgers and issued the settlement record. |
| 5 | 1.0000 | authority_reconciles_divergence:human_organization | human organization | The mediator aligned conflicting department reports into a single approved plan. |
| 6 | 1.0000 | synthetic:09085:authority_reconciles_divergence | medicine | In medicine, the operator compared diverging artifacts and declared one authoritative state after a delayed update. |
| 7 | 1.0000 | synthetic:02977:authority_reconciles_divergence | agentic AI | In agentic AI, the operator compared diverging boundarys and declared one authoritative state after a local success signal. |
| 8 | 1.0000 | synthetic:04381:authority_reconciles_divergence | medicine | In medicine, the operator compared diverging artifacts and declared one authoritative state while the cached view was still active. Example analogue: The merge controller reconciled two diverging Git branches and blessed the canonical history. |

## Training Plan

- Phase 0: deterministic seed set in this repo, used to prove schema and eval mechanics. Done.
- Phase 1: generate 10k examples by expanding archetypes across software, biology, law, medicine, finance, logistics, organizations, and distributed systems. Done.
- Phase 2: use an LLM oracle prompt to audit vectors, but keep every row as JSONL with inspectable active motifs. Next quality gate.
- Phase 3: fine-tune a small sentence encoder or local regressor to emit 32 bounded floats. Implemented as a no-dependency baseline trainer in this repo.
- Phase 4: publish `motif-embed-v1` with a dual-vector RAG example: `score = alpha * semantic + (1 - alpha) * motif`.

## Evaluation Gates

- Cross-domain positives: structurally equivalent examples should retrieve each other despite topic distance.
- Lexical hard negatives: same nouns without the same structure should rank lower.
- Motif coverage: every motif must appear in enough contexts before training.
- Sparsity calibration: predictions should stay sparse when the input expresses a clean structure.
- Dual-vector utility: blended retrieval should improve structural queries without harming ordinary topical lookup.
