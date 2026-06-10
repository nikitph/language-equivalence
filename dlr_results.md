# DLR Experiment Results

Generated: 2026-06-10T10:53:11.479Z

## Configuration

- Parser provider: `codex`
- Ollama oracle command, when `PARSER_PROVIDER=ollama`: `ollama run qwen2.5:7b`
- Parser cache: `.cache/oracle-results.json`
- Baseline: deterministic local 1536-D hashed lexical embedding over tokens, token n-grams, and character trigrams
- Structural vector: 32-D `motif_skeleton` from `DisentangledUtterance`

## Category Design

| Category | Purpose |
| --- | --- |
| A | Same hunger structure across literal, idiomatic, and anatomical expressions. |
| B | Same job-termination structure across literal, idiomatic, and Spanish expressions. |
| C | Same entities and words with opposite loan transition outcomes. |
| D | Same hunger wording across food, ambition, revenge, learning, and machine fuel domains. |
| E | Same word `fired` across employment, launch, weapon discharge, kiln transformation, and neural activation. |
| F | Repeated allow/deny or accept/reject gates across different institutional systems. |

## Pairwise Scores

| Category | Pair | Baseline embedding | 32-D motif skeleton | Transition | Polarity | Typed frame | Typed - baseline |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| A | A1-A2 | 0.0333 | 0.9999 | 1.0000 | 0.8000 | 0.9399 | 0.9066 |
| A | A1-A3 | 0.0278 | 0.9984 | 1.0000 | 0.7750 | 0.9222 | 0.8944 |
| A | A2-A3 | 0.0278 | 0.9982 | 1.0000 | 0.9750 | 0.9720 | 0.9442 |
| B | B1-B2 | 0.2787 | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 0.7213 |
| B | B1-B3 | 0.0283 | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 0.9717 |
| B | B2-B3 | 0.0000 | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 1.0000 |
| C | C1-C2 | 0.6316 | 0.5386 | 0.7500 | 0.0000 | 0.3434 | -0.2882 |
| D | D1-D2 | 0.6872 | 0.4268 | 0.7500 | 0.0000 | 0.2294 | -0.4578 |
| D | D1-D3 | 0.7081 | 0.4408 | 0.0000 | 0.9000 | 0.2534 | -0.4546 |
| D | D1-D4 | 0.6975 | 0.2981 | 0.7500 | 0.0000 | 0.1602 | -0.5373 |
| D | D1-D5 | 0.2750 | 0.8587 | 1.0000 | 0.9500 | 0.8050 | 0.5300 |
| D | D2-D3 | 0.7321 | 0.5078 | 0.0000 | 0.0000 | 0.1828 | -0.5493 |
| D | D2-D4 | 0.5374 | 0.4649 | 1.0000 | 0.7250 | 0.3911 | -0.1463 |
| D | D2-D5 | 0.3752 | 0.4810 | 0.7500 | 0.0000 | 0.2585 | -0.1167 |
| D | D3-D4 | 0.5505 | 0.2838 | 0.0000 | 0.0000 | 0.1022 | -0.4483 |
| D | D3-D5 | 0.3690 | 0.4984 | 0.0000 | 0.8500 | 0.2804 | -0.0886 |
| D | D4-D5 | 0.2285 | 0.2677 | 0.7500 | 0.0000 | 0.1439 | -0.0847 |
| E | E1-E2 | 0.3036 | 0.5309 | 0.0000 | 0.0000 | 0.2389 | -0.0647 |
| E | E1-E3 | 0.4006 | 0.8535 | 0.0000 | 0.7500 | 0.5441 | 0.1435 |
| E | E1-E4 | 0.3103 | 0.3500 | 0.0000 | 0.0000 | 0.1225 | -0.1878 |
| E | E1-E5 | 0.2097 | 0.2952 | 0.0000 | 0.0000 | 0.1181 | -0.0916 |
| E | E2-E3 | 0.4211 | 0.7272 | 0.7500 | 0.0000 | 0.4636 | 0.0425 |
| E | E2-E4 | 0.3697 | 0.6778 | 0.0000 | 0.9000 | 0.3897 | 0.0201 |
| E | E2-E5 | 0.2865 | 0.3964 | 0.0000 | 0.9000 | 0.2477 | -0.0387 |
| E | E3-E4 | 0.4303 | 0.5832 | 0.0000 | 0.0000 | 0.2041 | -0.2262 |
| E | E3-E5 | 0.3780 | 0.5387 | 0.0000 | 0.0000 | 0.2155 | -0.1625 |
| E | E4-E5 | 0.2928 | 0.3721 | 0.0000 | 1.0000 | 0.2232 | -0.0695 |
| F | F1-F2 | 0.6205 | 0.6642 | 0.7500 | 0.0000 | 0.4234 | -0.1971 |
| F | F1-F3 | 0.1765 | 0.7795 | 1.0000 | 1.0000 | 0.7483 | 0.5718 |
| F | F1-F4 | 0.1765 | 0.4562 | 0.7500 | 0.0000 | 0.2726 | 0.0961 |
| F | F1-F5 | 0.1765 | 0.8056 | 1.0000 | 1.0000 | 0.7733 | 0.5968 |
| F | F1-F6 | 0.1569 | 0.4783 | 0.7500 | 0.0000 | 0.2858 | 0.1289 |
| F | F2-F3 | 0.1964 | 0.4721 | 0.7500 | 0.0000 | 0.2821 | 0.0857 |
| F | F2-F4 | 0.1964 | 0.8283 | 1.0000 | 1.0000 | 0.7952 | 0.5988 |
| F | F2-F5 | 0.1528 | 0.4912 | 0.7500 | 0.0000 | 0.2935 | 0.1408 |
| F | F2-F6 | 0.1528 | 0.8455 | 1.0000 | 1.0000 | 0.8117 | 0.6590 |
| F | F3-F4 | 0.7400 | 0.6529 | 0.7500 | 0.0000 | 0.4162 | -0.3238 |
| F | F3-F5 | 0.3400 | 0.8829 | 1.0000 | 1.0000 | 0.8476 | 0.5076 |
| F | F3-F6 | 0.3400 | 0.5520 | 0.7500 | 0.0000 | 0.3298 | -0.0102 |
| F | F4-F5 | 0.3400 | 0.5471 | 0.7500 | 0.0000 | 0.3269 | -0.0131 |
| F | F4-F6 | 0.3400 | 0.9099 | 1.0000 | 1.0000 | 0.8735 | 0.5335 |
| F | F5-F6 | 0.7400 | 0.6506 | 0.7500 | 0.0000 | 0.4148 | -0.3252 |

