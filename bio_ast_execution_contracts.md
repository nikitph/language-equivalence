# Bio AST Execution Contracts

## Status

These contracts convert BioMotifIR + System2Vec matches into molecule-generator-facing design hypotheses. They are not therapeutics, not docking results, and not biological validation.

Artifact: `artifacts/bio_contracts/P00533_ast_execution_contracts.json`

## Contracts

### 1. egfr_contract_1_circuit_breaker_609_609

- Target: Mutagenesis: Decreases intramolecular interactions and facilitates EGF binding. Increased EGF binding; when associated with A-587; A-590 and A-609.
- Residues: 609-609
- Bio motifs: Communication, Feedback, Authority
- Systems analogy: Circuit breaker (0.7812)
- Intent: Open a reversible safety boundary when pathological feedback loops dominate.
- Fidelity gap: The static wedge lacks an internal Feedback loop and therefore cannot distinguish healthy baseline signaling from pathological high-frequency or tumor-context signaling.
- Upgrade principle: Upgrade the molecule from static binding to state-dependent, feedback-gated modulation. Target 609-609 should be regulated by signal dynamics and environment, not geometry alone.

Required effects:
- Modulate the target's Communication + Feedback + Authority motif signature.
- Act through an allosteric/interface mechanism rather than direct orthosteric shutdown.
- Prefer reversible, tunable modulation over irreversible blockade.
- Bias the protein toward a recoverable inactive or open-loop regulatory state under excessive activation.

Smart modulator spec:
- Volatility trigger: Prefer state-dependent affinity that rises under pathological activation dynamics and remains weak in resting conformations.
- Downstream sensor: Add an environment-gated activation concept: the binding interface should be masked or weak at healthy extracellular pH and become exposed or stronger under tumor-like context such as lower pH or oxidative stress. This is a hypothesis specification, not a validated chemistry claim.
- Dual-gate logic: Engage only when both gates are satisfied: (1) target conformation indicates high-frequency/pathological activation and (2) local environment indicates disease-context stress. If either gate is absent, remain weakly binding or inactive.
- Candidate environmental gates: lower pH tumor microenvironment, elevated reactive oxygen species, protease-cleavable tumor-context linker, redox-sensitive steric shield

Prohibited effects:
- Do not directly lock the ATP/catalytic active site as the primary mechanism.
- Do not force a permanent terminal inactive state unless explicitly validated as selective.
- Do not disrupt unrelated housekeeping signaling without selectivity evidence.

Validation gates:
- Docking or generative model must return a pose and contact map, not only a molecule string.
- Contact map should overlap the target residue window or a justified adjacent regulatory interface.
- Predicted mechanism should modulate dimerization/interface signaling rather than ATP chemistry alone.
- Run selectivity checks against related kinases or receptor family members before claiming specificity.
- Treat all output as a hypothesis until validated by experimental structure, binding, signaling, and toxicity assays.

Generator prompt:

```text
Design-hypothesis contract for EGFR (Epidermal growth factor receptor).
Target region: residues 609-609.
Target annotation: Mutagenesis: Decreases intramolecular interactions and facilitates EGF binding. Increased EGF binding; when associated with A-587; A-590 and A-609..
Motif payload: Communication + Feedback + Authority.
Systems analogy: Circuit breaker (operations), similarity 0.7812.
Mechanistic intent: Open a reversible safety boundary when pathological feedback loops dominate.
Fidelity upgrade:
- Avoid static allosteric friction as the only mechanism.
- Prefer a context-aware smart modulator with feedback-like gating.
- Fidelity gap: The static wedge lacks an internal Feedback loop and therefore cannot distinguish healthy baseline signaling from pathological high-frequency or tumor-context signaling.
- Upgrade principle: Upgrade the molecule from static binding to state-dependent, feedback-gated modulation. Target 609-609 should be regulated by signal dynamics and environment, not geometry alone.
Smart modulator gates:
- Volatility trigger: Prefer state-dependent affinity that rises under pathological activation dynamics and remains weak in resting conformations.
- Downstream sensor: Add an environment-gated activation concept: the binding interface should be masked or weak at healthy extracellular pH and become exposed or stronger under tumor-like context such as lower pH or oxidative stress. This is a hypothesis specification, not a validated chemistry claim.
- Dual gate logic: Engage only when both gates are satisfied: (1) target conformation indicates high-frequency/pathological activation and (2) local environment indicates disease-context stress. If either gate is absent, remain weakly binding or inactive.
Geometry constraints:
- Prefer candidate binders near EGFR residues 609-609.
- Prefer interface-adjacent poses over catalytic active-site poses.
- Avoid poses whose primary contact map is dominated by orthosteric Transition residues.
- Prioritize contacts that can perturb Communication, Feedback, Authority, Boundary, or Modularity motifs.
Kinetic/structural constraints:
- Favor reversible inactive-state stabilization under excessive activation pressure.
- Avoid irreversible terminal-state traps unless validated as selective.
Return candidate molecules or binders only with predicted pose, contact map, and rationale. Do not claim therapeutic efficacy.
```

