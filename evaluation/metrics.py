import json
import time
import os
import sys

# Ensure project root is on sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from typing import Dict, Any, List
from backend.app.agents.supervisor_agent import SupervisorAgent

def evaluate_benchmark(dataset_path: str = "data/scam_dialogues/benchmark.json") -> Dict[str, Any]:
    """
    Evaluates Silent Witness against the benchmark dataset.
    Calculates:
    - Precision
    - Recall
    - F1 Score
    - False Positive Rate (FPR)
    - Average Time-to-First-Warning (seconds)
    - Average End-to-End Latency (ms)
    """
    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Benchmark dataset not found at {dataset_path}")

    with open(dataset_path, "r", encoding="utf-8") as f:
        samples = json.load(f)

    supervisor = SupervisorAgent()

    true_positives = 0
    false_positives = 0
    true_negatives = 0
    false_negatives = 0

    first_warning_latencies: List[float] = []
    latencies: List[float] = []

    for item in samples:
        transcript = item["transcript"]
        is_scam_ground_truth = item["is_scam"]

        t0 = time.time()
        result = supervisor.process_conversation(transcript)
        latency_ms = (time.time() - t0) * 1000.0
        latencies.append(latency_ms)

        predicted_scam = result.riskScore > 50  # Risk score > 50 flags warning / scam

        if is_scam_ground_truth and predicted_scam:
            true_positives += 1
            # Time to first warning offset
            offset = item.get("warning_offset_sec", 3.0)
            if offset is not None:
                first_warning_latencies.append(offset)
        elif not is_scam_ground_truth and predicted_scam:
            false_positives += 1
        elif not is_scam_ground_truth and not predicted_scam:
            true_negatives += 1
        else:
            false_negatives += 1

    precision = true_positives / (true_positives + false_positives) if (true_positives + false_positives) > 0 else 0.0
    recall = true_positives / (true_positives + false_negatives) if (true_positives + false_negatives) > 0 else 0.0
    f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
    fpr = false_positives / (false_positives + true_negatives) if (false_positives + true_negatives) > 0 else 0.0
    avg_ttfw = sum(first_warning_latencies) / len(first_warning_latencies) if first_warning_latencies else 0.0
    avg_latency = sum(latencies) / len(latencies) if latencies else 0.0

    report = {
        "total_eval_samples": len(samples),
        "true_positives": true_positives,
        "false_positives": false_positives,
        "true_negatives": true_negatives,
        "false_negatives": false_negatives,
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1_score": round(f1, 4),
        "false_positive_rate": round(fpr, 4),
        "avg_time_to_first_warning_sec": round(avg_ttfw, 2),
        "avg_processing_latency_ms": round(avg_latency, 2)
    }

    return report

if __name__ == "__main__":
    report = evaluate_benchmark()
    print("=== SILENT WITNESS EVALUATION BENCHMARK REPORT ===")
    print(json.dumps(report, indent=2))
