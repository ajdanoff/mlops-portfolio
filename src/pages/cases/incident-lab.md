---
layout: ../../layouts/MainLayout.astro
title: "Kubernetes Fault-Injection & Observability Laboratory"
---

# Kubernetes Fault-Injection & Observability Laboratory

### 🛠️ Infrastructure Overview
An advanced simulation environment designed to systematically replicate high-load infrastructure bottlenecks, resource starvation, and cascading failure patterns in containerized microservice architectures. This project functions as an automated staging environment where target services are subjected to artificial congestion patterns to test and refine Prometheus metrics alerts, Grafana dashboard configurations, and system stability under stress.

- **Source Code Repository:** [://github.com](https://://github.com)
- **Primary Tech Stack:** Kubernetes (cgroups) // Prometheus v2 // Grafana // k6 Load Testing // Python ASGI

---

## 🏗️ Replicated Failure Modes & Diagnostic Metrics

The laboratory isolates and analyzes the distinct signature patterns of modern cloud infrastructure failures, providing specific remediation insights for each mode:

```text
               [ Искусственная Нагрузка / Burst Traffic ]
                                   │
         ┌─────────────────────────┴─────────────────────────┐
         ▼                                                   ▼
[ Сценарий А: CPU Throttling ]             [ Сценарий Б: Reconnect Storm ]
├── cgroups CFS Period: 100ms              ├── Target API Gateway Timeouts
├── Симптом: Лавинообразный p95            ├── Симптом: Рост HTTP 5xx & Retries
└── Метрика: `container_cpu_cfs...`        └── Метрика: `api_inflight_requests`
```

### 1. The Kubernetes CPU Throttling Illusion
*   **The Trap:** Standard monitoring metrics often display a normal, healthy average CPU utilization (e.g., 65%), while the application simultaneously experiences a massive surge in **p95/p99 latency response times**.
*   **The Infrastructure Root Cause:** The Kubernetes Completely Fair Scheduler (CFS) enforces CPU resource limits inside micro-windows of **100ms** periods. If a heavy ML pre-processing worker or a heavy serialization parser burns through its total allotted CPU quota within the first 20ms of a window, `cgroups` freezes (throttles) the container threads for the remaining 80ms. While the average utilization over a 1-minute period appears normal, actual execution paths are heavily paralyzed.
*   **Target Core Verification Metrics:**
    *   `container_cpu_cfs_throttled_periods_total` divided by `container_cpu_cfs_periods_total` — extracts the precise percentage of execution windows spent under strict kernel freeze.
    *   `container_cpu_cfs_throttled_seconds_total` — logs the raw duration of induced runtime latency.

### 2. Cascading Timeouts & Reconnect Storms
*   **The Trap:** A minor degradation in a single downstream data validator escalates into a platform-wide outage affecting the primary API Gateway layer.
*   **The Infrastructure Root Cause:** When downstream processing bottlenecks increase execution time past configured gateway limits, connection buffers begin stacking up. Client clients or worker nodes initiate automated, aggressive retry loops (`retries`), creating a massive burst of traffic that exhausts the available connection pool of both database clusters and internal event brokers.
*   **Target Core Verification Metrics:**
    *   `api_inflight_requests` — registers connection pool saturation metrics.
    *   `http_requests_total{status=~"5.."}` mapped against connection retry frequencies to track the explosion of automated reconnection attempts.

---

## 🚀 Automated Reliability & Chaos Engineering Setup

The configuration matrix defines strict resource allocation limits coupled with isolated Prometheus scraper frequencies, ensuring load simulators capture highly volatile system events before metrics are smoothed out over time:

```yaml
# Engineering blueprint from the laboratory manifest
apiVersion: apps/v1
kind: Deployment
metadata:
  name: target-inference-service
  namespace: incident-lab
spec:
  replicas: 1
  template:
    spec:
      containers:
        - name: inference-api
          image: ajdanoff/inference-api:latest
          resources:
            requests:
              cpu: "500m"
              memory: "1Gi"
            limits:
              cpu: "1000m" # Strict cgroups allocation to force throttling verification
              memory: "2Gi"
          ports:
            - containerPort: 8000
          readinessProbe:
            httpGet:
              path: /healthz
              port: 8000
            initialDelaySeconds: 5
            periodSeconds: 2 # Highly aggressive checking to catch connection failures early
```

---

## 📈 Key Production & Triage Takeaways

*   **Actionable SLA Optimization:** Proved that relying strictly on average CPU metrics causes a critical failure visibility gap. Teams must set core infrastructure alerts on **CFS Throttled Periods** and track p99 latencies against short, granular intervals.
*   **Fail-Safe Architecture Validation:** Demonstrated that preventing cascading failures requires implementing hard circuit-breakers and backoff retry algorithms at the client layer, blocking the system from triggering an organic, self-induced DDoS attack during database slowdowns.
*   **Reproducible Staging Playground:** Enables platform engineers to safely inject faults, execute k6 load matrices, and benchmark the defensive thresholds of microservice architectures before rolling out infrastructure updates to production clusters.