### 2. egfr_contract_2_circuit_breaker_587_590

- Target: Mutagenesis: Decreases intramolecular interactions and facilitates EGF binding.
- Residues: 587-590
- Bio motifs: Communication, Feedback, Authority
- Systems analogy: Circuit breaker (0.7812)
- Intent: Open a reversible safety boundary when pathological feedback loops dominate.
- Fidelity gap: The static wedge lacks an internal Feedback loop and therefore cannot distinguish healthy baseline signaling from pathological high-frequency or tumor-context signaling.
- Upgrade principle: Upgrade the molecule from static binding to state-dependent, feedback-gated modulation. Target 587-590 should be regulated by signal dynamics and environment, not geometry alone.

Required effects:
- Modulate the target's Communication + Feedback + Authority motif signature.
- Act through an allosteric/interface mechanism rather than direct orthosteric shutdown.
- Prefer reversible, tunable modulation over irreversible blockade.
- Bias the protein toward a recoverable inactive or open-loop regulatory state under excessive activation.

Smart modulator spec:
- Volatility trigger: Prefer state-dependent affinity that rises under pathological activation dynamics and remains weak in resting conformations.
- Downstream sensor: Add an environment-gated activation concept: the binding interface should be masked or weak at healthy extracellular pH and become exposed or stronger under tumor-like context such as lower pH or oxidative stress. This is a hypothesis specification, not a validated chemistry claim.
- Dual-gate logic: Engage only when both gates are satisfied: (1) target conformation indicates high-frequency/pathological activation and (2) local environment indicates disease-context stress. If either gate is absent, remain weakly binding or inactive.
- Candidate environmental gates: lower pH tumor microenvironment, elevated reactive oxygen species, protease-cleavable tumor-context linker, redox-sensitive steric shield

Prohibited effects:
- Do not directly lock the ATP/catalytic active site as the primary mechanism.
- Do not force a permanent terminal inactive state unless explicitly validated as selective.
- Do not disrupt unrelated housekeeping signaling without selectivity evidence.

Validation gates:
- Docking or generative model must return a pose and contact map, not only a molecule string.
- Contact map should overlap the target residue window or a justified adjacent regulatory interface.
- Predicted mechanism should modulate dimerization/interface signaling rather than ATP chemistry alone.
- Run selectivity checks against related kinases or receptor family members before claiming specificity.
- Treat all output as a hypothesis until validated by experimental structure, binding, signaling, and toxicity assays.

Generator prompt:

```text
Design-hypothesis contract for EGFR (Epidermal growth factor receptor).
Target region: residues 587-590.
Target annotation: Mutagenesis: Decreases intramolecular interactions and facilitates EGF binding..
Motif payload: Communication + Feedback + Authority.
Systems analogy: Circuit breaker (operations), similarity 0.7812.
Mechanistic intent: Open a reversible safety boundary when pathological feedback loops dominate.
Fidelity upgrade:
- Avoid static allosteric friction as the only mechanism.
- Prefer a context-aware smart modulator with feedback-like gating.
- Fidelity gap: The static wedge lacks an internal Feedback loop and therefore cannot distinguish healthy baseline signaling from pathological high-frequency or tumor-context signaling.
- Upgrade principle: Upgrade the molecule from static binding to state-dependent, feedback-gated modulation. Target 587-590 should be regulated by signal dynamics and environment, not geometry alone.
Smart modulator gates:
- Volatility trigger: Prefer state-dependent affinity that rises under pathological activation dynamics and remains weak in resting conformations.
- Downstream sensor: Add an environment-gated activation concept: the binding interface should be masked or weak at healthy extracellular pH and become exposed or stronger under tumor-like context such as lower pH or oxidative stress. This is a hypothesis specification, not a validated chemistry claim.
- Dual gate logic: Engage only when both gates are satisfied: (1) target conformation indicates high-frequency/pathological activation and (2) local environment indicates disease-context stress. If either gate is absent, remain weakly binding or inactive.
Geometry constraints:
- Prefer candidate binders near EGFR residues 587-590.
- Prefer interface-adjacent poses over catalytic active-site poses.
- Avoid poses whose primary contact map is dominated by orthosteric Transition residues.
- Prioritize contacts that can perturb Communication, Feedback, Authority, Boundary, or Modularity motifs.
Kinetic/structural constraints:
- Favor reversible inactive-state stabilization under excessive activation pressure.
- Avoid irreversible terminal-state traps unless validated as selective.
Return candidate molecules or binders only with predicted pose, contact map, and rationale. Do not claim therapeutic efficacy.
```

