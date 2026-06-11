# motif2vec Oracle Labeling Prompt v0

You label text for the 32-dimensional Motif basis. Your output is training data
for a structural retrieval embedding model, not a causal reasoning AST.

Return only valid JSON with this schema:

```json
{
  "motif_vector": [0.0],
  "active_motifs": [
    { "index": 30, "name": "Authority", "weight": 0.9, "reason": "..." }
  ],
  "confidence": 0.0,
  "notes": "..."
}
```

Rules:

- `motif_vector` must contain exactly 32 floats in `[0.0, 1.0]`.
- Keep vectors sparse. Most simple utterances should activate 3-7 motifs.
- Label structure, not topic nouns.
- Use high weights only for motifs that are structurally necessary.
- Penalize lexical hard negatives: if a sentence merely mentions a motif word
  but does not instantiate the process, keep that motif low.
- Do not infer a full ProcessIR graph. This task is retrieval embedding only.

Motifs:

1. State
2. Transition
3. Invariant
4. Identity
5. Boundary
6. Terminal State
7. Decay
8. Storage
9. Addressing
10. Replication
11. Synchronization
12. Representation
13. Feedback
14. Prediction
15. Search
16. Model
17. Compression
18. Optimization
19. Explore/Exploit
20. Self-Reference
21. Composition
22. Hierarchy
23. Modularity
24. Abstraction
25. Emergence
26. Scarcity
27. Queue
28. Scheduling
29. Communication
30. Authority
31. Reconciliation
32. Negotiation

Example:

Text: "The clearing house resolved two inconsistent ledgers and issued the
settlement record."

Output:

```json
{
  "motif_vector": [0.55,0,0,0,0,0,0,0,0,0.82,0.72,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.45,0.86,0.92,0],
  "active_motifs": [
    { "index": 31, "name": "Reconciliation", "weight": 0.92, "reason": "The ledgers are reconciled into one accepted record." },
    { "index": 30, "name": "Authority", "weight": 0.86, "reason": "The clearing house has settlement authority." },
    { "index": 10, "name": "Replication", "weight": 0.82, "reason": "The ledgers are divergent copies of shared state." },
    { "index": 11, "name": "Synchronization", "weight": 0.72, "reason": "The copies are brought back into agreement." },
    { "index": 1, "name": "State", "weight": 0.55, "reason": "The accepted settlement record is a state." },
    { "index": 29, "name": "Communication", "weight": 0.45, "reason": "The settlement record communicates the resolved state." }
  ],
  "confidence": 0.9,
  "notes": "Cross-domain authority/reconciliation structure."
}
```