## Category Averages

| Category | Baseline embedding | 32-D motif skeleton | Transition | Polarity | Typed frame | Typed - baseline |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| A | 0.0297 | 0.9988 | 1.0000 | 0.8500 | 0.9447 | 0.9151 |
| B | 0.1024 | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 0.8976 |
| C | 0.6316 | 0.5386 | 0.7500 | 0.0000 | 0.3434 | -0.2882 |
| D | 0.5161 | 0.4528 | 0.5000 | 0.3425 | 0.2807 | -0.2354 |
| E | 0.3403 | 0.5325 | 0.0750 | 0.3550 | 0.2768 | -0.0635 |
| F | 0.3230 | 0.6678 | 0.8500 | 0.4000 | 0.5263 | 0.2033 |

## Parsed Utterances

### A1: I am slightly hungry.

```json
{
  "motif_skeleton": [
    0.7,
    0,
    0,
    0,
    0.25,
    0,
    0.45,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0.85,
    0,
    0,
    0.2,
    0,
    0,
    0
  ],
  "parameters": {
    "intensity": 0.2,
    "urgency": 0.25,
    "polarity": -0.45
  },
  "bindings": {
    "subject": "I",
    "object": "food"
  },
  "expression": {
    "language": "English",
    "is_idiom": false
  },
  "structural_frame": {
    "role_slots": {
      "actor": "body",
      "patient": "I",
      "resource": "food",
      "boundary": "metabolic sufficiency",
      "authority": null
    },
    "transition": {
      "type": "resource_deficit",
      "polarity": -0.45,
      "direction": "below_threshold",
      "state_before": "mild food deficit",
      "state_after": "food intake would restore sufficiency"
    }
  }
}
```

### A2: I could eat a horse.

