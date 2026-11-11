---
layout: ../../layouts/NoteLayout.astro
title: "Unified vs. Specialist YOLO11n Detectors: Failure-Mode Diagnostics on Held-Out Webcam Benchmarks"
pubDate: "2026-11-11"
readTime: "8 min read"
description: "An empirical failure-mode analysis of unified 36-class vs. specialist digit/letter YOLO11n models across original and augmented webcam benchmarks using automated CI JSON telemetry."
tags: ["computer-vision", "yolo11", "benchmarking", "mlops", "ci-cd", "error-analysis"]
---

Decomposing American Sign Language (ASL) detection into dedicated specialist models helps address inter-class confusions between visually similar hand shapes (such as `0` vs. `O` or `2` vs. `V`) in robotic swarm control (`gesture-swarm-ros2`). Three **YOLO11n** architectures ([asl-unified-webcam-yolo11n-mp](https://huggingface.co), [asl-unified-digits-yolo11n-mp](https://huggingface.co), and [asl-unified-letters-yolo11n-mp](https://huggingface.co)) were evaluated across two held-out webcam benchmarks: the original ([asl-webcam-benchmark-original](https://huggingface.co), `36` frames + `1` background) and the augmented variant ([asl-webcam-benchmark-augmented](https://huggingface.co), `216` frames + `6` backgrounds).

## 1. Benchmark Telemetry & Performance Summary

While all models achieved high precision (`>0.95`) and `mAP@0.50` (`>0.98`) internally, held-out webcam evaluation exposed significant domain gaps:

* **Original Webcam (`36` GT frames + `1` background):** The **Digits Specialist** achieved `60.00%` recall (`6/10` TP, 0 background FPs), outperforming the **Unified Webcam** (`44.44%` recall, `16/36` TP) and **Letters Specialist** (`38.46%` recall, `10/26` TP).
* **Augmented Webcam (`216` GT frames + `6` backgrounds):** After applying mutations (flips, crops, rotations, HSV/gamma shifts, noise), the **Digits Specialist** led with `41.67%` recall (`25/60` TP, `0/6` background FPs), followed by the **Letters Specialist** (`27.56%` recall, `43/156` TP, `1/6` background FP) and the **Unified Webcam** (`23.15%` recall, `50/216` TP, `1/6` background FP).

## 2. Key Failure-Mode & Diagnostic Insights

* **Background Suppression:** Training with negative room frames successfully suppressed background hallucinations, resulting in `0/1` and `0/6` background false positives for the Digits Specialist and minimal errors (`1/6`) for the others.
* **IoU Localization vs. Misclassification:** Many logged "misses" were actually correct symbol detections (e.g., `"1"`, `"I"`, `"W"`, `"Y"`, `"6"`, `"0"`, `"P"`, `"T"`) that failed the `IoU >= 0.45` threshold due to full-frame bounding-box stretching (`[0.0, 0.0, 640.0, 480.0]`) or shifted crops under heavy augmentations.
* **Out-of-Domain Cross-Triggering:** Running specialists across full streams caused cross-triggers—such as the Letters Specialist firing high-confidence `"F"` predictions (`0.72–0.93`) on digit frames, or the Digits Specialist firing on letters (e.g., `"6"` on `"W"`). This highlights the need for explicit mode gating (e.g., numeric vs. command letter states in ROS 2).
* **Chiral Sensitivity:** Horizontal flip augmentations induced severe structural confusions, flipping `"M"` into `"A"`, `"Z"` into `"D"`, `"G"` into `"P"`, and collapsing digit `2` into `"3"` and `4` into `"9"`.

## 3. Next Engineering Actions

1. **Disable Horizontal Flips for Chiral Gestures:** Exclude horizontal flips from training and benchmarking for asymmetric ASL signs where handedness alters semantic geometry.
2. **Refine Bounding-Box Regression Loss:** Increase box loss weighting and audit fallback padding to resolve full-frame box drift on `1`, `P`, and `T` variants.
3. **Enforce ROS 2 State-Machine Gating:** Gate specialist models behind explicit command-grammar states in `gesture-swarm-ros2` to eliminate out-of-domain false positives.
