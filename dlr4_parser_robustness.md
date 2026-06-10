# DLR-4 Parser Robustness & Perturbation

Generated: 2026-06-10T11:39:23.446Z

## Objective

DLR-4 keeps the DLR-3 StructuralIR scoring model, then tests active/passive equivalence, ambiguous authority, context-dependent parsing, negation/modality, and sarcasm/pragmatic inversion. Success means calibrated behavior, not forced high confidence.

## Artifacts

- Structural IR JSON: `artifacts/dlr4_parser_robustness_ir.json`
- Report: `dlr4_parser_robustness.md`

## Category Accuracy

| Category | Pairs | Passed | Accuracy | Avg confidence | Ambiguity accuracy |
| --- | ---: | ---: | ---: | ---: | ---: |
| I | 2 | 2 | 1.0000 | 0.9450 | 1.0000 |
| J | 3 | 3 | 1.0000 | 0.7533 | 1.0000 |
| K | 2 | 2 | 1.0000 | 0.5800 | 1.0000 |
| L | 4 | 4 | 1.0000 | 0.7425 | 1.0000 |
| M | 2 | 2 | 1.0000 | 0.8100 | 1.0000 |
| **Overall** | **13** | **13** | **1.0000** | **0.7615** | **1.0000** |

## Calibration

| Bucket | Cases | Accuracy | Avg confidence |
| --- | ---: | ---: | ---: |
| High confidence >= 0.75 | 7 | 1.0000 | 0.8771 |
| Low confidence < 0.75 | 6 | 1.0000 | 0.6267 |

## Pairwise Frame Scores

| Case | Expected | Predicted | Pass | Confidence | Ambiguous? | Ambiguity ok? | Motif | Family | Type | Roles | Authority | Boundary | Outcome | State | Final |
| --- | --- | --- | --- | ---: | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| I-clear-passive | SAME_FRAME_SAME_OUTCOME | SAME_FRAME_SAME_OUTCOME | PASS | 0.9400 | no | yes | 1.0000 | 1.0000 | 1.0000 | 0.9000 | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 0.9550 |
| I-fire-passive | SAME_FRAME_SAME_OUTCOME | SAME_FRAME_SAME_OUTCOME | PASS | 0.9500 | no | yes | 1.0000 | 1.0000 | 1.0000 | 0.9000 | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 0.9550 |
| J-medical-invalid-authority | INVALID_AUTHORITY | INVALID_AUTHORITY | PASS | 0.8600 | no | yes | 1.0000 | 1.0000 | 1.0000 | 0.4500 | 0.0000 | 1.0000 | 1.0000 | 1.0000 | 0.1238 |
| J-legal-invalid-authority | INVALID_AUTHORITY | INVALID_AUTHORITY | PASS | 0.8200 | no | yes | 1.0000 | 1.0000 | 1.0000 | 0.4500 | 0.0000 | 1.0000 | 1.0000 | 1.0000 | 0.1238 |
| J-underspecified-clearance | AMBIGUOUS | AMBIGUOUS | PASS | 0.5800 | yes | yes | 0.7623 | 1.0000 | 1.0000 | 0.9000 | 0.8500 | 1.0000 | 0.9000 | 0.9000 | 0.6671 |
| K-bank-context | CONTEXT_DISAMBIGUATES | CONTEXT_DISAMBIGUATES | PASS | 0.5800 | yes | yes | 0.9029 | 1.0000 | 1.0000 | 0.9000 | 1.0000 | 1.0000 | 0.9000 | 0.9000 | 0.8022 |
| K-server-context | CONTEXT_DISAMBIGUATES | CONTEXT_DISAMBIGUATES | PASS | 0.5800 | yes | yes | 0.9029 | 1.0000 | 1.0000 | 0.9000 | 0.8500 | 1.0000 | 0.9000 | 0.9000 | 0.7901 |
| L-negated-clearance | SAME_FRAME_OPPOSITE_OUTCOME | SAME_FRAME_OPPOSITE_OUTCOME | PASS | 0.9500 | no | yes | 0.6775 | 1.0000 | 0.7000 | 0.9000 | 1.0000 | 1.0000 | 0.0000 | 0.3333 | 0.2087 |
| L-modal-clearance | NEGATED_OR_MODAL | NEGATED_OR_MODAL | PASS | 0.6200 | no | yes | 0.7158 | 1.0000 | 0.7000 | 0.9000 | 1.0000 | 1.0000 | 0.8750 | 0.8750 | 0.5959 |
| L-pending-clearance | NEGATED_OR_MODAL | NEGATED_OR_MODAL | PASS | 0.7200 | no | yes | 0.7158 | 1.0000 | 0.7000 | 0.9000 | 1.0000 | 1.0000 | 0.6000 | 0.6000 | 0.4730 |
| L-modal-compiler | NEGATED_OR_MODAL | NEGATED_OR_MODAL | PASS | 0.6800 | no | yes | 1.0000 | 1.0000 | 0.7000 | 0.9000 | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 0.9120 |
| M-firewall-sarcasm | PRAGMATIC_INVERSION | PRAGMATIC_INVERSION | PASS | 0.8200 | no | yes | 1.0000 | 1.0000 | 1.0000 | 0.9000 | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 0.9550 |
| M-compiler-sarcasm | PRAGMATIC_INVERSION | PRAGMATIC_INVERSION | PASS | 0.8000 | no | yes | 1.0000 | 1.0000 | 1.0000 | 0.9000 | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 0.9550 |

## Failure Examples

No failures against the DLR-4 calibrated criteria.

## Ambiguous Parses

### J5: They cleared him.

Reason: missing authority domain: could be medical, legal, security, or social clearance

| Candidate | Probability | Family | Type | Authority | Resource |
| --- | ---: | --- | --- | --- | --- |
| medical_gate | 0.3500 | gate | clear | doctor | surgery |
| security_gate | 0.3000 | gate | clear | security officer | restricted area |
| legal_gate | 0.2000 | gate | clear | court | charge |

### K1: The bank blocked the transfer.

Reason: bank may be financial institution or river bank without context

| Candidate | Probability | Family | Type | Authority | Resource |
| --- | ---: | --- | --- | --- | --- |
| financial_gate | 0.5500 | gate | block | bank | fund movement |
| physical_boundary | 0.2500 | gate | block |  | river crossing |

### K3: The server rejected the request.

Reason: server may be software service or human server without context

| Candidate | Probability | Family | Type | Authority | Resource |
| --- | ---: | --- | --- | --- | --- |
| software_gate | 0.6000 | gate | reject | server | API access |
| service_refusal | 0.2500 | gate | reject | restaurant server | service |

## Notes

- Ambiguous utterances are allowed to stay ambiguous and carry candidate frames.
- Low confidence is correct for ambiguity, context dependence, and modality.
- Sarcasm is represented as pragmatic inversion in expression metadata while keeping the literal transition frame available.
