# DLR-lambda-3 Motif Obligation Calculus

## Objective

Test whether DLR-lambda terminal validity should be governed by explicit motif obligations rather than worklist exhaustion alone. DLR-lambda-3 treats certain facts as obligation-generators and requires each mandatory obligation to become satisfied, violated, or explicitly unknown under budget.

## Spectrum Position

- DLR-lambda-1: distributed evidence composition with MapReduce.
- DLR-lambda-2: meaning revision with typed worklist/fixpoint control.
- DLR-lambda-3: terminal validity with a motif obligation ledger.

## Dataset

- Source: [logpai/loghub Linux_2k.log](https://raw.githubusercontent.com/logpai/loghub/master/Linux/Linux_2k.log)
- Background: real Linux log lines from Loghub.
- Incident: seven marker-free synthetic lines injected into the noisy log substrate.
- Total lines after injection: 2007
- Chunk size: 300
- Number of chunks: 7

## Distributed Evidence

| Line | Evidence |
| ---: | --- |
| 91 | `Mar 10 12:00:00 labhost policyd[4100]: refund=R-915 cache ttl=1800s source=local-cache invariant=current-policy-before-terminal-approval` |
| 368 | `Mar 10 12:01:00 labhost policyd[4100]: authority source=primary-policy refund-policy version=v18 rule=manager_review_required unless active_vip_exemption` |
| 705 | `Mar 10 12:05:00 labhost worker[9931]: terminal=approved refund=R-915 using_policy_version=v17 exemption=EX-91 authority=local-cache` |
| 990 | `Mar 10 12:05:20 labhost entitlements[2404]: exemption=EX-91 claimed refund=R-915 customer=C-91 status=claimed` |
| 1249 | `Mar 10 12:03:00 labhost entitlements[2404]: exemption=EX-91 expired_at=12:03 before approval customer=C-91` |
| 1502 | `Mar 10 12:06:00 labhost audit[2201]: refund=R-915 invariant_violation expected_policy=v18 observed_policy=v17 manager_review=missing exemption=EX-91` |
| 1765 | `Mar 10 12:09:00 labhost finance[1180]: settlement_blocked refund=R-915 reason=approval_not_terminal_valid` |

## Scores

| System | Pass | Confidence | Obligation recall | Precision | Status accuracy | Search recall | Terminal valid | Unknown handling | Root cause |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- | ---: |
| Worklist/fixpoint without obligation ledger | FAIL | 0.6400 | 0.0000 | 0.0000 | 0.0000 | 0.0000 | no | yes | 1.0000 |
| DLR-lambda-3 obligation calculus | PASS | 0.9100 | 1.0000 | 1.0000 | 1.0000 | 1.0000 | yes | yes | 1.0000 |

## Obligation Ledger

| Obligation | Type | Status | Triggered by | Resolved by | Scheduled searches |
| --- | --- | --- | --- | --- | --- |
| validate_authority_refund_policy_v18 | validate_authority | satisfied | policy_update_05820d5a | authority_source_2f96cf5a | - |
| validate_exemption_EX-91 | validate_exemption | violated | approval_c2c3acac | exemption_claim_a9409db5, exemption_expired_b4d81fac | search_exemption_EX-91 |
| validate_freshness_approval_policy_version | validate_freshness | violated | approval_c2c3acac | policy_update_05820d5a | - |
| validate_freshness_policy_cache | validate_freshness | violated | cache_config_c6c07af6 | policy_update_05820d5a | search_authoritative_policy_version |
| validate_invariant_manager_review_invariant | validate_invariant | violated | audit_violation_c24daeac | policy_update_05820d5a, approval_c2c3acac | - |
| validate_reconciliation_settlement_reconciliation | validate_reconciliation | satisfied | settlement_blocked_68e593b3 | audit_violation_c24daeac | - |
| validate_terminal_state_approval_terminal_state | validate_terminal_state | violated | approval_c2c3acac | audit_violation_c24daeac, settlement_blocked_68e593b3 | search_terminal_R-915 |

## Obligation Trace

| Step | Action | Facts | Opened obligations | Resolved obligations | Scheduled searches |
| ---: | --- | --- | --- | --- | --- |
| 1 | scan_chunk:1:300 | cache_config_c6c07af6 | validate_freshness_policy_cache | - | search_authoritative_policy_version |
| 2 | scan_chunk:301:600 | authority_source_2f96cf5a, policy_update_05820d5a | validate_authority_refund_policy_v18 | validate_freshness_policy_cache:satisfied | - |
| 3 | scan_chunk:601:900 | approval_c2c3acac | validate_freshness_approval_policy_version, validate_terminal_state_approval_terminal_state, validate_exemption_EX-91 | validate_freshness_policy_cache:violated | search_terminal_R-915, search_exemption_EX-91 |
| 4 | scan_chunk:901:1200 | exemption_claim_a9409db5 | - | validate_exemption_EX-91:satisfied | - |
| 6 | scan_chunk:1501:1800 | audit_violation_c24daeac, settlement_blocked_68e593b3 | validate_invariant_manager_review_invariant, validate_reconciliation_settlement_reconciliation | validate_terminal_state_approval_terminal_state:violated | - |
| 10 | search_exemption:EX-91 | exemption_expired_b4d81fac | - | validate_exemption_EX-91:violated | - |

## Gold vs Predictions

- Gold terminal validity: invalid
- Worklist-only terminal validity: valid
- Obligation-calculus terminal validity: invalid
- Gold obligations: validate_freshness_policy_cache:violated, validate_authority_refund_policy_v18:satisfied, validate_freshness_approval_policy_version:violated, validate_terminal_state_approval_terminal_state:violated, validate_exemption_EX-91:violated, validate_invariant_manager_review_invariant:violated, validate_reconciliation_settlement_reconciliation:satisfied
- Worklist-only obligations: none

## Interpretation

The worklist/fixpoint controller can recover the causal graph, but without an explicit obligation ledger it cannot prove why the terminal state is invalid or which structural checks were discharged. DLR-lambda-3 makes those checks first-class.

The core rule is: facts such as cached representations, exemption claims, authority assertions, and terminal success reports are not merely evidence. They generate motif obligations. ProcessIR is terminal-valid only after mandatory obligations are satisfied, violated, or explicitly unknown.
