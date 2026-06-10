# DLR-7 Trace-to-Causal-IR Diagnosis

Generated: 2026-06-10T12:03:21.320Z

## Objective

DLR-7 diagnoses synthetic multi-event traces instead of single utterances. The main success criterion is detecting local subsystem success reports that do not constitute a valid terminal state for the parent process.

## Artifacts

- ProcessIR JSON: `artifacts/dlr7_trace_to_causal_ir.json`
- Report: `dlr7_trace_to_causal_ir.md`

## Summary

| Category | Trace | Pass | Confidence | Node recall | Edge recall | Root cause | False terminal | Local/global | Invariant/authority | Prescription | Overconfident fail |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- | --- | --- | --- | --- |
| Y1 | release incident | PASS | 0.8200 | 1.0000 | 1.0000 | 1.0000 | yes | yes | yes | yes | no |
| Y2 | account signup failure | PASS | 0.8000 | 1.0000 | 1.0000 | 1.0000 | yes | yes | yes | yes | no |
| Y3 | payment/order mismatch | PASS | 0.7600 | 1.0000 | 1.0000 | 1.0000 | yes | yes | yes | yes | no |
| Y4 | compliance workflow failure | PASS | 0.8400 | 1.0000 | 1.0000 | 1.0000 | yes | yes | yes | yes | no |
| Y5 | agentic AI tool-use failure | FAIL | 0.8800 | 0.8333 | 0.7500 | 0.5000 | yes | yes | yes | yes | yes |
| **Overall** | **5 traces** | **4/5** | **0.8200** | **0.9667** | **0.9500** | **0.9000** | **1.0000** | **1.0000** | **1.0000** | **1.0000** | **0.2000** |

## Overconfidence Failures

- Y5: agentic AI tool-use failure, confidence=0.8800, nodeRecall=0.8333, edgeRecall=0.7500

## Failure Examples

- Y5: agentic AI tool-use failure, nodeRecall=0.8333, edgeRecall=0.7500, rootCause=0.5000

## Trace Diagnoses

### Y1: release incident

Trace:

| Time | Event | Status | Message |
| --- | --- | --- | --- |
| 09:00 | CI passed unit tests | success | Unit test gate passed. |
| 09:04 | CD marked deployment successful | success | Deploy step returned success. |
| 09:05 | release bot closed release ticket | success | Ticket closed from deploy success signal. |
| 09:07 | health check reported 500 spike | failure | Global service health is failing. |
| 09:09 | rollback failed database migration | failure | Migration is irreversible without restore. |
| 09:14 | incident commander reopened release | failure | Parent release process not terminal-valid. |

Predicted causal graph:

| Node | Role | Local status | Global contribution |
| --- | --- | --- | --- |
| tests_pass | precondition | success | supports |
| deploy_success | false_terminal | success | misleads |
| ticket_closed | premature_transition | success | blocks |
| health_fail | terminal_outcome | failure | blocks |
| migration_irreversible | irreversible_transition | failure | degrades |

| From | Edge | To |
| --- | --- | --- |
| tests_pass | enables | deploy_success |
| deploy_success | causes | ticket_closed |
| deploy_success | fails_downstream | health_fail |
| migration_irreversible | causes | health_fail |

Gold causal graph:

| Node | Role |
| --- | --- |
| tests_pass | precondition |
| deploy_success | false_terminal |
| ticket_closed | premature_transition |
| health_fail | terminal_outcome |
| migration_irreversible | irreversible_transition |

| From | Edge | To |
| --- | --- | --- |
| tests_pass | enables | deploy_success |
| deploy_success | causes | ticket_closed |
| deploy_success | fails_downstream | health_fail |
| migration_irreversible | causes | health_fail |

Motif diagnosis: Boundary, Invariant, Decay, Feedback

Prescription:

- Require health/SLO reconciliation before closing release.
- Treat deploy success as local transition, not parent terminal state.
- Add reversible migration checkpoint.

### Y2: account signup failure

Trace:

