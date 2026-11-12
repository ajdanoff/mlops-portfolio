---
layout: ../../layouts/MainLayout.astro
title: "CI/CD Model Benchmarking Pipeline: ASL Gesture Recognition"
---

# CI/CD Model Benchmarking Pipeline: ASL Gesture Recognition

### 🛠️ Infrastructure & Model Evolution Overview
A production-oriented automation workflow built to enforce strict **Quality Gates** on computer vision model deployments within a ROS 2 robotic swarm context. The core ecosystem handles automated dataset conversion, multi-pass bounding-box generation fallbacks, and real-time model benchmarking across held-out webcam data streams to isolate and measure domain gaps before deployment.

- **Source Code Repository:** [asl-gesture-recognition](https://github.com/ajdanoff/asl-gesture-recognition)
- **Active Pipeline Run:** [GitHub Actions Run #42774090717](https://github.com/ajdanoff/asl-gesture-recognition/actions/runs/42774090717)
- **Core Pipeline Execution Metric:** `Succeeded in 2m 6s`

---

## 🏗️ Architecture & Specialist Model Evolution

To reduce visual confusion between motion-critical execution characters and similar digits, the architecture was intentionally transitioned from a single unified network into specialized, discrete detectors.

```text
                                [ Входящий Снимок / Видеокадр ]
                                               │
                       ┌───────────────────────┴───────────────────────┐
                       ▼                                               ▼
         [ Specialist Digit Detector ]                   [ Specialist Letter Detector ]
         ├── 10 Classes (0-9)                            ├── 26 Classes (A-Z)
         ├── Input: 512×512, AdamW                       ├── Input: 512×512, AdamW
         └── mAP@0.50: 0.990                             └── mAP@0.50: 0.986
```

### 1. The Validation Matrix & Improvements
Separating the tasks into independent specialist detectors yielded distinct performance improvements over the baseline unified 36-class architecture:

| Model Architecture | Evaluated Class Split | Precision | Recall | mAP@0.50 | mAP@0.50:0.95 |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Unified YOLO11n MP** | Full Set (36 classes) | 0.942 | 0.940 | 0.961 | 0.911 |
| **Specialist Digits (YOLO11n)** | Digits Only (0-9) | **0.989** | **0.982** | **0.990** | **0.933** |
| **Specialist Letters (YOLO11n)** | Letters Only (A-Z) | **0.976** | **0.964** | **0.986** | 0.903 |

### 2. Multi-Pass Dataset Conversion Pipeline
To construct reliable datasets out of heterogeneous Kaggle and custom webcam sources, a robust two-pass pipeline was designed:
* **Primary Pass:** Extracts hand coordinates using `MediaPipe HandLandmarker` to construct high-accuracy bounding boxes.
* **Secondary Pass (YOLO Fallback):** Integrates a class-matched YOLO model wrapper to provide bounding boxes when MediaPipe markers fail.
* **Tertiary Pass (Normalized Centered Fallback):** Calculates image-size-aware bounding box center statistics and injects a custom normalized expansion margin to avoid overly restricted regions of interest.

---

## 🚀 Cross-Model MLOps Evaluation Framework

Standard YOLO metric tools break down when evaluating specialized models because narrowing the class boundaries (e.g., dropping letters to keep only digits 0–9) alters the underlying class-index mappings. 

To bridge this gap and establish reproducible integration testing, I built a custom **symbol-based matching evaluation engine** inside the pytest verification suite.

```text
[Ground Truth Class Index] ──► Map to Character Symbol (e.g., 'A')
                                      │
                                      ▼
                        [ Run Inference Evaluation ]
                                      │
                                      ▼
[Model Predicted Index]    ──► Map back via Model's Internal Names Map
                                      │
                                      ▼
                      Verify: Symbols Match && IoU >= 0.45
```

### Held-Out Webcam Benchmarking & Domain Gap Analysis
Every automated build evaluates model weights against two severe, completely out-of-distribution external datasets published as release assets:
1. **ASL Webcam Benchmark — Original (36 Images):** Serves as a baseline smoke test using one raw real-world frame per class.
2. **ASL Webcam Benchmark — Augmented (216 Images):** Applies 5 aggressive deterministic computer vision mutations per class (including rotations, translations, horizontal flips, gamma shifts, and Gaussian noise) to map systemic model failure points.

```text
               [ Shared Webcam Benchmark Recall Metrics ]
┌───────────────────────────────┬───────────────────────────────┐
│ Original Benchmark            │ Augmented Benchmark           │
├───────────────────────────────┼───────────────────────────────┤
│ Unified Model:  44.44%        │ Unified Model:  24.07%        │
│ Digit Model:    60.00%        │ Digit Model:    46.67%        │
│ Letter Model:   38.46%        │ Letter Model:   30.13%        │
└───────────────────────────────┴───────────────────────────────┘
```
**Diagnostic Finding:** The performance discrepancy reveals a clear domain gap between laboratory training datasets and raw webcam streams. Classes such as `C`, `G`, `M`, and `U` drop performance significantly under specific spatial flips and lighting distortions, pointing to exact data augmentation targets required before deploying firmware onto the live robotic platforms.

---

## ⚙️ Automated CI/CD Quality Gate Configuration

The automated pipeline executes via GitHub Actions on every pull request, handling model validation scripts, runtime dependency isolation, and regression verification checks inside a strict execution window.

```yaml
name: Run ASL webcam benchmark
on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  benchmark:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Python Context
        uses: actions/setup-python@v5
        with:
          python-version: '3.10'
          cache: 'pip'

      - name: Install Runtime Stack
        run: |
          pip install -r requirements.txt

      - name: Run Cross-Model Symbol Benchmark Tests
        run: |
          python -m pytest tests/ -v --color=yes
```

---

## 📈 Key Production Takeaways

* **Specialization Validated:** Isolating digits into a dedicated network achieved an absolute increase of **+4.7% in Precision** and **+4.2% in Recall** on the validation set, validating the platform's multi-model architectural design.
* **Fail-Fast Enforcement:** If an engineer alters a hyperparameter or pushes weights that result in missing critical motion commands (such as the directional instructions `A`, `B`, `F`, `L`, `R`), the symbol-based validation suite halts the build and prevents deployment.
* **Resource Optimization:** The entire sequence—including dependency layer compilation, weight parsing, and evaluating 216 augmented images via pytest—completes within an optimized processing window of **2 minutes 6 seconds**.