```json
{
  "motif_skeleton": [
    0.72,
    0,
    0,
    0,
    0.25,
    0,
    0.45,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0.85,
    0,
    0,
    0.2,
    0,
    0,
    0
  ],
  "parameters": {
    "intensity": 0.95,
    "urgency": 0.75,
    "polarity": -0.85
  },
  "bindings": {
    "subject": "I",
    "object": "food"
  },
  "expression": {
    "language": "English",
    "is_idiom": true
  },
  "structural_frame": {
    "role_slots": {
      "actor": "body",
      "patient": "I",
      "resource": "food",
      "boundary": "metabolic sufficiency",
      "authority": null
    },
    "transition": {
      "type": "resource_deficit",
      "polarity": -0.85,
      "direction": "below_threshold",
      "state_before": "extreme food deficit",
      "state_after": "food intake would restore sufficiency"
    }
  }
}
```

### A3: My stomach is completely empty.

```json
{
  "motif_skeleton": [
    0.74,
    0,
    0,
    0,
    0.3,
    0,
    0.5,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0.9,
    0,
    0,
    0.15,
    0,
    0,
    0
  ],
  "parameters": {
    "intensity": 0.9,
    "urgency": 0.7,
    "polarity": -0.9
  },
  "bindings": {
    "subject": "my stomach",
    "object": "food"
  },
  "expression": {
    "language": "English",
    "is_idiom": false
  },
  "structural_frame": {
    "role_slots": {
      "actor": "body",
      "patient": "my stomach",
      "resource": "food",
      "boundary": "metabolic sufficiency",
      "authority": null
    },
    "transition": {
      "type": "resource_deficit",
      "polarity": -0.9,
      "direction": "below_threshold",
      "state_before": "empty stomach",
      "state_after": "food intake would restore sufficiency"
    }
  }
}
```

### B1: He was fired from his job.

```json
{
  "motif_skeleton": [
    0,
    0.95,
    0,
    0.45,
    0.85,
    0.7,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0.35,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0.9,
    0,
    0
  ],
  "parameters": {
    "intensity": 0.75,
    "urgency": 0.8,
    "polarity": -0.85
  },
  "bindings": {
    "subject": "he",
    "object": "job"
  },
  "expression": {
    "language": "English",
    "is_idiom": false
  },
  "structural_frame": {
    "role_slots": {
      "actor": "employer",
      "patient": "he",
      "resource": "job",
      "boundary": "institutional role membership",
      "authority": "employer"
    },
    "transition": {
      "type": "eject",
      "polarity": -0.85,
      "direction": "out",
      "state_before": "person inside role boundary",
      "state_after": "person outside role boundary"
    }
  }
}
```

### B2: He was given the axe.

```json
{
  "motif_skeleton": [
    0,
    0.95,
    0,
    0.45,
    0.85,
    0.7,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0.35,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0.9,
    0,
    0
  ],
  "parameters": {
    "intensity": 0.78,
    "urgency": 0.8,
    "polarity": -0.85
  },
  "bindings": {
    "subject": "he",
    "object": "job"
  },
  "expression": {
    "language": "English",
    "is_idiom": true
  },
  "structural_frame": {
    "role_slots": {
      "actor": "employer",
      "patient": "he",
      "resource": "job",
      "boundary": "institutional role membership",
      "authority": "employer"
    },
    "transition": {
      "type": "eject",
      "polarity": -0.85,
      "direction": "out",
      "state_before": "person inside role boundary",
      "state_after": "person outside role boundary"
    }
  }
}
```

### B3: Le han dado la puerta.

```json
{
  "motif_skeleton": [
    0,
    0.95,
    0,
    0.45,
    0.85,
    0.7,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0.35,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0.9,
    0,
    0
  ],
  "parameters": {
    "intensity": 0.78,
    "urgency": 0.8,
    "polarity": -0.85
  },
  "bindings": {
    "subject": "he",
    "object": "job"
  },
  "expression": {
    "language": "Spanish",
    "is_idiom": true
  },
  "structural_frame": {
    "role_slots": {
      "actor": "employer",
      "patient": "he",
      "resource": "job",
      "boundary": "institutional role membership",
      "authority": "employer"
    },
    "transition": {
      "type": "eject",
      "polarity": -0.85,
      "direction": "out",
      "state_before": "person inside role boundary",
      "state_after": "person outside role boundary"
    }
  }
}
```

### C1: The bank approved my loan.

