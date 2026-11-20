---
layout: ../../layouts/MainLayout.astro
title: "MCP Industrial Robot Welding Simulator & CUDA Spatial Indexing"
subtitle: "Deterministic safety gates, 6-DoF inverse kinematics, and GPU-accelerated collision broadphase for LLM-driven robotics"
date: "2026-11"
tags: ["MCP SDK v2", "6-DoF Kinematics", "CUDA", "C++ / Python", "Robotics", "Safety Gates"]
repoUrl: "https://github.com/ajdanoff/mcp-robot-welding-sim"
---


## Architectural Problem

Connecting Large Language Models directly to industrial robot controllers creates a severe safety hazard: an LLM hallucination in joint angles, tool orientation, or path sequencing can cause physical collisions with the workpiece or fixture table.

To solve this, the system enforces a strict architectural boundary: **the LLM acts strictly as a semantic intent parser**, invoking typed **Model Context Protocol (MCP v2)** tools, while a deterministic kinematic and geometric validation engine acts as a mandatory **Quality Gate** before any controller code is compiled.

---

## System Architecture

```text
User / LLM Agent (MCP Client)
        │
        ▼  (Model Context Protocol v2)
MCP Server (Industrial-Robot-Welding-Simulator)
        │
        ├─► inspect_workpiece() / scene://workpiece/seams
        │        └─► CAD metadata & available weld seams
        │
        ├─► plan_and_simulate_weld(seam_ids, weld_speed_mm_s)
        │        ├─► Trajectory Planner (HOME -> APPROACH -> WELD -> RETRACT -> HOME)
        │        ├─► 6-DoF Inverse Kinematics Solver (Geometric Jacobian + DLS)
        │        ├─► Joint-Space Continuity Gate (anti-flip check <= 120°)
        │        └─► Dense AABB Link-Chain Collision Validator (20 samples/seam)
        │
        └─► export_robot_program(dialect="melfa" | "gcode")
                 └─► Vendor-Specific Postprocessor (MELFA-BASIC / ISO G-code)
```

---

## Core Engineering Components

### 1. 6-DoF Kinematic Engine (`SE(3)` / `SO(3)`)
* **Forward Kinematics:** Denavit–Hartenberg (DH) homogeneous transformation chain computing full frame poses from base to welding torch TCP.
* **Analytical Geometric Jacobian:** Direct computation of linear ($J_{v,i} = z_i \times (p_{\text{tcp}} - p_i)$) and angular ($J_{\omega,i} = z_i$) velocity columns in the base frame.
* **Damped Least Squares IK (Levenberg–Marquardt):** Multi-seed solver with logarithmic orientation error on $SO(3)$, wrist-singularity damping ($\lambda = 10^{-4}$), and minimum joint-jump selection (`< 0.02 mm` position accuracy).

### 2. Deterministic Safety & Collision Gates
* **Joint-Space Continuity Gate:** Rejects trajectory candidates exhibiting sudden wrist flips (`MAX_JOINT_JUMP_DEGREES = 120°`).
* **Dense Path Verification:** Discretizes every linear welding seam (`MOVL`) into 20 intermediate samples and checks all manipulator link segments against fixture and workpiece bounding volumes (`AABB`).

### 3. Industrial Postprocessor
* Two-pass compiler translating validated intermediate waypoints into vendor-specific controller syntax (**MELFA-BASIC** with `MOVJ`/`MOVL`, `HOPEN`/`HCLOSE` arc control, or **ISO G-code**).

---

## GPU / CUDA Spatial Indexing Benchmark

To scale collision broadphase detection to complex CAD meshes with hundreds of thousands of primitives, a custom **CUDA kernel** was implemented to map 3D coordinates onto a 1D **Z-order curve (30-bit Morton codes)** using **Structure of Arrays (SoA)** layout for coalesced global memory transactions and a grid-stride loop.

| Metric / Configuration | Value |
| :--- | :--- |
| **Scene Volume** | `1,000,000` 3D CAD primitives |
| **CPU Baseline (Vectorized NumPy)** | `37.23 ms` |
| **GPU Execution (NVIDIA T4 CUDA Kernel)** | `0.201 ms` |
| **Net Kernel Speedup** | **185.2x faster** (`100%` bit-exact match) |
