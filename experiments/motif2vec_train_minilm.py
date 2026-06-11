#!/usr/bin/env python3
"""Train a MiniLM-backed motif2vec regressor.

This is the intended next trainer for motif-embed-v1. It requires optional
Python ML dependencies that are intentionally not vendored into this repo:

    python3.11 -m pip install sentence-transformers scikit-learn numpy joblib
    python3.11 experiments/motif2vec_train_minilm.py

The no-dependency TypeScript trainer remains the runnable baseline.
"""

from __future__ import annotations

import json
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = PROJECT_ROOT / "artifacts" / "motif2vec"
MODEL_DIR = PROJECT_ROOT / "models" / "motif-embed-minilm-v1"
REPORT_PATH = PROJECT_ROOT / "motif2vec_minilm_training.md"


def read_jsonl(path: Path) -> list[dict]:
    return [json.loads(line) for line in path.read_text().splitlines() if line.strip()]


def main() -> None:
    try:
        import joblib
        import numpy as np
        from sentence_transformers import SentenceTransformer
        from sklearn.linear_model import Ridge
        from sklearn.metrics import mean_absolute_error, mean_squared_error
    except Exception as exc:  # pragma: no cover - dependency gate
        raise SystemExit(
            "Missing optional MiniLM training dependencies. Install with:\n"
            "python3.11 -m pip install sentence-transformers scikit-learn numpy joblib\n"
            f"Original import error: {exc}"
        )

    train = read_jsonl(DATA_DIR / "train.jsonl")
    dev = read_jsonl(DATA_DIR / "dev.jsonl")
    test = read_jsonl(DATA_DIR / "test.jsonl")

    encoder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    x_train = encoder.encode([row["text"] for row in train], normalize_embeddings=True, show_progress_bar=True)
    y_train = np.array([row["motif_vector"] for row in train], dtype=np.float32)

    regressor = Ridge(alpha=1.0)
    regressor.fit(x_train, y_train)

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    encoder.save(str(MODEL_DIR / "encoder"))
    joblib.dump(regressor, MODEL_DIR / "ridge_head.joblib")

    rows = []
    for name, split in [("train", train), ("dev", dev), ("test", test)]:
        x = encoder.encode([row["text"] for row in split], normalize_embeddings=True, show_progress_bar=False)
        y = np.array([row["motif_vector"] for row in split], dtype=np.float32)
        pred = np.clip(regressor.predict(x), 0.0, 1.0)
        cosine = np.mean(np.sum(pred * y, axis=1) / ((np.linalg.norm(pred, axis=1) * np.linalg.norm(y, axis=1)) + 1e-12))
        mae = mean_absolute_error(y, pred)
        rmse = mean_squared_error(y, pred) ** 0.5
        rows.append((name, len(split), cosine, mae, rmse))

    REPORT_PATH.write_text(
        "\n".join(
            [
                "# motif2vec MiniLM Training Report",
                "",
                "- Encoder: `sentence-transformers/all-MiniLM-L6-v2`",
                "- Head: `sklearn.linear_model.Ridge(alpha=1.0)`",
                "",
                "| Split | Rows | Cosine | MAE | RMSE |",
                "| --- | ---: | ---: | ---: | ---: |",
                *[f"| {name} | {count} | {cos:.4f} | {mae:.4f} | {rmse:.4f} |" for name, count, cos, mae, rmse in rows],
                "",
            ]
        )
    )
    print(f"MiniLM motif model written to {MODEL_DIR}")
    print(f"MiniLM training report written to {REPORT_PATH}")


if __name__ == "__main__":
    main()