```json
{
  "motif_skeleton": [
    0,
    0.45,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0.35,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0.25,
    0,
    0.5,
    0.65,
    0.8,
    0
  ],
  "parameters": {
    "intensity": 0.55,
    "urgency": 0.45,
    "polarity": 0.8
  },
  "bindings": {
    "subject": "the bank",
    "object": "my loan"
  },
  "expression": {
    "language": "English",
    "is_idiom": false
  },
  "structural_frame": {
    "role_slots": {
      "actor": "the bank",
      "patient": "my loan",
      "resource": "credit access",
      "boundary": "permission gate",
      "authority": "the bank"
    },
    "transition": {
      "type": "allow",
      "polarity": 0.8,
      "direction": "open",
      "state_before": "candidate awaits gate decision",
      "state_after": "access granted"
    }
  }
}
```

### C2: The bank rejected my loan.

```json
{
  "motif_skeleton": [
    0,
    0.6,
    0,
    0,
    0.85,
    0.65,
    0,
    0,
    0,
    0,
    0,
    0,
    0.35,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0.5,
    0.65,
    0,
    0
  ],
  "parameters": {
    "intensity": 0.55,
    "urgency": 0.45,
    "polarity": -0.8
  },
  "bindings": {
    "subject": "the bank",
    "object": "my loan"
  },
  "expression": {
    "language": "English",
    "is_idiom": false
  },
  "structural_frame": {
    "role_slots": {
      "actor": "the bank",
      "patient": "my loan",
      "resource": "credit access",
      "boundary": "permission gate",
      "authority": "the bank"
    },
    "transition": {
      "type": "block",
      "polarity": -0.8,
      "direction": "close",
      "state_before": "candidate awaits gate decision",
      "state_after": "access denied"
    }
  }
}
```

### D1: I am hungry.

```json
{
  "motif_skeleton": [
    0.7,
    0,
    0,
    0,
    0.25,
    0,
    0.45,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0.85,
    0,
    0,
    0.15,
    0,
    0,
    0
  ],
  "parameters": {
    "intensity": 0.55,
    "urgency": 0.55,
    "polarity": -0.65
  },
  "bindings": {
    "subject": "I",
    "object": "food"
  },
  "expression": {
    "language": "English",
    "is_idiom": false
  },
  "structural_frame": {
    "role_slots": {
      "actor": "body",
      "patient": "I",
      "resource": "food",
      "boundary": "metabolic sufficiency",
      "authority": null
    },
    "transition": {
      "type": "resource_deficit",
      "polarity": -0.65,
      "direction": "below_threshold",
      "state_before": "food deficit",
      "state_after": "food intake would restore sufficiency"
    }
  }
}
```

### D2: I am hungry for power.

```json
{
  "motif_skeleton": [
    0.35,
    0.45,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0.55,
    0.45,
    0,
    0,
    0.55,
    0,
    0,
    0,
    0.55,
    0,
    0,
    0,
    0.65,
    0,
    0
  ],
  "parameters": {
    "intensity": 0.75,
    "urgency": 0.55,
    "polarity": 0.2
  },
  "bindings": {
    "subject": "I",
    "object": "power"
  },
  "expression": {
    "language": "English",
    "is_idiom": true
  },
  "structural_frame": {
    "role_slots": {
      "actor": "I",
      "patient": "social position",
      "resource": "power",
      "boundary": "status hierarchy",
      "authority": null
    },
    "transition": {
      "type": "acquire",
      "polarity": 0.2,
      "direction": "up",
      "state_before": "insufficient power",
      "state_after": "greater authority or control"
    }
  }
}
```

### D3: I am hungry for revenge.

```json
{
  "motif_skeleton": [
    0.3,
    0.5,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0.35,
    0,
    0,
    0,
    0,
    0.45,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0.5,
    0,
    0,
    0.2,
    0,
    0.75,
    0
  ],
  "parameters": {
    "intensity": 0.85,
    "urgency": 0.65,
    "polarity": -0.85
  },
  "bindings": {
    "subject": "I",
    "object": "revenge"
  },
  "expression": {
    "language": "English",
    "is_idiom": true
  },
  "structural_frame": {
    "role_slots": {
      "actor": "I",
      "patient": "wrongdoer",
      "resource": "retribution",
      "boundary": "unresolved grievance",
      "authority": null
    },
    "transition": {
      "type": "reconcile",
      "polarity": -0.85,
      "direction": "retaliate",
      "state_before": "perceived harm unresolved",
      "state_after": "harm answered by revenge"
    }
  }
}
```