### 3. egfr_contract_3_debounce_filter_688_704

- Target: Region: Important for dimerization, phosphorylation and activation
- Residues: 688-704
- Bio motifs: Communication, Feedback, Authority, Modularity, Hierarchy
- Systems analogy: Debounce filter (0.6847)
- Intent: Suppress transient regulatory-interface activation while preserving sustained physiological signaling.
- Fidelity gap: The static wedge lacks an internal Feedback loop and therefore cannot distinguish healthy baseline signaling from pathological high-frequency or tumor-context signaling.
- Upgrade principle: Upgrade the molecule from passive friction to a context-aware kinetic filter. Target 688-704 should be regulated by signal dynamics and environment, not geometry alone.

Required effects:
- Modulate the target's Communication + Feedback + Authority + Modularity + Hierarchy motif signature.
- Act through an allosteric/interface mechanism rather than direct orthosteric shutdown.
- Prefer reversible, tunable modulation over irreversible blockade.
- Increase the persistence threshold required for productive dimer/interface activation.
- Filter noisy or transient contacts more strongly than sustained physiological contacts.

Smart modulator spec:
- Volatility trigger: Prefer high affinity for open/active or transition-like hinge conformations; avoid strong resting-state affinity. The hypothesized binder should require repeated or persistent interface exposure before stable engagement.
- Downstream sensor: Add an environment-gated activation concept: the binding interface should be masked or weak at healthy extracellular pH and become exposed or stronger under tumor-like context such as lower pH or oxidative stress. This is a hypothesis specification, not a validated chemistry claim.
- Dual-gate logic: Engage only when both gates are satisfied: (1) target conformation indicates high-frequency/pathological activation and (2) local environment indicates disease-context stress. If either gate is absent, remain weakly binding or inactive.
- Candidate environmental gates: lower pH tumor microenvironment, elevated reactive oxygen species, protease-cleavable tumor-context linker, redox-sensitive steric shield

Prohibited effects:
- Do not directly lock the ATP/catalytic active site as the primary mechanism.
- Do not force a permanent terminal inactive state unless explicitly validated as selective.
- Do not disrupt unrelated housekeeping signaling without selectivity evidence.

Validation gates:
- Docking or generative model must return a pose and contact map, not only a molecule string.
- Contact map should overlap the target residue window or a justified adjacent regulatory interface.
- Predicted mechanism should modulate dimerization/interface signaling rather than ATP chemistry alone.
- Run selectivity checks against related kinases or receptor family members before claiming specificity.
- Treat all output as a hypothesis until validated by experimental structure, binding, signaling, and toxicity assays.

Generator prompt:

```text
Design-hypothesis contract for EGFR (Epidermal growth factor receptor).
Target region: residues 688-704.
Target annotation: Region: Important for dimerization, phosphorylation and activation.
Motif payload: Communication + Feedback + Authority + Modularity + Hierarchy.
Systems analogy: Debounce filter (control systems), similarity 0.6847.
Mechanistic intent: Suppress transient regulatory-interface activation while preserving sustained physiological signaling.
Fidelity upgrade:
- Avoid static allosteric friction as the only mechanism.
- Prefer a context-aware smart modulator with feedback-like gating.
- Fidelity gap: The static wedge lacks an internal Feedback loop and therefore cannot distinguish healthy baseline signaling from pathological high-frequency or tumor-context signaling.
- Upgrade principle: Upgrade the molecule from passive friction to a context-aware kinetic filter. Target 688-704 should be regulated by signal dynamics and environment, not geometry alone.
Smart modulator gates:
- Volatility trigger: Prefer high affinity for open/active or transition-like hinge conformations; avoid strong resting-state affinity. The hypothesized binder should require repeated or persistent interface exposure before stable engagement.
- Downstream sensor: Add an environment-gated activation concept: the binding interface should be masked or weak at healthy extracellular pH and become exposed or stronger under tumor-like context such as lower pH or oxidative stress. This is a hypothesis specification, not a validated chemistry claim.
- Dual gate logic: Engage only when both gates are satisfied: (1) target conformation indicates high-frequency/pathological activation and (2) local environment indicates disease-context stress. If either gate is absent, remain weakly binding or inactive.
Geometry constraints:
- Prefer candidate binders near EGFR residues 688-704.
- Prefer interface-adjacent poses over catalytic active-site poses.
- Avoid poses whose primary contact map is dominated by orthosteric Transition residues.
- Prioritize contacts that can perturb Communication, Feedback, Authority, Boundary, or Modularity motifs.
Kinetic/structural constraints:
- Increase the time or persistence threshold for productive interface engagement.
- Avoid permanent locking; healthy sustained signaling should remain plausible.
- Prefer mechanisms that alter on/off kinetics at the interface rather than abolishing catalytic capability.
Return candidate molecules or binders only with predicted pose, contact map, and rationale. Do not claim therapeutic efficacy.
```

