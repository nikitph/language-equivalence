# DLR-lambda Loghub Experiment

## Objective

Demonstrate synergy between lambda-RLM-style typed recursive control and DLR ProcessIR diagnosis on a real Loghub Linux log substrate. The experiment uses deterministic SPLIT/MAP/FILTER/REDUCE control over noisy logs, with DLR ProcessIR as the composed semantic target.

## Dataset

- Source: [logpai/loghub Linux_2k.log](https://raw.githubusercontent.com/logpai/loghub/master/Linux/Linux_2k.log)
- Background: real Linux log lines from Loghub.
- Incident: five synthetic DLR_LAMBDA evidence lines injected across distant chunks to create a gold hidden stale-policy failure.
- Total lines after injection: 2005
- Chunk size: 350
- Number of chunks: 6

## Lambda-style Execution Plan

```text
SPLIT(log_lines, chunk_size=350)
MAP(parse_chunk_to_event_frames)
FILTER(relevant_incident_frames)
REDUCE(infer_latent_conditions + merge_causal_graph)
OUTPUT(ProcessIR + prescription)
```

## Distributed Evidence

| Line | Evidence |
| ---: | --- |
| 121 | `Mar 10 10:00:00 labhost policyd[4100]: DLR_LAMBDA incident=refund-42 config cache_ttl_seconds=1800 policy_source=local-cache invariant=current-policy-required` |
| 482 | `Mar 10 10:04:00 labhost policyd[4100]: DLR_LAMBDA incident=refund-42 authority policy_version=v18 changed rule=manager_review_required source=primary-policy` |
| 953 | `Mar 10 10:05:00 labhost worker[9931]: DLR_LAMBDA incident=refund-42 local_success approved_refund=R-913 using_policy_version=v17 cache_age_seconds=300 terminal_report=approved` |
| 1304 | `Mar 10 10:06:00 labhost audit[2201]: DLR_LAMBDA incident=refund-42 invariant_violation refund=R-913 expected_policy=v18 observed_policy=v17 missing=manager_review` |
| 1705 | `Mar 10 10:09:00 labhost finance[1180]: DLR_LAMBDA incident=refund-42 global_failure settlement_blocked refund=R-913 reason=approval_not_terminal_valid` |

## Scores

| System | Pass | Confidence | Event recall | Latent recall | Edge recall | Root cause | False terminal | Local/global | Prescription |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |
| Direct first-window DLR parser | FAIL | 0.8600 | 0.0000 | 0.0000 | 0.0000 | 0.0000 | no | no | yes |
| Naive chunk event merge without latent reduce | FAIL | 0.7800 | 1.0000 | 0.0000 | 0.6667 | 0.0000 | yes | yes | yes |
| DLR-lambda Loghub ProcessIR | PASS | 0.8600 | 1.0000 | 1.0000 | 1.0000 | 1.0000 | yes | yes | yes |

## Predicted ProcessIR

### Event Frames

| Frame | Role | Source line | Local | Global |
| --- | --- | ---: | --- | --- |
| refund_approved_false_terminal | false_terminal | 953 | success | misleads |
| manager_review_missing | invariant_violation | 1304 | failure | violates |
| settlement_blocked | terminal_outcome | 1705 | blocked | blocks |

### Latent Conditions

| Latent | Motif | Inferred from | Description |
| --- | --- | --- | --- |
| lc_stale_policy_cache | Representation | cache_ttl_config, policy_update_v18, refund_approved_false_terminal, manager_review_missing | Worker approved refund using cached policy v17 after authoritative policy changed to v18. |

### Causal Graph

| From | Edge | To |
| --- | --- | --- |
| lc_stale_policy_cache | stales | refund_approved_false_terminal |
| refund_approved_false_terminal | violates | manager_review_missing |
| manager_review_missing | fails_downstream | settlement_blocked |

## Prescription

- Invalidate policy caches on authoritative policy update.
- Require policy version freshness before refund approval.
- Treat local approval as pending until audit and settlement invariants reconcile.

## Why This Demonstrates Synergy

- Lambda-style control solves the scale/control problem: evidence can be split and processed in bounded chunks with deterministic composition.
- DLR solves the semantic target problem: the reduction output is not prose, but a ProcessIR with false terminals, latent representation failure, causal edges, root cause, and prescription.
- The direct first-window baseline sees only the TTL/config evidence and fails to diagnose the incident.
- The naive chunk event merge sees later event frames but misses the latent stale-representation root cause because it lacks the REDUCE step over latent evidence.

## Loghub Citation Note

Loghub is a public collection of system log datasets for AI-driven log analytics research. If this experiment is used in a paper, cite the Loghub dataset papers listed in the upstream repository.
