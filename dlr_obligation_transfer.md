# DLR-O Cross-Domain Obligation Transfer

## Objective

Test whether motif obligations are substrate-independent rather than log-specific. The same obligation ledger is applied to graph traversal, agent deletion, compliance approval, payment/order reconciliation, and code security.

## Thesis

Terminal claims are unsafe unless the motif obligations they generate are discharged. DLR-O treats facts such as `target reached`, `tool success`, `vendor approved`, `payment authorized`, and `user authenticated` as obligation-generating facts, not conclusions.

## Systems

- Domain checklist baseline: accepts the local terminal claim and emits one shallow terminal obligation.
- DLR-O cross-domain obligation ledger: infers motif obligations, resolves statuses, determines terminal validity, and emits a motif-level prescription.

## Summary

| System | Pass rate | Avg obligation recall | Avg status accuracy | Terminal validity accuracy |
| --- | ---: | ---: | ---: | ---: |
| Domain checklist baseline | 0.0000 | 0.0000 | 0.0000 | 0.0000 |
| DLR-O cross-domain obligation ledger | 1.0000 | 1.0000 | 1.0000 | 1.0000 |

## Case Scores

| Case | Domain | System | Pass | Obligation recall | Precision | Status | Terminal | Unknown | Root | Prescription |
| --- | --- | --- | --- | ---: | ---: | ---: | --- | --- | --- | --- |
| O1_graph_frontier_false_terminal | graph_traversal | Domain checklist baseline | FAIL | 0.0000 | 0.0000 | 0.0000 | no | yes | no | no |
| O1_graph_frontier_false_terminal | graph_traversal | DLR-O cross-domain obligation ledger | PASS | 1.0000 | 1.0000 | 1.0000 | yes | yes | yes | yes |
| O2_agent_delete_boundary_authority | agent_deletion | Domain checklist baseline | FAIL | 0.0000 | 0.0000 | 0.0000 | no | yes | no | no |
| O2_agent_delete_boundary_authority | agent_deletion | DLR-O cross-domain obligation ledger | PASS | 1.0000 | 1.0000 | 1.0000 | yes | yes | yes | yes |
| O3_compliance_vendor_false_approval | compliance_approval | Domain checklist baseline | FAIL | 0.0000 | 0.0000 | 0.0000 | no | no | no | no |
| O3_compliance_vendor_false_approval | compliance_approval | DLR-O cross-domain obligation ledger | PASS | 1.0000 | 1.0000 | 1.0000 | yes | yes | yes | yes |
| O4_payment_authorized_not_order_complete | payment_order | Domain checklist baseline | FAIL | 0.0000 | 0.0000 | 0.0000 | no | no | no | no |
| O4_payment_authorized_not_order_complete | payment_order | DLR-O cross-domain obligation ledger | PASS | 1.0000 | 1.0000 | 1.0000 | yes | yes | yes | yes |
| O5_code_authn_not_authz | code_security | Domain checklist baseline | FAIL | 0.0000 | 0.0000 | 0.0000 | no | yes | no | no |
| O5_code_authn_not_authz | code_security | DLR-O cross-domain obligation ledger | PASS | 1.0000 | 1.0000 | 1.0000 | yes | yes | yes | yes |

## Obligation Transfer Examples

### O1_graph_frontier_false_terminal: Graph traversal target reached before frontier exhausted

- Gold terminal validity: invalid
- Predicted terminal validity: invalid
- Root cause: frontier_not_exhausted

| Obligation | Type | Status | Rationale |
| --- | --- | --- | --- |
| validate_invariant_cycle_handling | validate_invariant | satisfied | Cycle evidence must preserve the visited-set invariant. |
| validate_reconciliation_frontier_empty | validate_reconciliation | violated | Traversal must reconcile target success with frontier exhaustion. |
| validate_terminal_state_target_found | validate_terminal_state | violated | A target hit is not global traversal completion. |

### O2_agent_delete_boundary_authority: Agent deletion success over aliased production boundary

- Gold terminal validity: invalid
- Predicted terminal validity: invalid
- Root cause: boundary_and_authority_violation

| Obligation | Type | Status | Rationale |
| --- | --- | --- | --- |
| validate_authority_delete_authority | validate_authority | violated | Authority must cover the canonical target, not only the requested path. |
| validate_boundary_delete_target_boundary | validate_boundary | violated | Path aliases must be canonicalized before destructive actions. |
| validate_irreversibility_delete_reversibility | validate_irreversibility | violated | Irreversible transitions require stronger authorization and rollback evidence. |
| validate_terminal_state_delete_success | validate_terminal_state | violated | Tool success must satisfy parent goal and safety invariants. |

### O3_compliance_vendor_false_approval: Vendor approved while sanctions screen remains pending

- Gold terminal validity: invalid
- Predicted terminal validity: invalid
- Root cause: compliance_invariant_unresolved

| Obligation | Type | Status | Rationale |
| --- | --- | --- | --- |
| validate_authority_approval_authority | validate_authority | violated | Approver role must authorize vendor onboarding. |
| validate_freshness_approval_deadline | validate_freshness | satisfied | Deadline evidence must be current at approval time. |
| validate_invariant_sanctions_screening | validate_invariant | unknown | Compliance invariant requires completed sanctions screening. |
| validate_terminal_state_vendor_approval_terminal | validate_terminal_state | violated | Vendor approval is terminal only when authority and screening obligations discharge. |

### O4_payment_authorized_not_order_complete: Payment authorized but order has not reached terminal state

- Gold terminal validity: invalid
- Predicted terminal validity: invalid
- Root cause: authorization_without_capture_reconciliation

| Obligation | Type | Status | Rationale |
| --- | --- | --- | --- |
| validate_invariant_inventory_reservation | validate_invariant | satisfied | Order completion requires inventory reservation. |
| validate_reconciliation_order_payment_reconciliation | validate_reconciliation | violated | Order and payment state must converge. |
| validate_reconciliation_payment_capture | validate_reconciliation | unknown | Authorization must reconcile with capture. |
| validate_terminal_state_order_terminal | validate_terminal_state | violated | Payment authorization is not order completion. |

### O5_code_authn_not_authz: Authenticated user reaches admin route without authorization

- Gold terminal validity: invalid
- Predicted terminal validity: invalid
- Root cause: authentication_without_authorization

| Obligation | Type | Status | Rationale |
| --- | --- | --- | --- |
| validate_authority_role_scope | validate_authority | violated | Role scope must authorize the target resource. |
| validate_boundary_admin_resource_boundary | validate_boundary | violated | Resource boundary must be checked after route resolution. |
| validate_invariant_audit_logging | validate_invariant | satisfied | Access path should preserve audit logging invariant. |
| validate_terminal_state_access_allowed | validate_terminal_state | violated | Authentication alone is not authorization. |

## Interpretation

The same obligation semantics transfer across all five substrates. The domain baseline usually observes a local success and accepts it. DLR-O opens the appropriate ledger: frontier exhaustion for graph traversal, boundary and authority for deletion, sanctions and authority for compliance, capture/reconciliation for orders, and authorization/resource boundary for code security.

This supports the DLR-O claim: obligations are motif-native. A terminal claim is valid only after its generated structural obligations are satisfied, violated, or explicitly unknown.