### 4. egfr_contract_4_circuit_breaker_1016_1016

- Target: Site: Important for interaction with PIK3C2B
- Residues: 1016-1016
- Bio motifs: Communication, Feedback, Authority
- Systems analogy: Circuit breaker (0.7812)
- Intent: Open a reversible safety boundary when pathological feedback loops dominate.
- Fidelity gap: The static wedge lacks an internal Feedback loop and therefore cannot distinguish healthy baseline signaling from pathological high-frequency or tumor-context signaling.
- Upgrade principle: Upgrade the molecule from static binding to state-dependent, feedback-gated modulation. Target 1016-1016 should be regulated by signal dynamics and environment, not geometry alone.

Required effects:
- Modulate the target's Communication + Feedback + Authority motif signature.
- Act through an allosteric/interface mechanism rather than direct orthosteric shutdown.
- Prefer reversible, tunable modulation over irreversible blockade.
- Bias the protein toward a recoverable inactive or open-loop regulatory state under excessive activation.

Smart modulator spec:
- Volatility trigger: Prefer state-dependent affinity that rises under pathological activation dynamics and remains weak in resting conformations.
- Downstream sensor: Add an environment-gated activation concept: the binding interface should be masked or weak at healthy extracellular pH and become exposed or stronger under tumor-like context such as lower pH or oxidative stress. This is a hypothesis specification, not a validated chemistry claim.
- Dual-gate logic: Engage only when both gates are satisfied: (1) target conformation indicates high-frequency/pathological activation and (2) local environment indicates disease-context stress. If either gate is absent, remain weakly binding or inactive.
- Candidate environmental gates: lower pH tumor microenvironment, elevated reactive oxygen species, protease-cleavable tumor-context linker, redox-sensitive steric shield

Prohibited effects:
- Do not directly lock the ATP/catalytic active site as the primary mechanism.
- Do not force a permanent terminal inactive state unless explicitly validated as selective.
- Do not disrupt unrelated housekeeping signaling without selectivity evidence.

Validation gates:
- Docking or generative model must return a pose and contact map, not only a molecule string.
- Contact map should overlap the target residue window or a justified adjacent regulatory interface.
- Predicted mechanism should modulate dimerization/interface signaling rather than ATP chemistry alone.
- Run selectivity checks against related kinases or receptor family members before claiming specificity.
- Treat all output as a hypothesis until validated by experimental structure, binding, signaling, and toxicity assays.

Generator prompt:

```text
Design-hypothesis contract for EGFR (Epidermal growth factor receptor).
Target region: residues 1016-1016.
Target annotation: Site: Important for interaction with PIK3C2B.
Motif payload: Communication + Feedback + Authority.
Systems analogy: Circuit breaker (operations), similarity 0.7812.
Mechanistic intent: Open a reversible safety boundary when pathological feedback loops dominate.
Fidelity upgrade:
- Avoid static allosteric friction as the only mechanism.
- Prefer a context-aware smart modulator with feedback-like gating.
- Fidelity gap: The static wedge lacks an internal Feedback loop and therefore cannot distinguish healthy baseline signaling from pathological high-frequency or tumor-context signaling.
- Upgrade principle: Upgrade the molecule from static binding to state-dependent, feedback-gated modulation. Target 1016-1016 should be regulated by signal dynamics and environment, not geometry alone.
Smart modulator gates:
- Volatility trigger: Prefer state-dependent affinity that rises under pathological activation dynamics and remains weak in resting conformations.
- Downstream sensor: Add an environment-gated activation concept: the binding interface should be masked or weak at healthy extracellular pH and become exposed or stronger under tumor-like context such as lower pH or oxidative stress. This is a hypothesis specification, not a validated chemistry claim.
- Dual gate logic: Engage only when both gates are satisfied: (1) target conformation indicates high-frequency/pathological activation and (2) local environment indicates disease-context stress. If either gate is absent, remain weakly binding or inactive.
Geometry constraints:
- Prefer candidate binders near EGFR residues 1016-1016.
- Prefer interface-adjacent poses over catalytic active-site poses.
- Avoid poses whose primary contact map is dominated by orthosteric Transition residues.
- Prioritize contacts that can perturb Communication, Feedback, Authority, Boundary, or Modularity motifs.
Kinetic/structural constraints:
- Favor reversible inactive-state stabilization under excessive activation pressure.
- Avoid irreversible terminal-state traps unless validated as selective.
Return candidate molecules or binders only with predicted pose, contact map, and rationale. Do not claim therapeutic efficacy.
```

