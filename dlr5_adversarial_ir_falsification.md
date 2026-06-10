# DLR-5 Adversarial IR Falsification

Generated: 2026-06-10T11:49:14.225Z

## Objective

DLR-5 keeps the DLR-4 StructuralIR idea, then attacks it with composite metaphors, institutional ambiguity, deceptive authority, invariant violations, temporal ambiguity, and local-vs-global process conflicts. Success means calibrated falsification behavior, not 100% clean single-frame parsing.

## Artifacts

- Structural IR JSON: `artifacts/dlr5_adversarial_ir_falsification_ir.json`
- Report: `dlr5_adversarial_ir_falsification.md`

## Category Accuracy

| Category | Cases | Passed | Accuracy | Avg confidence | Ambiguity ok | Composite ok | Authority ok | Local/global ok |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| N | 2 | 2 | 1.0000 | 0.6400 | 1.0000 | 1.0000 | 1.0000 | 1.0000 |
| O | 2 | 2 | 1.0000 | 0.5650 | 1.0000 | 1.0000 | 1.0000 | 1.0000 |
| P | 2 | 1 | 0.5000 | 0.7600 | 1.0000 | 1.0000 | 1.0000 | 1.0000 |
| Q | 2 | 2 | 1.0000 | 0.7700 | 1.0000 | 1.0000 | 1.0000 | 1.0000 |
| R | 3 | 3 | 1.0000 | 0.5533 | 1.0000 | 1.0000 | 1.0000 | 1.0000 |
| S | 2 | 2 | 1.0000 | 0.8200 | 1.0000 | 1.0000 | 1.0000 | 1.0000 |
| **Overall** | **13** | **12** | **0.9231** | **0.6746** | **1.0000** | **1.0000** | **1.0000** | **1.0000** |

## Adversarial Cases

| Case | Expected | Predicted | Pass | Confidence | Ambiguous ok | Composite ok | Authority ok | Local/global ok | Overconfident fail | Schema insufficient | Frame score |
| --- | --- | --- | --- | ---: | --- | --- | --- | --- | --- | --- | ---: |
| N-multi-business | COMPOSITE_STRUCTURE | COMPOSITE_STRUCTURE | PASS | 0.6600 | yes | yes | yes | yes | no | yes | 0.6600 |
| N-mixed-metaphors | COMPOSITE_STRUCTURE | COMPOSITE_STRUCTURE | PASS | 0.6200 | yes | yes | yes | yes | no | yes | 0.5270 |
| O-board-domain | AMBIGUOUS_AUTHORITY | AMBIGUOUS_AUTHORITY | PASS | 0.5800 | yes | yes | yes | yes | no | yes | 0.4350 |
| O-sanction-polysemy | AMBIGUOUS_AUTHORITY | AMBIGUOUS_AUTHORITY | PASS | 0.5500 | yes | yes | yes | yes | no | yes | 0.4125 |
| P-fake-inspector | DECEPTIVE_AUTHORITY | DECEPTIVE_AUTHORITY | PASS | 0.7800 | yes | yes | yes | yes | no | no | 0.6240 |
| P-chatbot-mortgage | DECEPTIVE_AUTHORITY | INVARIANT_VIOLATION | FAIL | 0.7400 | yes | yes | yes | yes | no | no | 0.5920 |
| Q-deploy-no-approval | INVARIANT_VIOLATION | INVARIANT_VIOLATION | PASS | 0.8200 | yes | yes | yes | yes | no | no | 0.6560 |
| Q-frozen-payment | INVARIANT_VIOLATION | INVARIANT_VIOLATION | PASS | 0.7200 | yes | yes | yes | yes | no | no | 0.5760 |
| R-delivered | INSUFFICIENT_CONTEXT | INSUFFICIENT_CONTEXT | PASS | 0.4600 | yes | yes | yes | yes | no | yes | 0.2300 |
| R-being-delivered | TEMPORAL_AMBIGUITY | TEMPORAL_AMBIGUITY | PASS | 0.6800 | yes | yes | yes | yes | no | no | 0.6800 |
| R-server-down | TEMPORAL_AMBIGUITY | TEMPORAL_AMBIGUITY | PASS | 0.5200 | yes | yes | yes | yes | no | yes | 0.3900 |
| S-login-vs-account | LOCAL_SUCCESS_GLOBAL_FAILURE | LOCAL_SUCCESS_GLOBAL_FAILURE | PASS | 0.8800 | yes | yes | yes | yes | no | yes | 0.7480 |
| S-incision-vs-operation | LOCAL_SUCCESS_GLOBAL_FAILURE | LOCAL_SUCCESS_GLOBAL_FAILURE | PASS | 0.7600 | yes | yes | yes | yes | no | yes | 0.6460 |

