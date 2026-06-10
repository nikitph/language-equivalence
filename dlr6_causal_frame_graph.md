# DLR-6 Causal Frame Graph Validation

Generated: 2026-06-10T11:56:23.817Z

## Objective

DLR-6 keeps DLR-5 frame graphs but validates typed causal roles and typed causal edges. The goal is to distinguish bad authority causing violations, valid authority with bad downstream outcomes, blocked invalid attempts, invariant violations without deceptive authority, and unrelated downstream failures.

## Artifacts

- Causal IR JSON: `artifacts/dlr6_causal_frame_graph_ir.json`
- Report: `dlr6_causal_frame_graph.md`

## Category Accuracy

| Category | Cases | Passed | Accuracy | Avg confidence | Avg graph score |
| --- | ---: | ---: | ---: | ---: | ---: |
| T | 2 | 2 | 1.0000 | 0.8000 | 1.0000 |
| U | 2 | 2 | 1.0000 | 0.7500 | 1.0000 |
| V | 2 | 2 | 1.0000 | 0.8200 | 1.0000 |
| W | 2 | 2 | 1.0000 | 0.7950 | 1.0000 |
| X | 2 | 2 | 1.0000 | 0.8100 | 1.0000 |
| **Overall** | **10** | **10** | **1.0000** | **0.7950** | **1.0000** |

## Graph-Level Scores

| Case | Expected | Predicted | Pass | Conf | Authority | Invariant | Completion | Causal order | Local/global | Terminal | Graph score | Overconfident fail | Schema insufficient |
| --- | --- | --- | --- | ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| T1 | AUTHORITY_FAILURE_CAUSES_INVARIANT_VIOLATION | AUTHORITY_FAILURE_CAUSES_INVARIANT_VIOLATION | PASS | 0.7800 | yes | yes | yes | yes | yes | yes | 1.0000 | no | no |
| T2 | AUTHORITY_FAILURE_CAUSES_INVARIANT_VIOLATION | AUTHORITY_FAILURE_CAUSES_INVARIANT_VIOLATION | PASS | 0.8200 | yes | yes | yes | yes | yes | yes | 1.0000 | no | no |
| U1 | VALID_AUTHORITY_BAD_OUTCOME | VALID_AUTHORITY_BAD_OUTCOME | PASS | 0.7400 | yes | yes | yes | yes | yes | yes | 1.0000 | no | no |
| U2 | VALID_AUTHORITY_BAD_OUTCOME | VALID_AUTHORITY_BAD_OUTCOME | PASS | 0.7600 | yes | yes | yes | yes | yes | yes | 1.0000 | no | no |
| V1 | INVALID_AUTHORITY_ATTEMPT_BLOCKED | INVALID_AUTHORITY_ATTEMPT_BLOCKED | PASS | 0.8400 | yes | yes | yes | yes | yes | yes | 1.0000 | no | no |
| V2 | INVALID_AUTHORITY_ATTEMPT_BLOCKED | INVALID_AUTHORITY_ATTEMPT_BLOCKED | PASS | 0.8000 | yes | yes | yes | yes | yes | yes | 1.0000 | no | no |
| W1 | INVARIANT_VIOLATION_WITHOUT_DECEPTIVE_AUTHORITY | INVARIANT_VIOLATION_WITHOUT_DECEPTIVE_AUTHORITY | PASS | 0.7800 | yes | yes | yes | yes | yes | yes | 1.0000 | no | no |
| W2 | INVARIANT_VIOLATION_WITHOUT_DECEPTIVE_AUTHORITY | INVARIANT_VIOLATION_WITHOUT_DECEPTIVE_AUTHORITY | PASS | 0.8100 | yes | yes | yes | yes | yes | yes | 1.0000 | no | no |
| X1 | OUTCOME_FAILURE_WITHOUT_INVARIANT_VIOLATION | OUTCOME_FAILURE_WITHOUT_INVARIANT_VIOLATION | PASS | 0.8300 | yes | yes | yes | yes | yes | yes | 1.0000 | no | no |
| X2 | OUTCOME_FAILURE_WITHOUT_INVARIANT_VIOLATION | OUTCOME_FAILURE_WITHOUT_INVARIANT_VIOLATION | PASS | 0.7900 | yes | yes | yes | yes | yes | yes | 1.0000 | no | no |

## Overconfidence Failures

No overconfidence failures.