### D4: I am hungry to learn.

```json
{
  "motif_skeleton": [
    0.25,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0.6,
    0,
    0,
    0.55,
    0.45,
    0,
    0.45,
    0.65,
    0,
    0,
    0,
    0,
    0,
    0,
    0.35,
    0,
    0,
    0,
    0,
    0,
    0
  ],
  "parameters": {
    "intensity": 0.7,
    "urgency": 0.45,
    "polarity": 0.75
  },
  "bindings": {
    "subject": "I",
    "object": "learning"
  },
  "expression": {
    "language": "English",
    "is_idiom": true
  },
  "structural_frame": {
    "role_slots": {
      "actor": "I",
      "patient": "knowledge state",
      "resource": "learning",
      "boundary": "current understanding",
      "authority": null
    },
    "transition": {
      "type": "acquire",
      "polarity": 0.75,
      "direction": "expand",
      "state_before": "limited knowledge",
      "state_after": "expanded model"
    }
  }
}
```

### D5: The engine is hungry for fuel.

```json
{
  "motif_skeleton": [
    0.55,
    0.35,
    0,
    0,
    0,
    0,
    0.45,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0.35,
    0,
    0,
    0,
    0,
    0.8,
    0,
    0.25,
    0,
    0,
    0,
    0
  ],
  "parameters": {
    "intensity": 0.65,
    "urgency": 0.6,
    "polarity": -0.55
  },
  "bindings": {
    "subject": "the engine",
    "object": "fuel"
  },
  "expression": {
    "language": "English",
    "is_idiom": true
  },
  "structural_frame": {
    "role_slots": {
      "actor": "engine",
      "patient": "engine",
      "resource": "fuel",
      "boundary": "operational sufficiency",
      "authority": null
    },
    "transition": {
      "type": "resource_deficit",
      "polarity": -0.55,
      "direction": "below_threshold",
      "state_before": "fuel deficit",
      "state_after": "fuel intake would restore operation"
    }
  }
}
```

### E1: He was fired from his job.

```json
{
  "motif_skeleton": [
    0,
    0.95,
    0,
    0.45,
    0.85,
    0.7,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0.35,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0.9,
    0,
    0
  ],
  "parameters": {
    "intensity": 0.75,
    "urgency": 0.8,
    "polarity": -0.85
  },
  "bindings": {
    "subject": "he",
    "object": "job"
  },
  "expression": {
    "language": "English",
    "is_idiom": false
  },
  "structural_frame": {
    "role_slots": {
      "actor": "employer",
      "patient": "he",
      "resource": "job",
      "boundary": "institutional role membership",
      "authority": "employer"
    },
    "transition": {
      "type": "eject",
      "polarity": -0.85,
      "direction": "out",
      "state_before": "person inside role boundary",
      "state_after": "person outside role boundary"
    }
  }
}
```

### E2: The rocket was fired into space.

```json
{
  "motif_skeleton": [
    0,
    0.95,
    0,
    0,
    0.45,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0.35,
    0,
    0,
    0,
    0.5,
    0,
    0,
    0.35,
    0,
    0,
    0,
    0,
    0,
    0,
    0.45,
    0,
    0,
    0,
    0
  ],
  "parameters": {
    "intensity": 0.8,
    "urgency": 0.75,
    "polarity": 0.55
  },
  "bindings": {
    "subject": "the rocket",
    "object": "space"
  },
  "expression": {
    "language": "English",
    "is_idiom": false
  },
  "structural_frame": {
    "role_slots": {
      "actor": "launch system",
      "patient": "rocket",
      "resource": "stored thrust",
      "boundary": "launch boundary",
      "authority": "launch controller"
    },
    "transition": {
      "type": "launch",
      "polarity": 0.55,
      "direction": "out",
      "state_before": "rocket constrained on ground",
      "state_after": "rocket moving into space"
    }
  }
}
```

### E3: The gun was fired.

