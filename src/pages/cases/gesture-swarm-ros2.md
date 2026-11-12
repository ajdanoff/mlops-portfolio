---
layout: ../../layouts/MainLayout.astro
title: "Gesture Swarm ROS 2: Vision-Based Robotic Swarm Control"
---

# Gesture Swarm ROS 2: Vision-Based Robotic Swarm Control

### 🛠️ Infrastructure Overview
A modular **ROS 2 Python** package implementing a real-time perception-to-action pipeline for gesture-controlled mobile robot swarms. Using **YOLO11n** American Sign Language (ASL) detection and `turtlesim` as a kinematic verification environment, the architecture decouples raw computer vision inference from temporal command parsing and actuator velocity execution.

- **Source Code Repository:** [gesture-swarm-ros2](https://github.com/ajdanoff/gesture-swarm-ros2)
- **Benchmark Documentation:** [Benchmark Datasets Wiki](https://github.com/ajdanoff/gesture-swarm-ros2/wiki/Benchmark-datasets)
- **Primary Tech Stack:** ROS 2 (Humble / Lyrical) // Python 3.10+ // Ultralytics YOLO11n // OpenCV // Temporal RANSAC // `turtlesim`

---

## 🏗️ Modular ROS 2 Node Graph & Topic Topology

Instead of coupling camera capture directly to motor commands inside a monolithic script, the package splits responsibilities across three independent ROS 2 nodes and two pure-Python core logic modules:

```text
[ Webcam Stream ] ──► gesture_detector_node (YOLO11n)
                             │
                             ▼ publishes /gesture/symbol
                      command_parser_node
                      ├── symbol_filter.py (Consecutive Deduplication)
                      └── command_parser.py (Rolling Window + RANSAC Consensus)
                             │
                             ▼ publishes JSON to /swarm/command
                      turtlesim_controller_node
                             │
                             ▼ publishes geometry_msgs/Twist to /turtle1/cmd_vel
                      [ turtlesim_node (Kinematic Simulation) ]
```

### Core Package Components
* **`gesture_detector_node`:** Captures live webcam frames (`camera_id`), runs real-time **YOLO11n** inference, and publishes recognized ASL gesture symbols to `/gesture/symbol`.
* **`command_parser_node`:** Subscribes to the raw symbol stream, filters transient noise via `symbol_filter.py` (deduplication of consecutive identical detections), and delegates sequence interpretation to pure-Python `command_parser.py`.
* **`turtlesim_controller_node`:** Translates structured JSON payloads from `/swarm/command` into continuous linear and angular velocity commands on `/turtle1/cmd_vel`.

---

## 🔬 Temporal Consensus & Command Grammar

Raw frame-by-frame object detection on live video streams suffers from transient flickering and misclassifications. Sending unbuffered predictions directly to mobile agents causes erratic trajectory jitter.

To ensure deterministic swarm control, `command_parser.py` enforces a multi-stage filtering and consensus pipeline:

1. **Consecutive Symbol Deduplication (`symbol_filter.py`):** Suppresses redundant frame-level noise before tokens enter the command buffer.
2. **Rolling Window & RANSAC-Style Temporal Consensus:** Evaluates recent symbol history inside a sliding window, applying RANSAC-style consensus voting to extract stable motion primitives (`A`, `B`, `F`, `L`, `R`, `U`, `D`) while rejecting isolated outliers.
3. **Safety-Critical Emergency Stop Override:** Assigns immediate priority interrupt handling to symbol `A`, bypassing window accumulation to halt agent motion instantly.
4. **Structured Task Parsing & JSON Serialization:** Supports multi-token task grammar (`T ...`) and serializes validated directives into clean JSON payloads over `/swarm/command`.

---

## 📊 Held-Out Webcam Benchmarking & Cross-Model Evaluation

To validate perception reliability outside of training splits, the repository integrates two held-out webcam datasets published on Hugging Face under a unified **36-class YOLO label space** (`0–9` digits, `10–35` letters `A–Z`):

* **[ASL Webcam Benchmark — Original](https://huggingface.co/datasets/ajdanoff/asl-webcam-benchmark-original):** 36 raw webcam frames (1 per class) serving as a single-frame smoke test.
* **[ASL Webcam Benchmark — Augmented](https://huggingface.co/datasets/ajdanoff/asl-webcam-benchmark-augmented):** 216 frames combining original captures with 5 deterministic mutations per class (crops, rotations, flips, HSV/gamma shifts, blur, and Gaussian noise).

### Symbol-Based Evaluation Protocol
Because unified detectors (`0–35`), digit-only specialists (`0–9`), and letter-only specialists (`0–25`) use different internal class-index ranges, the evaluation harness maps both ground-truth IDs and model predictions back to their canonical ASCII symbols—counting a true positive only when symbols match and bounding-box **IoU ≥ 0.45**.
