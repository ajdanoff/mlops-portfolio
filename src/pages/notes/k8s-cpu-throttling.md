---
layout: ../../layouts/NoteLayout.astro
title: "The Kubernetes CPU Throttling Illusion: Why Average CPU Lies and p99 Latency Spikes"
pubDate: "2026-11-11"
readTime: "4 min read"
description: "How Linux cgroups CFS quotas freeze ML inference pre-processing containers in 100ms micro-windows while standard Grafana CPU dashboards report healthy utilization."
tags: ["kubernetes", "observability", "prometheus", "mlops", "performance"]
---

In high-throughput ML inference services, one of the most deceptive production incidents occurs when **p95 and p99 API latencies spike dramatically**, yet your primary Grafana dashboard shows average container CPU utilization sitting comfortably at 40–50%.

When replicating burst traffic and cascade failures in my [incident-lab](https://github.com) environment, this exact anomaly consistently triggered downstream gateway timeouts and reconnect storms.

## The Root Cause: 100ms CFS Quota Windows

Standard Prometheus queries like `rate(container_cpu_usage_seconds_total[1m])` average CPU usage over a 60-second window. However, the Linux kernel's **Completely Fair Scheduler (CFS)** enforces Kubernetes CPU limits in **100-millisecond periods** (`cpu.cfs_period_us`).

Consider a FastAPI inference wrapper with a strict limit of `1000m` (1 core, or 100ms of CPU time per 100ms period):

1. A burst of concurrent image payloads arrives for pre-processing (resizing, tensor normalization, JSON serialization).
2. Python threads consume the entire **100ms** CPU budget in just **20ms** of wall-clock time across multiple host cores.
3. The kernel immediately **throttles (freezes)** the container for the remaining **80ms** of that window.
4. Over a full minute, average CPU looks low, but individual requests are artificially stalled by 80ms+ per cycle—pushing p99 latency past client timeout thresholds.

## Diagnostic Prometheus Queries

To detect silent throttling before it triggers a cascade failure across your message brokers, monitor the ratio of throttled CFS periods rather than raw CPU averages:

```promql
# Percentage of 100ms scheduler periods where the container was frozen
sum(rate(container_cpu_cfs_throttled_periods_total{namespace="ml-prod"}[5m])) by (pod)
/
sum(rate(container_cpu_cfs_periods_total{namespace="ml-prod"}[5m])) by (pod) * 100
```

If this ratio crosses **15–20%**, your container is actively starving for compute slices regardless of what the average CPU graph claims.

## Remediation Strategies

* **Decouple Heavy Pre-Processing:** Never run synchronous image decoding or tensor transformations inside the ASGI HTTP event loop. Offload payloads to isolated worker queues (RabbitMQ / Celery).
* **Tune Resource Limits vs. Requests:** Set `requests` accurately for Kubernetes bin-packing, and either raise `limits` to absorb micro-bursts or evaluate disabling strict CFS quotas on latency-critical inference pods where noisy-neighbor isolation permits.
* **Gate Releases with Load Profiles:** Enforce p99 latency and CFS throttling thresholds as automated **Quality Gates** using k6 or Locust before promoting canary rollouts.
