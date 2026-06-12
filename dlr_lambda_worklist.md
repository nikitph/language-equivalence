# DLR-lambda-2 Worklist/Fixpoint Experiment

## Objective

Test whether DLR-lambda should be treated as a batch MapReduce skeleton or as a typed investigative worklist/fixpoint calculus. The incident is designed so a later follow-up fact changes the meaning of earlier evidence.

## Dataset

- Source: [logpai/loghub Linux_2k.log](https://raw.githubusercontent.com/logpai/loghub/master/Linux/Linux_2k.log)
- Background: real Linux log lines from Loghub.
- Incident: seven marker-free synthetic lines injected into the noisy log substrate.
- Total lines after injection: 2007
- Chunk size: 320
- Number of chunks: 7

## Execution Plans

```text
MapReduce: SPLIT -> MAP primary facts -> REDUCE once -> ProcessIR
Worklist: INGEST -> EXTRACT -> JOIN -> SCHEDULE follow-up -> RECONCILE -> FIXPOINT -> VERIFY -> ProcessIR
```

## Distributed Evidence

| Line | Evidence |
| ---: | --- |
| 117 | `Mar 10 11:00:00 labhost policyd[4100]: refund=R-914 cache ttl=1800s source=local-cache invariant=current-policy-before-terminal-approval` |
| 444 | `Mar 10 11:04:00 labhost policyd[4100]: refund policy changed to version v18 rule=manager_review_required unless active_vip_exemption` |
| 809 | `Mar 10 11:05:00 labhost worker[9931]: approved refund=R-914 using policy version v17 terminal=approved exemption=EX-77` |
| 1044 | `Mar 10 11:05:20 labhost entitlements[2404]: vip exemption EX-77 asserted for refund=R-914 customer=C-82 status=claimed` |
| 1377 | `Mar 10 11:03:00 labhost entitlements[2404]: exemption EX-77 expired at 11:03 before approval for customer=C-82` |
| 1600 | `Mar 10 11:06:00 labhost audit[2201]: refund=R-914 invariant violation expected=v18 observed=v17 manager_review=missing exemption=EX-77` |
| 1817 | `Mar 10 11:09:00 labhost finance[1180]: settlement blocked refund=R-914 reason=approval_not_terminal_valid` |

## Scores

| System | Pass | Confidence | Event recall | Latent recall | Edge recall | Root cause | Contradiction | Revision | Coverage | False terminal |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- | ---: | --- |
| One-pass MapReduce DLR-lambda | FAIL | 0.6200 | 1.0000 | 0.5000 | 0.8333 | 0.5000 | no | no | 0.6667 | no |
| Worklist/fixpoint DLR-lambda | PASS | 0.8800 | 1.0000 | 1.0000 | 1.0000 | 1.0000 | yes | yes | 1.0000 | yes |

## Worklist Trace

| Step | Action | Discovered | Scheduled | Revised hypotheses |
| ---: | --- | --- | --- | --- |
| 1 | scan_chunk:1:320 | cache_config_c5feee96 | - | - |
| 2 | scan_chunk:321:640 | policy_update_392ba32c | - | - |
| 3 | scan_chunk:641:960 | approval_c9a2e518 | follow_exemption_EX-77, verify_terminal_refund_R-914 | - |
| 4 | scan_chunk:961:1280 | vip_exemption_claim_2d6ffd63 | - | stale_policy_hypothesis_temporarily_weakened_by_vip_claim |
| 5 | scan_chunk:1281:1600 | audit_violation_fe5d0f2c | - | stale_policy_hypothesis_temporarily_weakened_by_vip_claim |
| 6 | scan_chunk:1601:1920 | settlement_blocked_17f2b974 | - | stale_policy_hypothesis_temporarily_weakened_by_vip_claim |
| 7 | scan_chunk:1921:2007 | - | - | stale_policy_hypothesis_temporarily_weakened_by_vip_claim |
| 8 | follow_exemption:EX-77 | vip_exemption_expired_1f649bb8 | - | vip_exemption_claim_revised_to_invalid |
| 9 | verify_terminal:R-914 | - | - | vip_exemption_claim_revised_to_invalid |

## Gold vs Predictions

- Gold root causes: lc_stale_policy_representation, lc_expired_vip_exemption
- MapReduce root causes: lc_stale_policy_representation
- Worklist root causes: lc_stale_policy_representation, lc_expired_vip_exemption
- MapReduce coverage gaps: exemption_validity_not_followed
- Worklist coverage gaps: none

## Interpretation

The one-pass reducer recovers primary facts but treats the VIP exemption claim as if it settled the contradiction. It does not schedule the exemption-validity join, so it misses the latent expired-exemption condition and under-detects the false terminal.

The worklist/fixpoint controller treats the exemption claim as an obligation. It schedules a follow-up search, finds the expiration evidence, revises the hypothesis, verifies audit and settlement outcomes, and emits the full ProcessIR.

## Conclusion

MapReduce is a useful DLR-lambda execution plan when evidence is independent and reduction is mostly associative. This experiment supports the stronger abstraction: DLR-lambda is better modeled as typed recursive control over an evidence graph with joins, reconciliation, scheduling, fixpoint iteration, and coverage verification.
