import { EventMapType, EWMAMetrics } from "./types";

export const metric_keys: (keyof EWMAMetrics)[] = [
  "cpu",
  "memory",
  "latency",
  "error_rate",
  "login_fail_rate",
];

export const MetricSignalWeights = {
  latency: 4.0,
  error_rate: 4.5,
  cpu: 2.5,
  memory: 2.0,
  login_fail_rate: 2.5,
};

export const FlagSignalWeights = {
  static: 5,
  cusum: 4,
  spike: 3,
  drift: 2,
  adaptive: 2,
};

export const DetectionEngineConfig = {
  ALPHA: 0.25,
  BETA: 0.15,

  STATICTHRESHOLD: {
    cpu: 85,
    memory: 90,
    latency: 600,
    error_rate: 10,
    login_fail_rate: 10,
  },

  EPSILON: {
    cpu: 1.5,
    memory: 1.5,
    latency: 10,
    error_rate: 1,
    login_fail_rate: 1,
  },

  K_DRIFT: 5,
  N: 6,

  K_SPIKE: 3,
  MINSIGMA: 0.5,

  CUSUMNOISE: {
    cpu: 0.5,
    memory: 0.5,
    latency: 5,
    error_rate: 0.5,
    login_fail_rate: 0.5,
  },

  CUSUMTHRESHOLD: 8,

  ADAPTIVESENSITIVITY: {
    cpu: 2,
    memory: 2,
    latency: 2.5,
    error_rate: 2,
    login_fail_rate: 2,
  },
};

export const detectorWeight = {
  static: 5,
  cusum: 4,
  spike: 3,
  drift: 2,
  adapt: 2,
};

export const metricWeight = {
  cpu: 2.5,
  memory: 2.0,
  latency: 4.0,
  error_rate: 4.5,
  login_fail_rate: 2.5,
};

export const EventMap: EventMapType[] = [
  {
    metric: "cpu",
    events: [
      "CPU_DRIFT_EVENT",
      "CPU_SPIKE_EVENT",
      "CPU_SUSTAINED_LOAD_EVENT",
      "CPU_OVERLOAD_EVENT",
    ],
    severity: [5, 6, 10, 12],
  },
  {
    metric: "cpu",
    events: [
      "MEMORY_LEAK_EVENT",
      "MEMORY_SPIKE_EVENT",
      "MEMORY_PRESSURE_EVENT",
    ],
    severity: [4, 6, 10],
  },
  {
    metric: "latency",
    events: [
      "LATENCY_DRIFT_EVENT",
      "LATENCY_SPIKE_EVENT",
      "LATENCY_DEGRADATION_EVENT",
    ],
    severity: [8, 10, 15],
  },
  {
    metric: "error_rate",
    events: [
      "ERROR_RATE_SPIKE_EVENT",
      "ERROR_RATE_SUSTAINED_EVENT",
      "ERROR_RATE_CRITICAL_EVENT",
    ],
    severity: [12, 15, 20],
  },
  {
    metric: "login_fail_rate",
    events: ["LOGIN_FAILURE_SPIKE_EVENT", "LOGIN_FAILURE_BURST_EVENT"],
    severity: [7, 10],
  },
];

export const IncidentMap = {
  CPU_OVERLOAD_EVENT: {
    dependencies: [
      "LATENCY_SPIKE_EVENT",
      "LATENCY_DEGRADATION_EVENT",
      "ERROR_RATE_SPIKE_EVENT",
      "ERROR_RATE_CRITICAL_EVENT",
      "MEMORY_PRESSURE_EVENT",
    ],
  },

  CPU_SUSTAINED_LOAD_EVENT: {
    dependencies: [
      "LATENCY_DEGRADATION_EVENT",
      "ERROR_RATE_SUSTAINED_EVENT",
      "MEMORY_PRESSURE_EVENT",
    ],
  },

  CPU_SPIKE_EVENT: {
    dependencies: ["LATENCY_SPIKE_EVENT", "MEMORY_SPIKE_EVENT"],
  },

  CPU_DRIFT_EVENT: {
    dependencies: ["LATENCY_DRIFT_EVENT", "MEMORY_LEAK_EVENT"],
  },

  MEMORY_LEAK_EVENT: {
    dependencies: [
      "LATENCY_DEGRADATION_EVENT",
      "ERROR_RATE_SUSTAINED_EVENT",
      "CPU_SUSTAINED_LOAD_EVENT",
    ],
  },

  MEMORY_PRESSURE_EVENT: {
    dependencies: [
      "CPU_OVERLOAD_EVENT",
      "LATENCY_DEGRADATION_EVENT",
      "ERROR_RATE_SPIKE_EVENT",
    ],
  },

  MEMORY_SPIKE_EVENT: {
    dependencies: ["CPU_SPIKE_EVENT", "LATENCY_SPIKE_EVENT"],
  },

  LATENCY_SPIKE_EVENT: {
    dependencies: [
      "CPU_SPIKE_EVENT",
      "CPU_OVERLOAD_EVENT",
      "ERROR_RATE_SPIKE_EVENT",
    ],
  },

  LATENCY_DEGRADATION_EVENT: {
    dependencies: [
      "CPU_SUSTAINED_LOAD_EVENT",
      "MEMORY_LEAK_EVENT",
      "ERROR_RATE_SUSTAINED_EVENT",
    ],
  },

  LATENCY_DRIFT_EVENT: {
    dependencies: ["CPU_DRIFT_EVENT"],
  },

  ERROR_RATE_SPIKE_EVENT: {
    dependencies: [
      "LATENCY_SPIKE_EVENT",
      "CPU_OVERLOAD_EVENT",
      "LOGIN_FAILURE_BURST_EVENT",
    ],
  },

  ERROR_RATE_SUSTAINED_EVENT: {
    dependencies: ["LATENCY_DEGRADATION_EVENT", "MEMORY_LEAK_EVENT"],
  },

  ERROR_RATE_CRITICAL_EVENT: {
    dependencies: ["CPU_OVERLOAD_EVENT", "LATENCY_DEGRADATION_EVENT"],
  },

  LOGIN_FAILURE_SPIKE_EVENT: {
    dependencies: ["LOGIN_FAILURE_BURST_EVENT"],
  },

  LOGIN_FAILURE_BURST_EVENT: {
    dependencies: ["ERROR_RATE_SPIKE_EVENT", "LATENCY_SPIKE_EVENT"],
  },
};