### 5. egfr_contract_5_circuit_breaker_1016_1016

- Target: Mutagenesis: 50% decrease in interaction with PIK3C2B. 65% decrease in interaction with PIK3C2B; when associated with F-1197. Abolishes interaction with PIK3C2B; when associated with F-1197 and F-1092.
- Residues: 1016-1016
- Bio motifs: Communication, Feedback, Authority
- Systems analogy: Circuit breaker (0.7812)
- Intent: Open a reversible safety boundary when pathological feedback loops dominate.
- Fidelity gap: The static wedge lacks an internal Feedback loop and therefore cannot distinguish healthy baseline signaling from pathological high-frequency or tumor-context signaling.
- Upgrade principle: Upgrade the molecule from static binding to state-dependent, feedback-gated modulation. Target 1016-1016 should be regulated by signal dynamics and environment, not geometry alone.

Required effects:
- Modulate the target's Communication + Feedback + Authority motif signature.
- Act through an allosteric/interface mechanism rather than direct orthosteric shutdown.
- Prefer reversible, tunable modulation over irreversible blockade.
- Bias the protein toward a recoverable inactive or open-loop regulatory state under excessive activation.

Smart modulator spec:
- Volatility trigger: Prefer state-dependent affinity that rises under pathological activation dynamics and remains weak in resting conformations.
- Downstream sensor: Add an environment-gated activation concept: the binding interface should be masked or weak at healthy extracellular pH and become exposed or stronger under tumor-like context such as lower pH or oxidative stress. This is a hypothesis specification, not a validated chemistry claim.
- Dual-gate logic: Engage only when both gates are satisfied: (1) target conformation indicates high-frequency/pathological activation and (2) local environment indicates disease-context stress. If either gate is absent, remain weakly binding or inactive.
- Candidate environmental gates: lower pH tumor microenvironment, elevated reactive oxygen species, protease-cleavable tumor-context linker, redox-sensitive steric shield

Prohibited effects:
- Do not directly lock the ATP/catalytic active site as the primary mechanism.
- Do not force a permanent terminal inactive state unless explicitly validated as selective.
- Do not disrupt unrelated housekeeping signaling without selectivity evidence.

Validation gates:
- Docking or generative model must return a pose and contact map, not only a molecule string.
- Contact map should overlap the target residue window or a justified adjacent regulatory interface.
- Predicted mechanism should modulate dimerization/interface signaling rather than ATP chemistry alone.
- Run selectivity checks against related kinases or receptor family members before claiming specificity.
- Treat all output as a hypothesis until validated by experimental structure, binding, signaling, and toxicity assays.

Generator prompt:

```text
Design-hypothesis contract for EGFR (Epidermal growth factor receptor).
Target region: residues 1016-1016.
Target annotation: Mutagenesis: 50% decrease in interaction with PIK3C2B. 65% decrease in interaction with PIK3C2B; when associated with F-1197. Abolishes interaction with PIK3C2B; when associated with F-1197 and F-1092..
Motif payload: Communication + Feedback + Authority.
Systems analogy: Circuit breaker (operations), similarity 0.7812.
Mechanistic intent: Open a reversible safety boundary when pathological feedback loops dominate.
Fidelity upgrade:
- Avoid static allosteric friction as the only mechanism.
- Prefer a context-aware smart modulator with feedback-like gating.
- Fidelity gap: The static wedge lacks an internal Feedback loop and therefore cannot distinguish healthy baseline signaling from pathological high-frequency or tumor-context signaling.
- Upgrade principle: Upgrade the molecule from static binding to state-dependent, feedback-gated modulation. Target 1016-1016 should be regulated by signal dynamics and environment, not geometry alone.
Smart modulator gates:
- Volatility trigger: Prefer state-dependent affinity that rises under pathological activation dynamics and remains weak in resting conformations.
- Downstream sensor: Add an environment-gated activation concept: the binding interface should be masked or weak at healthy extracellular pH and become exposed or stronger under tumor-like context such as lower pH or oxidative stress. This is a hypothesis specification, not a validated chemistry claim.
- Dual gate logic: Engage only when both gates are satisfied: (1) target conformation indicates high-frequency/pathological activation and (2) local environment indicates disease-context stress. If either gate is absent, remain weakly binding or inactive.
Geometry constraints:
- Prefer candidate binders near EGFR residues 1016-1016.
- Prefer interface-adjacent poses over catalytic active-site poses.
- Avoid poses whose primary contact map is dominated by orthosteric Transition residues.
- Prioritize contacts that can perturb Communication, Feedback, Authority, Boundary, or Modularity motifs.
Kinetic/structural constraints:
- Favor reversible inactive-state stabilization under excessive activation pressure.
- Avoid irreversible terminal-state traps unless validated as selective.
Return candidate molecules or binders only with predicted pose, contact map, and rationale. Do not claim therapeutic efficacy.
```

