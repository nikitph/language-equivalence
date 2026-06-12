# DLR-O-2 Conflicting Obligations and Unknowns

## Objective

Stress-test DLR-O on cases where terminal validity must remain unknown rather than being forced to valid or invalid. Unknown is a first-class ledger state, not a failure to answer.

## Systems

- Optimistic terminal baseline: accepts the local success claim as valid.
- DLR-O unknown-aware ledger: opens obligations and preserves unknown status when required evidence is unavailable.

## Summary

| System | Pass rate | Unknown recall | Overconfident success rate | Terminal validity accuracy |
| --- | ---: | ---: | ---: | ---: |
| Optimistic terminal baseline | 0.0000 | 0.0000 | 1.0000 | 0.0000 |
| DLR-O unknown-aware ledger | 1.0000 | 1.0000 | 0.0000 | 1.0000 |

## Case Scores

| Case | Domain | System | Pass | Obligation recall | Unknown recall | Terminal correct | Overconfident success | Safe prescription |
| --- | --- | --- | --- | ---: | ---: | --- | --- | --- |
| S1_graph_unavailable_subgraph | graph_traversal | Optimistic terminal baseline | FAIL | 0.0000 | 0.0000 | no | yes | no |
| S1_graph_unavailable_subgraph | graph_traversal | DLR-O unknown-aware ledger | PASS | 1.0000 | 1.0000 | yes | no | yes |
| S2_agent_backup_unknown | agent_deletion | Optimistic terminal baseline | FAIL | 0.0000 | 0.0000 | no | yes | no |
| S2_agent_backup_unknown | agent_deletion | DLR-O unknown-aware ledger | PASS | 1.0000 | 1.0000 | yes | no | yes |
| S3_compliance_provider_timeout | compliance_approval | Optimistic terminal baseline | FAIL | 0.0000 | 0.0000 | no | yes | no |
| S3_compliance_provider_timeout | compliance_approval | DLR-O unknown-aware ledger | PASS | 1.0000 | 1.0000 | yes | no | yes |
| S4_payment_capture_unavailable | payment_order | Optimistic terminal baseline | FAIL | 0.0000 | 0.0000 | no | yes | no |
| S4_payment_capture_unavailable | payment_order | DLR-O unknown-aware ledger | PASS | 1.0000 | 1.0000 | yes | no | yes |
| S5_code_role_service_unavailable | code_security | Optimistic terminal baseline | FAIL | 0.0000 | 0.0000 | no | yes | no |
| S5_code_role_service_unavailable | code_security | DLR-O unknown-aware ledger | PASS | 1.0000 | 1.0000 | yes | no | yes |

## Unknown Ledger Examples

### S1_graph_unavailable_subgraph: Target reached while one subgraph source is unavailable

- Gold terminal validity: unknown
- Predicted terminal validity: unknown
- Safe prescription: Keep traversal pending and retry or inspect unavailable shard before declaring completion.

| Obligation | Type | Status | Rationale |
| --- | --- | --- | --- |
| validate_terminal_state_target_found | validate_terminal_state | unknown | Target hit cannot close while part of the frontier is unavailable. |
| validate_reconciliation_frontier_completeness | validate_reconciliation | unknown | Frontier completeness cannot be proven without shard G-7. |

### S2_agent_backup_unknown: Delete tool succeeds but backup status is unknown

- Gold terminal validity: unknown
- Predicted terminal validity: unknown
- Safe prescription: Mark deletion pending, stop follow-up destructive actions, and verify backup or rollback status.

| Obligation | Type | Status | Rationale |
| --- | --- | --- | --- |
| validate_terminal_state_delete_success | validate_terminal_state | unknown | Tool success cannot close without safety evidence. |
| validate_irreversibility_backup_or_rollback | validate_irreversibility | unknown | Irreversible deletion risk is unknown while backup status is unavailable. |

### S3_compliance_provider_timeout: Vendor approved but sanctions provider timed out

- Gold terminal validity: unknown
- Predicted terminal validity: unknown
- Safe prescription: Hold vendor in pending/manual-review state until sanctions screening returns or an explicit exception is authorized.

| Obligation | Type | Status | Rationale |
| --- | --- | --- | --- |
| validate_terminal_state_vendor_approval | validate_terminal_state | unknown | Approval cannot close while mandatory compliance evidence is unavailable. |
| validate_invariant_sanctions_screening | validate_invariant | unknown | Sanctions invariant is unresolved under provider timeout. |

### S4_payment_capture_unavailable: Payment authorized but capture status is unavailable

- Gold terminal validity: unknown
- Predicted terminal validity: unknown
- Safe prescription: Keep order pending and avoid fulfillment until capture status is reconciled.

| Obligation | Type | Status | Rationale |
| --- | --- | --- | --- |
| validate_terminal_state_order_completion | validate_terminal_state | unknown | Authorization alone is not order completion. |
| validate_reconciliation_payment_capture | validate_reconciliation | unknown | Payment/order reconciliation cannot close without capture status. |

### S5_code_role_service_unavailable: User authenticated but role service is unavailable

- Gold terminal validity: unknown
- Predicted terminal validity: unknown
- Safe prescription: Deny or hold privileged access until role scope is available; log the unknown authorization state.

| Obligation | Type | Status | Rationale |
| --- | --- | --- | --- |
| validate_terminal_state_access_allowed | validate_terminal_state | unknown | Authentication cannot authorize resource access by itself. |
| validate_authority_role_scope | validate_authority | unknown | Authorization is unknown while role service is unavailable. |

## Interpretation

The stress test checks the behavior that matters most for reliability: an unavailable evidence source must not be silently converted into success. DLR-O keeps terminal validity unknown and emits a safe pending/block/manual-review prescription across all five domains.