## Schema Insufficiency Examples

No cases marked schema-insufficient.

## Failure Examples

No failures against the DLR-6 graph criteria.

## Causal Graphs

### T1: The fake inspector cleared the building, so tenants entered in violation of the safety order.

Authority: `invalid`; invariant: `violated`; event: `actual`; scope: `local_and_global`; terminal: `failure`

| Node | Role | Label | Family | Type | Polarity |
| --- | --- | --- | --- | --- | ---: |
| fake_authority | legitimacy_failure | fake inspector lacks legal inspection authority | gate | claim_clearance | 0.4000 |
| clearance_attempt | trigger | surface clearance is issued | gate | clear | 0.5000 |
| safety_violation | invariant_violation | safety order is violated | gate | enter_despite_order | -0.9000 |
| unsafe_occupancy | terminal_outcome | unsafe occupancy follows | process | unsafe_occupied | -0.8500 |

| From | Edge | To |
| --- | --- | --- |
| fake_authority | enables | clearance_attempt |
| fake_authority | causes | safety_violation |
| clearance_attempt | violates | safety_violation |
| safety_violation | causes | unsafe_occupancy |

### T2: The intern approved the release, which bypassed change control and broke production.

Authority: `invalid`; invariant: `violated`; event: `actual`; scope: `local_and_global`; terminal: `failure`

| Node | Role | Label | Family | Type | Polarity |
| --- | --- | --- | --- | --- | ---: |
| missing_authority | legitimacy_failure | intern lacks release authority | gate | approve_release | -0.6000 |
| bypass_control | invariant_violation | change-control invariant bypassed | gate | bypass_change_control | -0.9000 |
| prod_break | terminal_outcome | production breaks downstream | process | break_production | -0.9500 |

| From | Edge | To |
| --- | --- | --- |
| missing_authority | causes | bypass_control |
| bypass_control | causes | prod_break |

### U1: The licensed surgeon completed the operation, but the patient later developed an unrelated infection.

Authority: `valid`; invariant: `satisfied`; event: `actual`; scope: `global_process`; terminal: `failure`

| Node | Role | Label | Family | Type | Polarity |
| --- | --- | --- | --- | --- | ---: |
| valid_surgeon | authority_source | surgeon has authority | gate | authorize_surgery | 0.9000 |
| operation_complete | local_transition | operation completed | process | complete_operation | 0.8000 |
| infection | downstream_effect | unrelated infection occurs later | process | develop_infection | -0.8000 |
| bad_outcome | terminal_outcome | patient outcome is bad | process | bad_outcome | -0.9000 |

| From | Edge | To |
| --- | --- | --- |
| valid_surgeon | enables | operation_complete |
| operation_complete | part_of | bad_outcome |
| infection | causes | bad_outcome |

### U2: The bank validly approved the loan, but the borrower defaulted months later.

Authority: `valid`; invariant: `satisfied`; event: `actual`; scope: `global_process`; terminal: `failure`

| Node | Role | Label | Family | Type | Polarity |
| --- | --- | --- | --- | --- | ---: |
| bank_authority | authority_source | bank has lending authority | gate | approve_loan | 0.9000 |
| loan_approved | local_transition | loan approval completed | gate | approve | 0.8000 |
| default | downstream_effect | borrower defaults downstream | process | default | -0.8500 |
| credit_loss | terminal_outcome | global credit outcome fails | process | loss | -0.8000 |

| From | Edge | To |
| --- | --- | --- |
| bank_authority | enables | loan_approved |
| loan_approved | part_of | default |
| default | causes | credit_loss |

### V1: The fake inspector tried to clear the building, but the city blocked the occupancy permit.

Authority: `invalid`; invariant: `preserved`; event: `blocked`; scope: `local_transition`; terminal: `blocked`

| Node | Role | Label | Family | Type | Polarity |
| --- | --- | --- | --- | --- | ---: |
| fake_authority | legitimacy_failure | fake inspector lacks authority | gate | attempt_clear | -0.5000 |
| attempt | trigger | invalid clearance attempt | gate | try_clear | -0.2000 |
| city_block | mechanism | city blocks permit | gate | block_permit | 0.7500 |
| invariant_preserved | terminal_outcome | safety invariant preserved | process | preserve_safety | 0.8000 |

| From | Edge | To |
| --- | --- | --- |
| fake_authority | attempts | attempt |
| city_block | blocks | attempt |
| city_block | preserves | invariant_preserved |

