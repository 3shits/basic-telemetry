import { EWMAMetrics } from "./types";

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

export const EventMap = {
  cpu: {
    5: "CPU_DRIFT_EVENT",
    6: "CPU_SPIKE_EVENT",
    10: "CPU_SUSTAINED_LOAD_EVENT",
    12: "CPU_OVERLOAD_EVENT",
  },
  memory: {
    4: "MEMORY_LEAK_EVENT",
    6: "MEMORY_SPIKE_EVENT",
    10: "MEMORY_PRESSURE_EVENT",
  },
  latency: {
    8: "LATENCY_DRIFT_EVENT",
    10: "LATENCY_SPIKE_EVENT",
    15: "LATENCY_DEGRADATION_EVENT",
  },
  error_rate: {
    12: "ERROR_RATE_SPIKE_EVENT",
    15: "ERROR_RATE_SUSTAINED_EVENT",
    20: "ERROR_RATE_CRITICAL_EVENT",
  },
  login_fail_rate: {
    7: "LOGIN_FAILURE_SPIKE_EVENT",
    10: "LOGIN_FAILURE_BURST_EVENT",
  },
};