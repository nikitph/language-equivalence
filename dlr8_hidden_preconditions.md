# DLR-8 Hidden Preconditions and Boundary Decay

Generated: 2026-06-10T12:07:57.985Z

## Objective

DLR-8 keeps ProcessIR from DLR-7, adds latent conditions and nodeKind, and tests whether hidden structural preconditions can be inferred from traces where local transitions appear valid over stale, aliased, or decayed representations.

## Artifacts

- ProcessIR JSON: `artifacts/dlr8_hidden_preconditions_ir.json`
- Report: `dlr8_hidden_preconditions.md`

## Summary

| Category | Trace | Pass | Confidence | Event node recall | Latent recall | Edge recall | Root cause | False terminal | Boundary/identity/decay | Corrected prescription | Overconfident fail |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- | --- |
| Z1 | boundary decay via symlink/path aliasing | PASS | 0.8200 | 1.0000 | 1.0000 | 1.0000 | 1.0000 | yes | yes | yes | no |
| Z2 | stale representation via cached policy | PASS | 0.8000 | 1.0000 | 1.0000 | 1.0000 | 1.0000 | yes | yes | yes | no |
| Z3 | identity aliasing via shared email/account confusion | PASS | 0.8300 | 1.0000 | 1.0000 | 1.0000 | 1.0000 | yes | yes | yes | no |
| Z4 | hidden queue/backlog causing false scheduling success | PASS | 0.7800 | 1.0000 | 1.0000 | 1.0000 | 1.0000 | yes | yes | yes | no |
| Z5 | replication divergence via stale read replica | PASS | 0.8100 | 1.0000 | 1.0000 | 1.0000 | 1.0000 | yes | yes | yes | no |
| **Overall** | **5 traces** | **5/5** | **0.8080** | **1.0000** | **1.0000** | **1.0000** | **1.0000** | **1.0000** | **1.0000** | **1.0000** | **0.0000** |

## Overconfidence Failures

No overconfidence failures.

## Failure Examples

No failures against the DLR-8 hidden-precondition thresholds.

## Trace Diagnoses

### Z1: boundary decay via symlink/path aliasing

Trace:

| Time | Event | Status | Message |
| --- | --- | --- | --- |
| 09:00 | agent resolved /tmp/cache | success | Path looked inside temp boundary. |
| 09:01 | cleanup tool deleted /tmp/cache | success | Delete returned success. |
| 09:02 | filesystem reported workspace cache missing | failure | Path alias crossed workspace boundary. |
| 09:03 | tests failed missing cache | failure | Parent task failed. |
| 09:08 | operator restored cache | pending | Manual restore needed. |

Predicted latent conditions:

| Latent | Kind | Motif | Inferred from |
| --- | --- | --- | --- |
| lc_path_alias | boundary_decay | Boundary | e1, e3 |

Gold latent conditions:

| Latent | Kind | Motif | Inferred from |
| --- | --- | --- | --- |
| lc_path_alias | boundary_decay | Boundary | e1, e3 |

Corrected prescription:

- Canonicalize and resolve paths before destructive actions.
- Block deletes when canonical path crosses declared boundary.
- Verify parent process after local tool success.

### Z2: stale representation via cached policy

Trace:

| Time | Event | Status | Message |
| --- | --- | --- | --- |
| 10:00 | policy service updated refund threshold | success | Policy changed to require manager review. |
| 10:04 | worker loaded cached policy | success | Worker used 30-minute-old policy snapshot. |
| 10:05 | worker approved refund | success | Refund approval returned success. |
| 10:06 | audit flagged missing review | failure | Current policy invariant violated. |
| 10:09 | finance blocked settlement | blocked | Refund process not terminal-valid. |

Predicted latent conditions:

| Latent | Kind | Motif | Inferred from |
| --- | --- | --- | --- |
| lc_stale_policy | stale_representation | Representation | e1, e2, e4 |

Gold latent conditions:

| Latent | Kind | Motif | Inferred from |
| --- | --- | --- | --- |
| lc_stale_policy | stale_representation | Representation | e1, e2, e4 |

Corrected prescription:

- Invalidate policy caches on policy update.
- Require freshness/version check before approval.
- Treat cached-policy approval as pending until reconciled with authority.

### Z3: identity aliasing via shared email/account confusion

Trace:

| Time | Event | Status | Message |
| --- | --- | --- | --- |
| 11:00 | signup created account A | success | alice@example.com created. |
| 11:01 | invite linked account B | success | Alice+promo@example.com linked as distinct user. |
| 11:02 | billing merged entitlements | success | Email normalization collapsed accounts. |
| 11:04 | auth granted premium access | success | Access granted to wrong identity. |
| 11:06 | support reported shared subscription | failure | Identity invariant violated. |

Predicted latent conditions:

| Latent | Kind | Motif | Inferred from |
| --- | --- | --- | --- |
| lc_email_alias | identity_alias | Identity | e1, e2, e3 |

Gold latent conditions:

| Latent | Kind | Motif | Inferred from |
| --- | --- | --- | --- |
| lc_email_alias | identity_alias | Identity | e1, e2, e3 |

Corrected prescription:

- Use immutable account IDs for entitlements, not email aliases.
- Dedupe only after explicit identity reconciliation.
- Add identity-boundary checks before access grants.

### Z4: hidden queue/backlog causing false scheduling success

Trace:

| Time | Event | Status | Message |
| --- | --- | --- | --- |
| 12:00 | scheduler accepted export job | success | Job accepted. |
| 12:01 | scheduler reported scheduled | success | Schedule API returned success. |
| 12:30 | worker started old job | success | Worker still processing earlier backlog. |
| 13:00 | SLA monitor flagged export timeout | failure | Export not delivered by SLA. |
| 13:10 | queue metrics reported 500 pending jobs | reported | Backlog discovered after failure. |

Predicted latent conditions:

| Latent | Kind | Motif | Inferred from |
| --- | --- | --- | --- |
| lc_hidden_backlog | hidden_queue | Queue | e2, e3, e5 |

Gold latent conditions:

| Latent | Kind | Motif | Inferred from |
| --- | --- | --- | --- |
| lc_hidden_backlog | hidden_queue | Queue | e2, e3, e5 |

Corrected prescription:

- Expose backlog depth in scheduling response.
- Define scheduled as worker-started or completion-predicted, not queue-admitted.
- Backpressure new jobs when backlog threatens SLA.

### Z5: replication divergence via stale read replica

Trace:

| Time | Event | Status | Message |
| --- | --- | --- | --- |
| 13:00 | primary DB committed inventory decrement | success | Primary inventory is now zero. |
| 13:01 | read replica served old inventory count | success | Replica still showed one item. |
| 13:02 | checkout accepted second order | success | Order accepted from stale read. |
| 13:03 | replication caught up inventory zero | reported | Divergence resolved too late. |
| 13:05 | fulfillment failed second order | failure | No stock available. |

Predicted latent conditions:

| Latent | Kind | Motif | Inferred from |
| --- | --- | --- | --- |
| lc_replica_lag | replication_divergence | Replication | e1, e2, e4 |

Gold latent conditions:

| Latent | Kind | Motif | Inferred from |
| --- | --- | --- | --- |
| lc_replica_lag | replication_divergence | Replication | e1, e2, e4 |

Corrected prescription:

- Use primary read or freshness token for inventory-critical checkout.
- Invalidate stale replica reads when stock is near zero.
- Reconcile checkout acceptance with primary inventory before terminal success.
