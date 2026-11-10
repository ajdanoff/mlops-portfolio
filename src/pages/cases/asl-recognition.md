---
layout: ../../layouts/MainLayout.astro
title: "CI/CD Model Benchmarking Pipeline: ASL Gesture Recognition"
---

# CI/CD Model Benchmarking Pipeline: ASL Gesture Recognition

### 🛠️ Infrastructure Overview
A production-oriented automation workflow built to enforce **Quality Gates** on computer vision model deployments. The core system validates deep learning model inferences across structured multi-variant augmented datasets, ensuring no performance regressions reach rollout.

- **Source Code Repository:** [://github.com](https://://github.com)
- **Active Pipeline Run:** [GitHub Actions Run #42774090717](https://://github.com/actions/runs/42774090717)
- **Pipeline Execution Metric:** `Succeeded in 2m 6s`

---

## 🏗️ Architecture & Core Components

The pipeline manages an asynchronous lifecycle designed to split runtime dependencies and achieve highly reproducible model evaluations:

```text
[Commit/Push Trigger] 
       │
       ▼
┌────────────────────────────────────────────────────────┐
│ GitHub Actions Runner (Ubuntu Latest)                  │
│ ├── 1. Setup Isolated Python 3.10 Context              │
│ ├── 2. Pull Target Dataset Matrix                      │
│ └── 3. Cache & Initialize Ultralytics Hub Dependencies  │
└───────────────────────┬────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│ Automated Quality Validation Gate                      │
│ ├── Run symbol-based inference matching (36 classes)   │
│ ├── Evaluate Original vs. 5x Augmented Variants        │
│ └── Export precise confusion matrix data logs          │
└───────────────────────┬────────────────────────────────┘
                        │
                        ▼
[Green Build Flag Issued] ──► [Release Branch Merged]
```

### 1. The Multi-Variant Evaluation Matrix
Instead of evaluating models against loose, unversioned validation data, this framework checks inference accuracy across two held-out webcam benchmark subsets sharing a unified **36-class YOLO label space** (0–9 digits, 10–35 letters A–Z):
* **ASL Webcam Benchmark — Original:** Baselines pure, uncontrolled real-world captures.
* **ASL Webcam Benchmark — Augmented:** Injects 5 controlled computer-vision structural mutations per class to stress-test bounding box localization stability.

### 2. Custom Symbol-Based Evaluation Parser
Standard YOLO index matching fails when comparing unified models against single-domain (digit-only or letter-only) variations due to internal class-index shifting. To bypass this, I implemented an abstract **symbol-based matching validation layer** that maps model indexes directly back to their true ASCII character representation, delivering objective, cross-model precision metrics.

---

## 🚀 CI/CD Pipeline Implementation Details

The underlying automation wrapper is running live via GitHub Actions, executing the entire runtime validation flow within an isolated virtual container runner:

```yaml
# Engineering excerpt from the active deployment manifest
name: Run ASL webcam benchmark
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  benchmark:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.10'
          cache: 'pip'

      - name: Execute Validation Suite
        run: |
          pip install -r requirements.txt
          python -m pytest tests/ -v --color=yes
```

---

## 📊 Performance & Production Impact

* **Fail-Safe Integrity:** Any modification to model weight thresholds or layers that scales down `mAP@0.5:0.95` boundaries automatically triggers a pipeline failure, blocking the code integration before it ever breaks an downstream service.
* **Execution Boundary:** Optimized dependency caching drops cold runner setup overhead, executing complete dataset pulls, multi-epoch model loading, and testing footprints inside a strict `2m 6s` processing budget.