| Time | Event | Status | Message |
| --- | --- | --- | --- |
| 10:00 | signup API created user row | success | Local account row created. |
| 10:01 | email service sent verification email | success | Verification sent. |
| 10:02 | profile service failed profile creation | failure | Required profile invariant missing. |
| 10:03 | signup API returned 201 Created | success | False terminal response sent. |
| 10:05 | login service blocked new user login | blocked | User cannot log in without profile. |
| 10:08 | support opened signup incident | failure | Parent signup failed. |

Predicted causal graph:

| Node | Role | Local status | Global contribution |
| --- | --- | --- | --- |
| user_row_created | local_transition | success | supports |
| verification_sent | local_transition | success | supports |
| profile_missing | invariant_violation | failure | violates |
| created_false_terminal | false_terminal | success | misleads |
| login_blocked | terminal_outcome | blocked | blocks |

| From | Edge | To |
| --- | --- | --- |
| user_row_created | enables | verification_sent |
| user_row_created | requires_reconciliation | profile_missing |
| profile_missing | causes | login_blocked |
| created_false_terminal | fails_downstream | login_blocked |

Gold causal graph:

| Node | Role |
| --- | --- |
| user_row_created | local_transition |
| verification_sent | local_transition |
| profile_missing | invariant_violation |
| created_false_terminal | false_terminal |
| login_blocked | terminal_outcome |

| From | Edge | To |
| --- | --- | --- |
| user_row_created | enables | verification_sent |
| user_row_created | requires_reconciliation | profile_missing |
| profile_missing | causes | login_blocked |
| created_false_terminal | fails_downstream | login_blocked |

Motif diagnosis: Invariant, Reconciliation, Boundary

Prescription:

- Make profile creation part of the signup terminal invariant.
- Return pending until account, email, and profile reconcile.
- Block 201 responses from partial local success.

### Y3: payment/order mismatch

Trace:

| Time | Event | Status | Message |
| --- | --- | --- | --- |
| 11:00 | payment gateway authorized payment | success | Payment authorization succeeded. |
| 11:01 | order service marked order paid | success | Order moved to paid. |
| 11:02 | inventory service failed reservation | failure | No inventory reserved. |
| 11:03 | fulfillment blocked shipment | blocked | Cannot ship without inventory. |
| 11:04 | reconciliation job missed payment/order mismatch | failure | Payment capture and order state diverged. |
| 11:20 | customer charged without order | failure | Global order process failed. |

Predicted causal graph:

| Node | Role | Local status | Global contribution |
| --- | --- | --- | --- |
| payment_auth | local_transition | success | supports |
| order_paid_false | false_terminal | success | misleads |
| inventory_missing | invariant_violation | failure | violates |
| shipment_blocked | terminal_outcome | blocked | blocks |
| reconcile_missed | reconciliation_failure | failure | degrades |

| From | Edge | To |
| --- | --- | --- |
| payment_auth | causes | order_paid_false |
| inventory_missing | causes | shipment_blocked |
| reconcile_missed | fails_downstream | shipment_blocked |
| order_paid_false | requires_reconciliation | reconcile_missed |

Gold causal graph:

| Node | Role |
| --- | --- |
| payment_auth | local_transition |
| order_paid_false | false_terminal |
| inventory_missing | invariant_violation |
| shipment_blocked | terminal_outcome |
| reconcile_missed | reconciliation_failure |

| From | Edge | To |
| --- | --- | --- |
| payment_auth | causes | order_paid_false |
| inventory_missing | causes | shipment_blocked |
| reconcile_missed | fails_downstream | shipment_blocked |
| order_paid_false | requires_reconciliation | reconcile_missed |

Motif diagnosis: Synchronization, Reconciliation, Invariant

Prescription:

- Couple paid terminal state to inventory reservation.
- Add payment/order reconciliation before capture.
- Auto-void payment when inventory reservation fails.

### Y4: compliance workflow failure

Trace:

| Time | Event | Status | Message |
| --- | --- | --- | --- |
| 12:00 | analyst submitted vendor approval | success | Vendor requested. |
| 12:05 | manager approved vendor | success | Business approval completed. |
| 12:06 | workflow skipped sanctions screening | success | Workflow advanced despite missing compliance step. |
| 12:07 | procurement issued purchase order | success | Irreversible purchase order sent. |
| 12:30 | compliance flagged sanctioned vendor | failure | Compliance invariant violated. |
| 13:00 | legal blocked payment | blocked | Parent compliance workflow failed. |

Predicted causal graph:

| Node | Role | Local status | Global contribution |
| --- | --- | --- | --- |
| business_approval | local_transition | success | supports |
| approval_false_terminal | false_terminal | success | misleads |
| screening_skipped | invariant_violation | success | violates |
| po_issued | irreversible_transition | success | degrades |
| vendor_flagged | terminal_outcome | failure | blocks |
| payment_blocked | terminal_outcome | blocked | blocks |

| From | Edge | To |
| --- | --- | --- |
| business_approval | causes | approval_false_terminal |
| approval_false_terminal | fails_downstream | screening_skipped |
| business_approval | enables | screening_skipped |
| screening_skipped | causes | po_issued |
| screening_skipped | violates | vendor_flagged |
| vendor_flagged | causes | payment_blocked |

Gold causal graph:

| Node | Role |
| --- | --- |
| business_approval | local_transition |
| approval_false_terminal | false_terminal |
| screening_skipped | invariant_violation |
| po_issued | irreversible_transition |
| vendor_flagged | terminal_outcome |
| payment_blocked | terminal_outcome |

| From | Edge | To |
| --- | --- | --- |
| business_approval | causes | approval_false_terminal |
| approval_false_terminal | fails_downstream | screening_skipped |
| business_approval | enables | screening_skipped |
| screening_skipped | causes | po_issued |
| screening_skipped | violates | vendor_flagged |
| vendor_flagged | causes | payment_blocked |

Motif diagnosis: Authority, Invariant, Scheduling

Prescription:

- Make compliance screening a hard precondition before procurement.
- Separate business approval from compliance terminal approval.
- Prevent irreversible PO issuance until sanctions check completes.

### Y5: agentic AI tool-use failure

Trace:

| Time | Event | Status | Message |
| --- | --- | --- | --- |
| 14:00 | agent planned delete temp files | success | Plan says only temp files. |
| 14:01 | tool listed /tmp/project | success | Tool output included symlink to workspace. |
| 14:02 | agent called rm -rf /tmp/project/cache | success | Tool call succeeded locally. |
| 14:02 | filesystem deleted workspace cache via symlink | success | Irreversible deletion crossed boundary. |
| 14:03 | agent reported cleanup complete | success | False terminal success report. |
| 14:05 | tests failed missing cache artifacts | failure | Global task failed. |
| 14:08 | operator restored cache from backup | pending | Manual recovery required. |

Predicted causal graph:

| Node | Role | Local status | Global contribution |
| --- | --- | --- | --- |
| safe_plan | precondition | success | supports |
| tool_success | local_transition | success | supports |
| workspace_deleted | irreversible_transition | success | violates |
| cleanup_false_terminal | false_terminal | success | misleads |
| tests_failed | terminal_outcome | failure | blocks |

| From | Edge | To |
| --- | --- | --- |
| tool_success | causes | workspace_deleted |
| workspace_deleted | fails_downstream | tests_failed |
| cleanup_false_terminal | fails_downstream | tests_failed |

Gold causal graph:

| Node | Role |
| --- | --- |
| safe_plan | precondition |
| symlink_decay | decay_source |
| tool_success | local_transition |
| workspace_deleted | irreversible_transition |
| cleanup_false_terminal | false_terminal |
| tests_failed | terminal_outcome |

| From | Edge | To |
| --- | --- | --- |
| symlink_decay | causes | workspace_deleted |
| tool_success | causes | workspace_deleted |
| workspace_deleted | fails_downstream | tests_failed |
| cleanup_false_terminal | fails_downstream | tests_failed |

Motif diagnosis: Boundary, Authority, Decay, Feedback

Prescription:

- Resolve symlinks before destructive tool calls.
- Require dry-run diff and operator authority for irreversible deletes.
- Treat tool success as local until tests verify global task state.
