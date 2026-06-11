# motif2vec Training Report

## Model

- Name: `motif-embed-v0`
- Type: no-dependency hashed n-gram linear regressor
- Feature dimensions: 2048
- Output dimensions: 32
- Epochs: 9

This is the runnable local baseline for the embedding library. It preserves the 32-D output contract that a future MiniLM regressor should share.

## Split Metrics

| Split | Rows | Cosine | MAE | RMSE | Active motif recall@4 |
| --- | ---: | ---: | ---: | ---: | ---: |
| train | 8056 | 0.9992 | 0.0053 | 0.0135 | 0.9717 |
| dev | 994 | 0.9947 | 0.0068 | 0.0282 | 0.9645 |
| test | 1022 | 0.9903 | 0.0076 | 0.0305 | 0.9650 |

## Retrieval Pair Evaluation

- Pairs evaluated: 60
- Passed: 45/60
- Positive cross-domain accuracy: 0.8125
- Hard-negative accuracy: 0.5000

| Pair | Relation | Predicted similarity | Pass |
| --- | --- | ---: | --- |
| authority_reconciles_divergence:positive:1 | positive_cross_domain | 0.9862 | yes |
| authority_reconciles_divergence:positive:2 | positive_cross_domain | 0.9944 | yes |
| authority_reconciles_divergence:positive:3 | positive_cross_domain | 0.7195 | no |
| authority_reconciles_divergence:positive:4 | positive_cross_domain | 0.8818 | yes |
| authority_reconciles_divergence:hard-negative | hard_negative | 0.7602 | yes |
| boundary_blocks_invalid_transition:positive:1 | positive_cross_domain | 0.9888 | yes |
| boundary_blocks_invalid_transition:positive:2 | positive_cross_domain | 0.9945 | yes |
| boundary_blocks_invalid_transition:positive:3 | positive_cross_domain | 0.8982 | yes |
| boundary_blocks_invalid_transition:positive:4 | positive_cross_domain | 0.8612 | yes |
| boundary_blocks_invalid_transition:hard-negative | hard_negative | 0.8624 | no |
| local_success_global_failure:positive:1 | positive_cross_domain | 0.9951 | yes |
| local_success_global_failure:positive:2 | positive_cross_domain | 0.9941 | yes |

## Next Trainer

Replace this baseline with `all-MiniLM-L6-v2 -> 32-D regression head` once the Python torch/sentence-transformers stack is installed. Keep the same JSONL inputs, report metrics, and output contract.
