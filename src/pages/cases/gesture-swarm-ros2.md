---
layout: ../../layouts/MainLayout.astro
title: "Gesture Swarm ROS 2: Vision-Based Robotic Coordination"
---

# Gesture Swarm ROS 2: Vision-Based Robotic Coordination

### 🛠️ Project Overview

A ROS 2 package for gesture-controlled robot-swarm coordination. It uses a webcam, a YOLO11n-based ASL gesture detector, temporal symbol filtering, and structured JSON commands to control a turtle agent in `turtlesim` as a demonstration environment.

- **Source Code Repository:** [GitHub — gesture-swarm-ros2](https://github.com/ajdanoff/gesture-swarm-ros2)
- **Primary Tech Stack:** ROS 2 · Python 3.10+ · YOLO11n / Ultralytics · OpenCV · turtlesim · JSON messaging
- **Benchmark Datasets:** [Original](https://huggingface.co/datasets/ajdanoff/asl-webcam-benchmark-original) · [Augmented](https://huggingface.co/datasets/ajdanoff/asl-webcam-benchmark-augmented)

---

## 🔄 Perception-to-Command Pipeline

The system converts visual gesture detections into robust swarm commands through a modular ROS 2 node graph:

```text
[ Webcam ]
    │
    ▼
[ gesture_detector_node ]
    │  YOLO11n inference
    ▼
[ /gesture/symbol ]
    │
    ▼
[ command_parser_node ]
    │  Temporal consensus + command parsing
    ▼
[ /swarm/command — JSON ]
    │
    ▼
[ turtlesim_controller_node ]
    │
    ▼
[ /turtle1/cmd_vel ]
```

- **`gesture_detector_node`** captures webcam frames, runs YOLO11n inference, and publishes recognized gesture symbols to `/gesture/symbol`.
- **`command_parser_node`** accumulates recent symbols, applies temporal consensus, parses motion and task commands, and publishes JSON messages to `/swarm/command`.
- **`turtlesim_controller_node`** maps the resulting commands to velocity messages on `/turtle1/cmd_vel`.
- **`command_parser.py`** contains the framework-independent parsing logic.
- **`symbol_filter.py`** removes duplicate consecutive detections before command interpretation.

---

## 🧠 Temporal Symbol Consensus

A single incorrect or unstable detection should not immediately change robot behavior. The command parser maintains a rolling window of recent symbols and applies a RANSAC-style temporal-consensus approach to identify a stable motion command.

Supported motion commands include:

- `F` — forward
- `B` — backward
- `L` — turn left
- `R` — turn right
- `U` — increase speed
- `D` — decrease speed
- `A` — emergency stop override

The parser also supports basic structural task commands using the `T ...` format. Final commands are serialized as JSON and published on `/swarm/command`.

---

## 📊 Benchmark Datasets

Two held-out webcam benchmarks support evaluation of YOLO-based ASL digit and letter detectors:

| Dataset | Contents | Purpose |
|---|---|---|
| [ASL Webcam Benchmark — Original](https://huggingface.co/datasets/ajdanoff/asl-webcam-benchmark-original) | One image per gesture class | Baseline symbol-recognition evaluation |
| [ASL Webcam Benchmark — Augmented](https://huggingface.co/datasets/ajdanoff/asl-webcam-benchmark-augmented) | 216 images: 36 originals and five controlled augmented variants per class | Robustness evaluation under framing, scale, rotation, lighting, blur, noise, and compression changes |

Both datasets use a shared 36-class YOLO label space: class IDs `0–9` represent digits and `10–35` represent letters `A–Z`. Evaluation uses symbol-based matching, so it remains valid for unified, digit-only, and letter-only models despite differences in their internal class-index ranges. [1]

The augmented benchmark is explicitly a robustness stress test rather than a substitute for a larger multi-session held-out test set; its results should therefore be interpreted as augmentation robustness, not as a complete estimate of real-world gesture-recognition accuracy. [1]

---

## 🚀 Running the Demo

```bash
# Terminal 1 — turtlesim
ros2 run turtlesim turtlesim_node

# Terminal 2 — gesture detector
ros2 run gesture_swarm_ros2 gesture_detector_node --ros-args -p camera_id:=0

# Terminal 3 — command parser
ros2 run gesture_swarm_ros2 command_parser_node

# Terminal 4 — turtlesim controller
ros2 run gesture_swarm_ros2 turtlesim_controller_node
```

Show ASL gesture symbols such as `A`, `B`, `F`, `L`, `R`, `U`, and `D` to control the turtle.