### 6. egfr_contract_6_circuit_breaker_1009_1026

- Target: Lower-confidence flexible window 1009-1026
- Residues: 1009-1026
- Bio motifs: Communication, Feedback, Authority
- Systems analogy: Circuit breaker (0.7812)
- Intent: Open a reversible safety boundary when pathological feedback loops dominate.
- Fidelity gap: The static wedge lacks an internal Feedback loop and therefore cannot distinguish healthy baseline signaling from pathological high-frequency or tumor-context signaling.
- Upgrade principle: Upgrade the molecule from static binding to state-dependent, feedback-gated modulation. Target 1009-1026 should be regulated by signal dynamics and environment, not geometry alone.

Required effects:
- Modulate the target's Communication + Feedback + Authority motif signature.
- Act through an allosteric/interface mechanism rather than direct orthosteric shutdown.
- Prefer reversible, tunable modulation over irreversible blockade.
- Bias the protein toward a recoverable inactive or open-loop regulatory state under excessive activation.

Smart modulator spec:
- Volatility trigger: Prefer state-dependent affinity that rises under pathological activation dynamics and remains weak in resting conformations.
- Downstream sensor: Add an environment-gated activation concept: the binding interface should be masked or weak at healthy extracellular pH and become exposed or stronger under tumor-like context such as lower pH or oxidative stress. This is a hypothesis specification, not a validated chemistry claim.
- Dual-gate logic: Engage only when both gates are satisfied: (1) target conformation indicates high-frequency/pathological activation and (2) local environment indicates disease-context stress. If either gate is absent, remain weakly binding or inactive.
- Candidate environmental gates: lower pH tumor microenvironment, elevated reactive oxygen species, protease-cleavable tumor-context linker, redox-sensitive steric shield

Prohibited effects:
- Do not directly lock the ATP/catalytic active site as the primary mechanism.
- Do not force a permanent terminal inactive state unless explicitly validated as selective.
- Do not disrupt unrelated housekeeping signaling without selectivity evidence.

Validation gates:
- Docking or generative model must return a pose and contact map, not only a molecule string.
- Contact map should overlap the target residue window or a justified adjacent regulatory interface.
- Predicted mechanism should modulate dimerization/interface signaling rather than ATP chemistry alone.
- Run selectivity checks against related kinases or receptor family members before claiming specificity.
- Treat all output as a hypothesis until validated by experimental structure, binding, signaling, and toxicity assays.

Generator prompt:

```text
Design-hypothesis contract for EGFR (Epidermal growth factor receptor).
Target region: residues 1009-1026.
Target annotation: Lower-confidence flexible window 1009-1026.
Motif payload: Communication + Feedback + Authority.
Systems analogy: Circuit breaker (operations), similarity 0.7812.
Mechanistic intent: Open a reversible safety boundary when pathological feedback loops dominate.
Fidelity upgrade:
- Avoid static allosteric friction as the only mechanism.
- Prefer a context-aware smart modulator with feedback-like gating.
- Fidelity gap: The static wedge lacks an internal Feedback loop and therefore cannot distinguish healthy baseline signaling from pathological high-frequency or tumor-context signaling.
- Upgrade principle: Upgrade the molecule from static binding to state-dependent, feedback-gated modulation. Target 1009-1026 should be regulated by signal dynamics and environment, not geometry alone.
Smart modulator gates:
- Volatility trigger: Prefer state-dependent affinity that rises under pathological activation dynamics and remains weak in resting conformations.
- Downstream sensor: Add an environment-gated activation concept: the binding interface should be masked or weak at healthy extracellular pH and become exposed or stronger under tumor-like context such as lower pH or oxidative stress. This is a hypothesis specification, not a validated chemistry claim.
- Dual gate logic: Engage only when both gates are satisfied: (1) target conformation indicates high-frequency/pathological activation and (2) local environment indicates disease-context stress. If either gate is absent, remain weakly binding or inactive.
Geometry constraints:
- Prefer candidate binders near EGFR residues 1009-1026.
- Prefer interface-adjacent poses over catalytic active-site poses.
- Avoid poses whose primary contact map is dominated by orthosteric Transition residues.
- Prioritize contacts that can perturb Communication, Feedback, Authority, Boundary, or Modularity motifs.
Kinetic/structural constraints:
- Favor reversible inactive-state stabilization under excessive activation pressure.
- Avoid irreversible terminal-state traps unless validated as selective.
Return candidate molecules or binders only with predicted pose, contact map, and rationale. Do not claim therapeutic efficacy.
```