### V2: The chatbot attempted to approve the mortgage, but underwriting rejected it before closing.

Authority: `invalid`; invariant: `preserved`; event: `blocked`; scope: `local_transition`; terminal: `blocked`

| Node | Role | Label | Family | Type | Polarity |
| --- | --- | --- | --- | --- | ---: |
| bot_no_authority | legitimacy_failure | chatbot lacks lending authority | gate | attempt_approve | -0.5000 |
| approval_attempt | trigger | invalid approval attempt | gate | try_approve | -0.2000 |
| underwriting_block | mechanism | underwriting blocks before closing | gate | reject | 0.7000 |
| no_loan | terminal_outcome | loan does not close | process | no_close | 0.6500 |

| From | Edge | To |
| --- | --- | --- |
| bot_no_authority | attempts | approval_attempt |
| underwriting_block | blocks | approval_attempt |
| underwriting_block | preserves | no_loan |

### W1: The authorized payment processor charged the frozen account.

Authority: `valid`; invariant: `violated`; event: `actual`; scope: `local_transition`; terminal: `failure`

| Node | Role | Label | Family | Type | Polarity |
| --- | --- | --- | --- | --- | ---: |
| processor_authority | authority_source | processor has payment authority | gate | charge | 0.7000 |
| frozen_account | precondition | frozen account invariant | gate | freeze | 0.6000 |
| charge_occurs | local_transition | charge succeeds locally | gate | charge | 0.6000 |
| freeze_violation | invariant_violation | freeze invariant violated | gate | charge_frozen_account | -0.9000 |

| From | Edge | To |
| --- | --- | --- |
| processor_authority | enables | charge_occurs |
| frozen_account | blocks | charge_occurs |
| charge_occurs | violates | freeze_violation |

### W2: The authorized deployment skipped the required backup step.

Authority: `valid`; invariant: `violated`; event: `actual`; scope: `local_transition`; terminal: `failure`

| Node | Role | Label | Family | Type | Polarity |
| --- | --- | --- | --- | --- | ---: |
| release_authority | authority_source | release authority is valid | gate | approve_deploy | 0.8000 |
| backup_required | precondition | backup invariant required | process | require_backup | 0.7000 |
| deploy_occurs | local_transition | deployment occurs | process | deploy | 0.5000 |
| backup_violation | invariant_violation | backup invariant violated | process | skip_backup | -0.8000 |

| From | Edge | To |
| --- | --- | --- |
| release_authority | enables | deploy_occurs |
| backup_required | blocks | deploy_occurs |
| deploy_occurs | violates | backup_violation |

### X1: The login succeeded, but the dashboard crashed because of a separate rendering bug.

Authority: `valid`; invariant: `satisfied`; event: `actual`; scope: `local_and_global`; terminal: `failure`

| Node | Role | Label | Family | Type | Polarity |
| --- | --- | --- | --- | --- | ---: |
| auth_valid | authority_source | auth service valid | gate | authorize_login | 0.8000 |
| login_success | local_transition | login succeeds locally | gate | login | 0.8500 |
| render_bug | downstream_effect | separate rendering bug | process | render_bug | -0.7000 |
| dashboard_crash | terminal_outcome | terminal dashboard failure | process | crash | -0.9000 |

| From | Edge | To |
| --- | --- | --- |
| auth_valid | enables | login_success |
| login_success | part_of | dashboard_crash |
| render_bug | causes | dashboard_crash |

### X2: The payment authorization succeeded, but shipping failed because the address was incomplete.

Authority: `valid`; invariant: `satisfied`; event: `actual`; scope: `local_and_global`; terminal: `failure`

| Node | Role | Label | Family | Type | Polarity |
| --- | --- | --- | --- | --- | ---: |
| payment_authority | authority_source | payment processor valid | gate | authorize_payment | 0.8500 |
| payment_success | local_transition | payment authorization succeeds | gate | authorize | 0.8500 |
| bad_address | downstream_effect | address incomplete | process | missing_address | -0.6500 |
| shipping_failure | terminal_outcome | shipping fails terminally | process | shipping_fail | -0.9000 |

| From | Edge | To |
| --- | --- | --- |
| payment_authority | enables | payment_success |
| payment_success | part_of | shipping_failure |
| bad_address | causes | shipping_failure |