```json
{
  "motif_skeleton": [
    0,
    0.9,
    0,
    0,
    0.5,
    0.35,
    0,
    0,
    0,
    0,
    0,
    0,
    0.25,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0.25,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0.35,
    0,
    0
  ],
  "parameters": {
    "intensity": 0.8,
    "urgency": 0.65,
    "polarity": -0.35
  },
  "bindings": {
    "subject": "the gun",
    "object": null
  },
  "expression": {
    "language": "English",
    "is_idiom": false
  },
  "structural_frame": {
    "role_slots": {
      "actor": "trigger mechanism",
      "patient": "gun",
      "resource": "stored explosive energy",
      "boundary": "barrel",
      "authority": "shooter"
    },
    "transition": {
      "type": "discharge",
      "polarity": -0.35,
      "direction": "out",
      "state_before": "weapon loaded",
      "state_after": "weapon discharged"
    }
  }
}
```

### E4: The clay was fired in a kiln.

```json
{
  "motif_skeleton": [
    0,
    0.75,
    0.35,
    0,
    0,
    0,
    0.25,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0.45,
    0,
    0,
    0,
    0.45,
    0,
    0,
    0.35,
    0,
    0,
    0,
    0
  ],
  "parameters": {
    "intensity": 0.65,
    "urgency": 0.35,
    "polarity": 0.35
  },
  "bindings": {
    "subject": "the clay",
    "object": "kiln"
  },
  "expression": {
    "language": "English",
    "is_idiom": false
  },
  "structural_frame": {
    "role_slots": {
      "actor": "kiln",
      "patient": "clay",
      "resource": "heat",
      "boundary": "material phase",
      "authority": "potter"
    },
    "transition": {
      "type": "transform",
      "polarity": 0.35,
      "direction": "state_change",
      "state_before": "unfired clay",
      "state_after": "hardened ceramic"
    }
  }
}
```

### E5: The neuron fired.

```json
{
  "motif_skeleton": [
    0.35,
    0.75,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0.35,
    0,
    0.75,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0.65,
    0,
    0,
    0
  ],
  "parameters": {
    "intensity": 0.55,
    "urgency": 0.75,
    "polarity": 0.35
  },
  "bindings": {
    "subject": "the neuron",
    "object": null
  },
  "expression": {
    "language": "English",
    "is_idiom": false
  },
  "structural_frame": {
    "role_slots": {
      "actor": "neuron",
      "patient": "signal",
      "resource": "electrical potential",
      "boundary": "activation threshold",
      "authority": null
    },
    "transition": {
      "type": "signal_activation",
      "polarity": 0.35,
      "direction": "emit",
      "state_before": "below firing threshold",
      "state_after": "action potential emitted"
    }
  }
}
```

### F1: The doctor cleared him for surgery.

```json
{
  "motif_skeleton": [
    0,
    0.45,
    0,
    0,
    0.25,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0.35,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0.45,
    0.7,
    0.8,
    0
  ],
  "parameters": {
    "intensity": 0.55,
    "urgency": 0.5,
    "polarity": 0.8
  },
  "bindings": {
    "subject": "the doctor",
    "object": "surgery"
  },
  "expression": {
    "language": "English",
    "is_idiom": false
  },
  "structural_frame": {
    "role_slots": {
      "actor": "the doctor",
      "patient": "him",
      "resource": "surgery",
      "boundary": "permission gate",
      "authority": "the doctor"
    },
    "transition": {
      "type": "allow",
      "polarity": 0.8,
      "direction": "open",
      "state_before": "candidate awaits gate decision",
      "state_after": "access granted"
    }
  }
}
```

### F2: The doctor denied him surgery.

```json
{
  "motif_skeleton": [
    0,
    0.55,
    0,
    0,
    0.85,
    0.55,
    0,
    0,
    0,
    0,
    0,
    0,
    0.35,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0.45,
    0.7,
    0,
    0
  ],
  "parameters": {
    "intensity": 0.55,
    "urgency": 0.5,
    "polarity": -0.8
  },
  "bindings": {
    "subject": "the doctor",
    "object": "surgery"
  },
  "expression": {
    "language": "English",
    "is_idiom": false
  },
  "structural_frame": {
    "role_slots": {
      "actor": "the doctor",
      "patient": "him",
      "resource": "surgery",
      "boundary": "permission gate",
      "authority": "the doctor"
    },
    "transition": {
      "type": "block",
      "polarity": -0.8,
      "direction": "close",
      "state_before": "candidate awaits gate decision",
      "state_after": "access denied"
    }
  }
}
```

### F3: The compiler accepted the program.