### 7. egfr_contract_7_circuit_breaker_1172_1172

- Target: Mutagenesis: No change in interaction with PIK3C2B.
- Residues: 1172-1172
- Bio motifs: Communication, Feedback, Authority
- Systems analogy: Circuit breaker (0.7812)
- Intent: Open a reversible safety boundary when pathological feedback loops dominate.
- Fidelity gap: The static wedge lacks an internal Feedback loop and therefore cannot distinguish healthy baseline signaling from pathological high-frequency or tumor-context signaling.
- Upgrade principle: Upgrade the molecule from static binding to state-dependent, feedback-gated modulation. Target 1172-1172 should be regulated by signal dynamics and environment, not geometry alone.

Required effects:
- Modulate the target's Communication + Feedback + Authority motif signature.
- Act through an allosteric/interface mechanism rather than direct orthosteric shutdown.
- Prefer reversible, tunable modulation over irreversible blockade.
- Bias the protein toward a recoverable inactive or open-loop regulatory state under excessive activation.

Smart modulator spec:
- Volatility trigger: Prefer state-dependent affinity that rises under pathological activation dynamics and remains weak in resting conformations.
- Downstream sensor: Add an environment-gated activation concept: the binding interface should be masked or weak at healthy extracellular pH and become exposed or stronger under tumor-like context such as lower pH or oxidative stress. This is a hypothesis specification, not a validated chemistry claim.
- Dual-gate logic: Engage only when both gates are satisfied: (1) target conformation indicates high-frequency/pathological activation and (2) local environment indicates disease-context stress. If either gate is absent, remain weakly binding or inactive.
- Candidate environmental gates: lower pH tumor microenvironment, elevated reactive oxygen species, protease-cleavable tumor-context linker, redox-sensitive steric shield

Prohibited effects:
- Do not directly lock the ATP/catalytic active site as the primary mechanism.
- Do not force a permanent terminal inactive state unless explicitly validated as selective.
- Do not disrupt unrelated housekeeping signaling without selectivity evidence.

Validation gates:
- Docking or generative model must return a pose and contact map, not only a molecule string.
- Contact map should overlap the target residue window or a justified adjacent regulatory interface.
- Predicted mechanism should modulate dimerization/interface signaling rather than ATP chemistry alone.
- Run selectivity checks against related kinases or receptor family members before claiming specificity.
- Treat all output as a hypothesis until validated by experimental structure, binding, signaling, and toxicity assays.

Generator prompt:

```text
Design-hypothesis contract for EGFR (Epidermal growth factor receptor).
Target region: residues 1172-1172.
Target annotation: Mutagenesis: No change in interaction with PIK3C2B..
Motif payload: Communication + Feedback + Authority.
Systems analogy: Circuit breaker (operations), similarity 0.7812.
Mechanistic intent: Open a reversible safety boundary when pathological feedback loops dominate.
Fidelity upgrade:
- Avoid static allosteric friction as the only mechanism.
- Prefer a context-aware smart modulator with feedback-like gating.
- Fidelity gap: The static wedge lacks an internal Feedback loop and therefore cannot distinguish healthy baseline signaling from pathological high-frequency or tumor-context signaling.
- Upgrade principle: Upgrade the molecule from static binding to state-dependent, feedback-gated modulation. Target 1172-1172 should be regulated by signal dynamics and environment, not geometry alone.
Smart modulator gates:
- Volatility trigger: Prefer state-dependent affinity that rises under pathological activation dynamics and remains weak in resting conformations.
- Downstream sensor: Add an environment-gated activation concept: the binding interface should be masked or weak at healthy extracellular pH and become exposed or stronger under tumor-like context such as lower pH or oxidative stress. This is a hypothesis specification, not a validated chemistry claim.
- Dual gate logic: Engage only when both gates are satisfied: (1) target conformation indicates high-frequency/pathological activation and (2) local environment indicates disease-context stress. If either gate is absent, remain weakly binding or inactive.
Geometry constraints:
- Prefer candidate binders near EGFR residues 1172-1172.
- Prefer interface-adjacent poses over catalytic active-site poses.
- Avoid poses whose primary contact map is dominated by orthosteric Transition residues.
- Prioritize contacts that can perturb Communication, Feedback, Authority, Boundary, or Modularity motifs.
Kinetic/structural constraints:
- Favor reversible inactive-state stabilization under excessive activation pressure.
- Avoid irreversible terminal-state traps unless validated as selective.
Return candidate molecules or binders only with predicted pose, contact map, and rationale. Do not claim therapeutic efficacy.
```

### 8. egfr_contract_8_circuit_breaker_1068_1068

