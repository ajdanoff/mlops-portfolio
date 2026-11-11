---
layout: ../../layouts/NoteLayout.astro
title: "Unified vs. Specialist YOLO11n Detectors: Failure-Mode Diagnostics on Held-Out Webcam Benchmarks"
pubDate: "2026-11-11"
readTime: "8 min read"
description: "An empirical failure-mode analysis of unified 36-class versus specialist digit and letter YOLO11n detectors across original and augmented webcam benchmarks, using automated CI benchmark telemetry."
tags: ["computer-vision", "yolo11", "benchmarking", "mlops", "ci-cd", "error-analysis"]
---

Decomposing American Sign Language (ASL) detection into dedicated specialist
models can reduce confusion between visually similar hand shapes, such as `0`
versus `O` or `2` versus `V`, in the robotic swarm-control system
(`gesture-swarm-ros2`).

This analysis compares three YOLO11n detectors:

- [ASL Unified Webcam Gesture Detector](https://huggingface.co/ajdanoff/asl-unified-webcam-yolo11n-mp)
- [ASL Unified Digits Gesture Detector](https://huggingface.co/ajdanoff/asl-unified-digits-yolo11n-mp)
- [ASL Unified Letters Gesture Detector](https://huggingface.co/ajdanoff/asl-unified-letters-yolo11n-mp)

The models were evaluated on two published held-out webcam benchmarks:

- [ASL Webcam Benchmark — Original](https://huggingface.co/datasets/ajdanoff/asl-webcam-benchmark-original):
  36 gesture frames plus 1 background frame.
- [ASL Webcam Benchmark — Augmented](https://huggingface.co/datasets/ajdanoff/asl-webcam-benchmark-augmented):
  216 gesture frames plus 6 background frames.

Detection matches require the predicted symbol to equal the ground-truth symbol
and the intersection-over-union (IoU) between the predicted and ground-truth
bounding boxes to be at least 0.45.

Specialist models are evaluated only against ground-truth annotations within
their own class domains. The digit-only model is evaluated against 10 digit
annotations in the original benchmark and 60 digit annotations in the augmented
benchmark. The letter-only model is evaluated against 26 letter annotations in
the original benchmark and 156 letter annotations in the augmented benchmark.
Out-of-domain annotations are excluded from the recall denominator and from the
missed-class report.

## Benchmark telemetry and performance summary

Although all models achieved high precision and mAP@0.50 on their respective
validation splits, held-out webcam evaluation revealed a substantial domain gap.

| Benchmark | Model | Evaluation domain | In-domain ground truth | True positives | Recall | Background false positives |
|---|---|---|---:|---:|---:|---:|
| Original | [Unified Webcam](https://huggingface.co/ajdanoff/asl-unified-webcam-yolo11n-mp) | `0–9`, `A–Z` | 36 | 16 | 44.44% | 0/1 |
| Original | [Digits Specialist](https://huggingface.co/ajdanoff/asl-unified-digits-yolo11n-mp) | `0–9` | 10 | 6 | 60.00% | 0/1 |
| Original | [Letters Specialist](https://huggingface.co/ajdanoff/asl-unified-letters-yolo11n-mp) | `A–Z` | 26 | 10 | 38.46% | 0/1 |
| Augmented | [Unified Webcam](https://huggingface.co/ajdanoff/asl-unified-webcam-yolo11n-mp) | `0–9`, `A–Z` | 216 | 50 | 23.15% | 1/6 |
| Augmented | [Digits Specialist](https://huggingface.co/ajdanoff/asl-unified-digits-yolo11n-mp) | `0–9` | 60 | 25 | 41.67% | 0/6 |
| Augmented | [Letters Specialist](https://huggingface.co/ajdanoff/asl-unified-letters-yolo11n-mp) | `A–Z` | 156 | 43 | 27.56% | 1/6 |

The digit-only detector achieved the highest recall on both benchmarks. On the
original benchmark, it detected 6 of 10 digit gestures. On the augmented
benchmark, it detected 25 of 60 digit instances.

The lower augmented-benchmark results indicate that the current augmentation
pipeline is substantially more challenging than the models’ training and
validation distributions. Because all augmented variants derive from the same
36 source webcam images, the augmented benchmark measures robustness to
controlled transformations rather than providing an independent multi-session
estimate of real-world performance.

## Failure-mode diagnostics

### Background false-positive suppression

Training with negative room frames appears to have suppressed background
hallucinations effectively. The digit-only model produced no false positives on
either the single original background frame or the six augmented background
frames.

The unified and letter-only models each produced one false positive across the
six augmented background frames. This is a useful signal that background
training helps, but the small number of background images means it should not
be treated as a definitive comparison.

A background false positive is defined as a model detection on an image with no
ground-truth gesture annotation. Background images are excluded from the recall
denominator but remain useful for measuring unwanted detections.

### Localization versus classification

Several logged misses were not necessarily symbol misclassifications. In the
benchmark telemetry, some predictions assigned the correct symbol but failed the
IoU threshold because their bounding boxes were extremely large or poorly
localized.

Examples included near-full-frame predictions spanning approximately the entire
640 × 480 image, as well as boxes shifted by aggressive crop transformations.
These cases suggest that localization quality, rather than symbol recognition
alone, contributed to the benchmark failures.

The conversion pipeline’s fallback boxes are a plausible contributor: when
MediaPipe does not provide a reliable hand box, a class- and image-size-aware
centered fallback can produce an oversized or poorly positioned box. This
hypothesis should be verified by inspecting the affected predictions and their
associated fallback source before changing the loss function.

### Cross-domain triggering

Running specialist models across the full 36-class benchmark exposed
cross-domain triggering. For example, the letter-only model produced
high-confidence `F` predictions on digit frames, while the digit-only model
produced predictions on letter frames.

This does not necessarily mean that the specialist models are inherently
inferior. It does show that deploying them without an application-level domain
gate can create false positives outside their intended recognition context.

For the ROS 2 swarm-control system, specialist detectors should therefore be
gated by an explicit interaction state: for example, a numeric-entry state may
activate the digit detector, while a command-letter state may activate the
letter detector.

### Chirality and horizontal flipping

Horizontal flip augmentations appeared to induce severe structural confusions.
Observed examples included `M` being interpreted as `A`, `Z` as `D`, and `G` as
`P`; digit `2` was also confused with `3`, and `4` with `9`.

These observations support restricting horizontal flips for asymmetric ASL
gestures, where handedness and spatial orientation can alter the visual
structure of the sign. Before changing the training configuration, inspect the
original and flipped variants for each affected class to separate genuine
chirality sensitivity from crop, scale, or localization artifacts.

## Reproducibility

Results were generated by the automated benchmark workflow at evaluator commit
[`93d259c`](https://github.com/ajdanoff/asl-gesture-recognition/commit/93d259cca2121bb23a4f5f9ec6d938df9c0cb907).

| Setting | Value |
|---|---|
| Evaluator commit | [`93d259c`](https://github.com/ajdanoff/asl-gesture-recognition/commit/93d259cca2121bb23a4f5f9ec6d938df9c0cb907) |
| Confidence threshold | 0.25 |
| IoU threshold | 0.45 |
| Matching rule | Symbol matching |
| Ultralytics settings version | 0.0.8 |
| Benchmark revision | v1.0.0 |

| Model | Hugging Face repository | Model revision |
|---|---|---|
| Unified Webcam | [`ajdanoff/asl-unified-webcam-yolo11n-mp`](https://huggingface.co/ajdanoff/asl-unified-webcam-yolo11n-mp) | `d3d43f88b6e03cb6f2d8a9eb31a0c92e1e61197b` |
| Digits Specialist | [`ajdanoff/asl-unified-digits-yolo11n-mp`](https://huggingface.co/ajdanoff/asl-unified-digits-yolo11n-mp) | `34ba348ac8064ee1fd270146e85ee3853be48495` |
| Letters Specialist | [`ajdanoff/asl-unified-letters-yolo11n-mp`](https://huggingface.co/ajdanoff/asl-unified-letters-yolo11n-mp) | `e81224f2c93dfc592815b45de914fe3ebc9a3425` |

The model revision identifiers refer to the Hugging Face repository revisions
from which the `.pt` weights were downloaded during the benchmark run. They
identify the exact published model state used for evaluation.

Earlier manually reported benchmark values may differ from the values in this
report if they used a different evaluator version, confidence threshold,
matching implementation, or model revision. The values above should therefore
be interpreted as the output of this specific reproducible CI evaluation
configuration.

## Next engineering actions

1. **Restrict horizontal flips for chirality-sensitive gestures.** Disable
   horizontal flips during training and benchmark augmentation for asymmetric
   ASL signs, or apply them only where handedness is explicitly preserved.

2. **Audit fallback-generated boxes.** Inspect predictions with near-full-frame
   bounding boxes, especially for `1`, `P`, and `T`, and determine whether
   MediaPipe failures, Kalman predictions, or centered fallback boxes produced
   the poor localization.

3. **Evaluate stricter localization matching.** Run a sensitivity analysis at
   IoU thresholds such as 0.30, 0.45, and 0.60 to separate missed detections
   from poor box regression.

4. **Add ROS 2 mode gating.** Use an explicit numeric or command-letter state
   machine so that specialist detectors receive only images appropriate to their
   class domain.

5. **Expand the held-out benchmark.** Collect multiple original frames per class
   from separate sessions, lighting conditions, camera positions, and users.
   This will make per-class recall estimates more stable and allow confidence
   intervals.

## Limitations

- The original benchmark contains only one image per gesture class.
- All augmented variants derive from the same 36 source webcam images.
- The benchmark is therefore not yet a large multi-session held-out test set.
- The reported results should not be used alone to select a final production
  model.
- The augmented benchmark includes transformations that may be more aggressive
  than the models’ training distribution.
- Background-image counts are too small to draw strong conclusions about
  background suppression.
- The benchmark measures single-frame detection performance; it does not yet
  evaluate temporal consistency, gesture transitions, or multi-frame tracking.

## Resources

- [ASL Webcam Benchmark — Original](https://huggingface.co/datasets/ajdanoff/asl-webcam-benchmark-original)
- [ASL Webcam Benchmark — Augmented](https://huggingface.co/datasets/ajdanoff/asl-webcam-benchmark-augmented)
- [GitHub release v1.0.0](https://github.com/ajdanoff/gesture-recognition-for-mobile-robot-swarm-control/releases/tag/v1.0.0)
- [Benchmark CI workflow](https://github.com/ajdanoff/asl-gesture-recognition/actions/workflows/benchmark.yml)
- [Project repository](https://github.com/ajdanoff/gesture-recognition-for-mobile-robot-swarm-control)