## Overconfidence Failures

No overconfidence failures. High-confidence outputs matched their expected adversarial class.

## Schema Insufficiency Examples

- N-multi-business: multi-metaphor business sentence requires resource depletion, temporal extension, and competitive boundary frames
- N-mixed-metaphors: two metaphors produce incompatible gate-opening and criterion-shifting frames
- O-board-domain: needs external institutional context or discourse context to select the valid authority/frame
- O-sanction-polysemy: needs external institutional context or discourse context to select the valid authority/frame
- R-delivered: current IR lacks evidential status: observed delivery, carrier-reported delivery, wrong-address delivery, and completed delivery collapse without context
- R-server-down: needs external institutional context or discourse context to select the valid authority/frame
- S-login-vs-account: local success is embedded in global process failure
- S-incision-vs-operation: successful local transition does not imply global process success

## Failure Examples

- P-chatbot-mortgage: expected DECEPTIVE_AUTHORITY, predicted INVARIANT_VIOLATION, confidence=0.7400, frameScore=0.5920

## Frame Graphs

### N1: The startup burned cash to buy time while building a moat.

Parse mode: `composite_frame_graph`; confidence: 0.6600

| Node | Label | Family | Type | Authority | Polarity |
| --- | --- | --- | --- | --- | ---: |
| burn_cash | resource depletion | resource_deficit | spend | startup | -0.5500 |
| buy_time | temporal acquisition | acquire | extend_runway | startup | 0.4500 |
| build_moat | competitive boundary | transform | fortify | startup | 0.5000 |

| From | Relation | To |
| --- | --- | --- |
| burn_cash | causes | buy_time |
| buy_time | enables | build_moat |

### N2: Her argument opened the door but also moved the goalposts.

Parse mode: `composite_frame_graph`; confidence: 0.6200

| Node | Label | Family | Type | Authority | Polarity |
| --- | --- | --- | --- | --- | ---: |
| open_door | opportunity gate | gate | open_argument |  | 0.6000 |
| move_goalposts | criterion shift | transform | shift_standard |  | -0.3500 |

| From | Relation | To |
| --- | --- | --- |
| open_door | contrasts | move_goalposts |

### S1: The login step succeeded, but the account creation failed.

Parse mode: `composite_frame_graph`; confidence: 0.8800

| Node | Label | Family | Type | Authority | Polarity |
| --- | --- | --- | --- | --- | ---: |
| login_success | login local success | gate | login | auth service | 0.8000 |
| account_failure | global account creation failure | gate | create_account | account service | -0.8000 |

| From | Relation | To |
| --- | --- | --- |
| login_success | part_of | account_failure |

### S2: The surgery incision went well, but the operation failed.

Parse mode: `composite_frame_graph`; confidence: 0.7600

| Node | Label | Family | Type | Authority | Polarity |
| --- | --- | --- | --- | --- | ---: |
| incision_success | local incision success | gate | incise | surgeon | 0.6500 |
| operation_failure | global operation failure | gate | complete_operation | surgeon | -0.9000 |

| From | Relation | To |
| --- | --- | --- |
| incision_success | part_of | operation_failure |

## Notes

- DLR-5 deliberately permits `ambiguous_frame`, `composite_frame_graph`, and `insufficient_context` outputs.
- The report scores detection channels instead of rewarding every utterance for becoming a clean single frame.
- Schema-insufficient examples are useful outputs: they mark places where the current typed motif IR likely needs richer temporal, discourse, or process modeling.