export const IncidentRules = [
  {
    name: "CASCADING_FAILURE_INCIDENT",
    match: ["CPU_OVERLOAD_EVENT", "ERROR_RATE_CRITICAL_EVENT"],
    optional: ["LATENCY_DEGRADATION_EVENT"],
    priority: 100,
  },

  {
    name: "SYSTEM_OVERLOAD_INCIDENT",
    match: ["CPU_OVERLOAD_EVENT", "LATENCY_SPIKE_EVENT"],
    optional: ["ERROR_RATE_SPIKE_EVENT", "MEMORY_PRESSURE_EVENT"],
    priority: 95,
  },

  {
    name: "RESOURCE_EXHAUSTION_IMPACT_INCIDENT",
    match: ["MEMORY_LEAK_EVENT", "LATENCY_DEGRADATION_EVENT"],
    optional: ["ERROR_RATE_SUSTAINED_EVENT", "CPU_SUSTAINED_LOAD_EVENT"],
    priority: 90,
  },

  {
    name: "SECURITY_ANOMALY_IMPACT_INCIDENT",
    match: ["LOGIN_FAILURE_BURST_EVENT", "ERROR_RATE_SPIKE_EVENT"],
    optional: ["LATENCY_SPIKE_EVENT"],
    priority: 90,
  },

  {
    name: "CPU_SATURATION_INCIDENT",
    match: ["CPU_SUSTAINED_LOAD_EVENT", "LATENCY_DEGRADATION_EVENT"],
    optional: ["ERROR_RATE_SUSTAINED_EVENT"],
    priority: 80,
  },

  {
    name: "RESOURCE_PRESSURE_INCIDENT",
    match: ["MEMORY_PRESSURE_EVENT"],
    optional: ["CPU_OVERLOAD_EVENT", "LATENCY_DEGRADATION_EVENT"],
    priority: 75,
  },

  {
    name: "ERROR_RATE_DEGRADATION_INCIDENT",
    match: ["ERROR_RATE_SUSTAINED_EVENT"],
    optional: ["LATENCY_DEGRADATION_EVENT"],
    priority: 70,
  },

  {
    name: "PERFORMANCE_DEGRADATION_INCIDENT",
    match: ["LATENCY_DEGRADATION_EVENT"],
    exclude: ["CPU_OVERLOAD_EVENT", "MEMORY_PRESSURE_EVENT"],
    optional: ["LATENCY_DRIFT_EVENT"],
    priority: 60,
  },

  {
    name: "PARTIAL_DEGRADATION_INCIDENT",
    match: ["LATENCY_SPIKE_EVENT"],
    optional: ["CPU_DRIFT_EVENT", "MEMORY_SPIKE_EVENT"],
    exclude: ["CPU_OVERLOAD_EVENT"],
    priority: 55,
  },

  {
    name: "RESOURCE_SPIKE_CLUSTER_INCIDENT",
    match: ["CPU_SPIKE_EVENT", "MEMORY_SPIKE_EVENT"],
    optional: ["LATENCY_SPIKE_EVENT"],
    priority: 50,
  },

  {
    name: "DRIFT_DEGRADATION_INCIDENT",
    match: ["CPU_DRIFT_EVENT", "LATENCY_DRIFT_EVENT"],
    optional: ["MEMORY_LEAK_EVENT"],
    priority: 50,
  },

  {
    name: "TRANSIENT_SPIKE_INCIDENT",
    match: ["CPU_SPIKE_EVENT"],
    optional: ["LATENCY_SPIKE_EVENT", "MEMORY_SPIKE_EVENT"],
    exclude: ["CPU_SUSTAINED_LOAD_EVENT", "MEMORY_LEAK_EVENT"],
    priority: 40,
  },

  {
    name: "LOGIN_ANOMALY_INCIDENT",
    match: ["LOGIN_FAILURE_SPIKE_EVENT"],
    optional: ["LOGIN_FAILURE_BURST_EVENT"],
    priority: 60,
  },

  {
    name: "GENERIC_ANOMALY_INCIDENT",
    match: [],
    priority: 1,
  },
];