- Target: Mutagenesis: Strongly decreases interaction with CBLC.
- Residues: 1068-1068
- Bio motifs: Communication, Feedback, Authority
- Systems analogy: Circuit breaker (0.7812)
- Intent: Open a reversible safety boundary when pathological feedback loops dominate.
- Fidelity gap: The static wedge lacks an internal Feedback loop and therefore cannot distinguish healthy baseline signaling from pathological high-frequency or tumor-context signaling.
- Upgrade principle: Upgrade the molecule from static binding to state-dependent, feedback-gated modulation. Target 1068-1068 should be regulated by signal dynamics and environment, not geometry alone.

Required effects:
- Modulate the target's Communication + Feedback + Authority motif signature.
- Act through an allosteric/interface mechanism rather than direct orthosteric shutdown.
- Prefer reversible, tunable modulation over irreversible blockade.
- Bias the protein toward a recoverable inactive or open-loop regulatory state under excessive activation.

Smart modulator spec:
- Volatility trigger: Prefer state-dependent affinity that rises under pathological activation dynamics and remains weak in resting conformations.
- Downstream sensor: Add an environment-gated activation concept: the binding interface should be masked or weak at healthy extracellular pH and become exposed or stronger under tumor-like context such as lower pH or oxidative stress. This is a hypothesis specification, not a validated chemistry claim.
- Dual-gate logic: Engage only when both gates are satisfied: (1) target conformation indicates high-frequency/pathological activation and (2) local environment indicates disease-context stress. If either gate is absent, remain weakly binding or inactive.
- Candidate environmental gates: lower pH tumor microenvironment, elevated reactive oxygen species, protease-cleavable tumor-context linker, redox-sensitive steric shield

Prohibited effects:
- Do not directly lock the ATP/catalytic active site as the primary mechanism.
- Do not force a permanent terminal inactive state unless explicitly validated as selective.
- Do not disrupt unrelated housekeeping signaling without selectivity evidence.

Validation gates:
- Docking or generative model must return a pose and contact map, not only a molecule string.
- Contact map should overlap the target residue window or a justified adjacent regulatory interface.
- Predicted mechanism should modulate dimerization/interface signaling rather than ATP chemistry alone.
- Run selectivity checks against related kinases or receptor family members before claiming specificity.
- Treat all output as a hypothesis until validated by experimental structure, binding, signaling, and toxicity assays.

Generator prompt:

```text
Design-hypothesis contract for EGFR (Epidermal growth factor receptor).
Target region: residues 1068-1068.
Target annotation: Mutagenesis: Strongly decreases interaction with CBLC..
Motif payload: Communication + Feedback + Authority.
Systems analogy: Circuit breaker (operations), similarity 0.7812.
Mechanistic intent: Open a reversible safety boundary when pathological feedback loops dominate.
Fidelity upgrade:
- Avoid static allosteric friction as the only mechanism.
- Prefer a context-aware smart modulator with feedback-like gating.
- Fidelity gap: The static wedge lacks an internal Feedback loop and therefore cannot distinguish healthy baseline signaling from pathological high-frequency or tumor-context signaling.
- Upgrade principle: Upgrade the molecule from static binding to state-dependent, feedback-gated modulation. Target 1068-1068 should be regulated by signal dynamics and environment, not geometry alone.
Smart modulator gates:
- Volatility trigger: Prefer state-dependent affinity that rises under pathological activation dynamics and remains weak in resting conformations.
- Downstream sensor: Add an environment-gated activation concept: the binding interface should be masked or weak at healthy extracellular pH and become exposed or stronger under tumor-like context such as lower pH or oxidative stress. This is a hypothesis specification, not a validated chemistry claim.
- Dual gate logic: Engage only when both gates are satisfied: (1) target conformation indicates high-frequency/pathological activation and (2) local environment indicates disease-context stress. If either gate is absent, remain weakly binding or inactive.
Geometry constraints:
- Prefer candidate binders near EGFR residues 1068-1068.
- Prefer interface-adjacent poses over catalytic active-site poses.
- Avoid poses whose primary contact map is dominated by orthosteric Transition residues.
- Prioritize contacts that can perturb Communication, Feedback, Authority, Boundary, or Modularity motifs.
Kinetic/structural constraints:
- Favor reversible inactive-state stabilization under excessive activation pressure.
- Avoid irreversible terminal-state traps unless validated as selective.
Return candidate molecules or binders only with predicted pose, contact map, and rationale. Do not claim therapeutic efficacy.
```

## Safety Boundary

- These are executable design specifications for downstream computational chemistry workflows.
- They should be evaluated with docking, contact maps, selectivity screens, structural biology, signaling assays, and toxicity assays.
- No medical, clinical, or therapeutic claim follows from this contract alone.
