---
layout: ../../layouts/MainLayout.astro
title: "Distributed ML Workload Execution Platform"
---

# Distributed ML Workload Execution Platform

### 🛠️ Infrastructure Overview
A production-ready asynchronous job-execution system designed to handle long-running, resource-intensive machine learning workloads (such as YOLOv8 training/evaluation and Qwen2.5-VL multi-modal inference) without blocking front-facing client interfaces. The core architecture implements strict task decoupling, distributed worker pooling, and progressive memory optimization strategies to deliver predictable latency under heavy inference profiles.

- **Source Code Repository:** [ml-workload-execution-platform](https://github.com/ajdanoff/ml-workload-execution-platform)
- **Primary Tech Stack:** FastAPI // RabbitMQ // Celery Clusters // vLLM Inference Engine // AWQ & 4-bit NF4 Quantization // Pydantic v2

---

## 🏗️ Decoupled Task Routing & Broker Architecture

The platform architecture eliminates the classic Python ASGI vulnerability where heavy CPU/GPU matrix computations execute directly inside the HTTP server thread, instantly freezing the `asyncio` Event Loop. 

```text
[ HTTP POST Request ] ──► FastAPI Router
                             │
                             ▼ (Instant 202 Accepted + task_id)
                      [ RabbitMQ Exchange ]
                             │
            ┌────────────────┴────────────────┐
            ▼ (Routing Key: workloads.heavy)   ▼ (Routing Key: workloads.light)
     [ Heavy GPU Queue ]               [ Light CPU Queue ]
            │                                 │
            ▼                                 ▼
┌──────────────────────────────┐   ┌──────────────────────────────┐
│ Isolated Celery GPU Worker   │   │ Isolated Celery CPU Worker   │
│ └── vLLM Server (Qwen2.5-VL) │   │ └── Metrics & Data Auditing  │
└──────────────────────────────┘   └──────────────────────────────┘
```

### 1. Robust Long-Running Task Lifecycles
*   **The Workflow:** When a machine learning execution job arrives via `POST /api/v1/workload/run`, the FastAPI backend instantly validates the payload signature using compiled **Pydantic v2** contract schemas.
*   **The Non-Blocking Handshake:** Instead of awaiting model computation, the API engine pushes the task boundaries into a **RabbitMQ** broker, generates a distinct `task_id`, and immediately fires a `202 Accepted` network status back to the client. Distributed, containerized **Celery** workers poll the broker independently, processing heavy model pipelines inside completely isolated operating contexts.

### 2. Idempotency Safety Nets
To guard against system degradation caused by double-submission traffic spikes or client connection drops (retry loops), the platform implements atomic **Idempotency Key Verification**. Incoming tasks request locks via an in-memory datastore before broker dispatch; concurrent duplicate requests are instantly rejected with an informative `409 Conflict` schema payload before they can drain hardware compute.

---

## 💾 Hardware Memory Optimization: 7B VLM Edge Inference

Deploying Vision-Language Models like **Qwen2.5-VL-7B-Instruct** onto localized Edge nodes or smaller cloud instances introduces extreme VRAM bounds. To successfully fit the model's footprint into limited hardware budgets (e.g., standard 16GB VRAM accelerators), the runtime workers implement specialized compilation pipelines:

*   **vLLM High-Performance Runtime:** Serves the deep learning compute graph using PagedAttention to minimize memory fragmentation during extended context execution.
*   **AWQ & 4-bit NF4 Structural Quantization:** Compresses network weights down from standard FP16 precisions using **Activation-Aware Weight Quantization (AWQ)** via the BitsAndBytes engine. By protecting salient weights based on observed internal activation channels, the platform achieves a **3.5x reduction in overall VRAM footprint** while maintaining extreme numerical alignment with the raw baseline model.

---

## 🛡️ Multi-Layer Quality Verification Matrix

The platform integrates an automated, 4-tier verification matrix directly into its codebase to ensure full operational safety across independent service rollouts:

1.  **Fast CI (Contract Enforcements):** Enforces data boundaries at the edge via strict Pydantic schemas, checking parameter bounds (e.g., invalid fractional learning rates or batch sizes) before jobs leave the front gate.
2.  **Nightly Integration:** Mounts an automated isolated environment via Docker Compose, instantiating real **FastAPI, PostgreSQL, and RabbitMQ** containers to evaluate distributed pipeline handshakes.
3.  **Fault Injection:** Simulates aggressive real-world chaos patterns—including sudden worker process drops, database disconnect blocks, and broker context loss—verifying that tasks gracefully fallback to dead-letter storage without dropping data states.
4.  **Performance Gates:** Tracks latency percentiles (p50/p95/p99) against target throughput boundaries using automated load runners to guarantee zero performance regression.