```json
{
  "motif_skeleton": [
    0,
    0.45,
    0,
    0,
    0.25,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0.65,
    0,
    0,
    0.35,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0.35,
    0,
    0.75,
    0
  ],
  "parameters": {
    "intensity": 0.45,
    "urgency": 0.5,
    "polarity": 0.75
  },
  "bindings": {
    "subject": "the compiler",
    "object": "the program"
  },
  "expression": {
    "language": "English",
    "is_idiom": false
  },
  "structural_frame": {
    "role_slots": {
      "actor": "the compiler",
      "patient": "the program",
      "resource": "valid executable path",
      "boundary": "permission gate",
      "authority": "the compiler"
    },
    "transition": {
      "type": "allow",
      "polarity": 0.8,
      "direction": "open",
      "state_before": "candidate awaits gate decision",
      "state_after": "access granted"
    }
  }
}
```

### F4: The compiler rejected the program.

```json
{
  "motif_skeleton": [
    0,
    0.55,
    0,
    0,
    0.85,
    0.55,
    0,
    0,
    0,
    0,
    0,
    0,
    0.65,
    0,
    0,
    0.35,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0.35,
    0,
    0,
    0
  ],
  "parameters": {
    "intensity": 0.45,
    "urgency": 0.5,
    "polarity": -0.75
  },
  "bindings": {
    "subject": "the compiler",
    "object": "the program"
  },
  "expression": {
    "language": "English",
    "is_idiom": false
  },
  "structural_frame": {
    "role_slots": {
      "actor": "the compiler",
      "patient": "the program",
      "resource": "valid executable path",
      "boundary": "permission gate",
      "authority": "the compiler"
    },
    "transition": {
      "type": "block",
      "polarity": -0.8,
      "direction": "close",
      "state_before": "candidate awaits gate decision",
      "state_after": "access denied"
    }
  }
}
```

### F5: The firewall allowed the packet.

```json
{
  "motif_skeleton": [
    0,
    0.5,
    0,
    0,
    0.25,
    0,
    0,
    0,
    0.35,
    0,
    0,
    0,
    0.45,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0.65,
    0,
    0.8,
    0
  ],
  "parameters": {
    "intensity": 0.5,
    "urgency": 0.65,
    "polarity": 0.75
  },
  "bindings": {
    "subject": "the firewall",
    "object": "the packet"
  },
  "expression": {
    "language": "English",
    "is_idiom": false
  },
  "structural_frame": {
    "role_slots": {
      "actor": "the firewall",
      "patient": "the packet",
      "resource": "network passage",
      "boundary": "permission gate",
      "authority": "the firewall"
    },
    "transition": {
      "type": "allow",
      "polarity": 0.8,
      "direction": "open",
      "state_before": "candidate awaits gate decision",
      "state_after": "access granted"
    }
  }
}
```

### F6: The firewall blocked the packet.

```json
{
  "motif_skeleton": [
    0,
    0.55,
    0,
    0,
    0.9,
    0.55,
    0,
    0,
    0.35,
    0,
    0,
    0,
    0.45,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0.65,
    0,
    0,
    0
  ],
  "parameters": {
    "intensity": 0.5,
    "urgency": 0.65,
    "polarity": -0.75
  },
  "bindings": {
    "subject": "the firewall",
    "object": "the packet"
  },
  "expression": {
    "language": "English",
    "is_idiom": false
  },
  "structural_frame": {
    "role_slots": {
      "actor": "the firewall",
      "patient": "the packet",
      "resource": "network passage",
      "boundary": "permission gate",
      "authority": "the firewall"
    },
    "transition": {
      "type": "block",
      "polarity": -0.8,
      "direction": "close",
      "state_before": "candidate awaits gate decision",
      "state_after": "access denied"
    }
  }
}
```

## Interpretation

- Categories A and B show whether the 32-D skeleton groups structurally equivalent sentences across intensity, idiom, and language.
- Category C is the control: both examples share lexical entities, but approval and rejection should diverge structurally.
- Categories D and E are adversarial polysemy checks: repeated surface words should not force identical motif skeletons.
- Category F expands the opposite-transition control across medicine, compilers, and firewalls.
- `32-D motif skeleton` is cosine similarity over the raw motif vector.
- `Typed frame` combines motif schema, transition family, polarity, and direction; it is meant to catch cases where raw motif cosine stays high because two utterances share a gate schema but disagree on the outcome.
- This run uses a local lexical baseline, not a remote commercial semantic embedding API, so the baseline should be read as a reproducible no-credentials proxy.
