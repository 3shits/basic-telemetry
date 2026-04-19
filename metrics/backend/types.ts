export type RawMetrics = {
  cpu: number;
  memory: number;
  latency: number;
  failedReq: number;
  failedLogins: number;
  totalReq: number;
  totalLogins: number;
};

export type Flags = {
  static?: 1;
  drift?: 1 | -1;
  spike?: 1;
  cusum?: 1 | -1;
  adapt?: 1 | -1;
};

export type MetricFlags = {
  metric: Metric;
  flags: Flags;
  timestamp: string;
};

export type Metric = keyof EWMAFlags;

export type PrevState = {
  ewma: EWMAMetrics;
  variance: EWMAMetrics;
  drift: DriftCount;
  kewma: EWMAMetrics;
  cusumpositive: EWMAMetrics;
  cusumnegative: EWMAMetrics;
};

export type EngineConfig = {
  ALPHA: number;
  BETA: number;
  STATICTHRESHOLD: MetricsData;
  EPSILON: EWMAMetrics;
  K_DRIFT: number;
  N: number;
  K_SPIKE: number;
  MINSIGMA: number;
  CUSUMNOISE: EWMAMetrics;
  CUSUMTHRESHOLD: number;
  ADAPTIVESENSITIVITY: EWMAMetrics;
};

export type MetricsData = {
  cpu: number;
  memory: number;
  latency: number;
  error_rate: number;
  login_fail_rate: number;
};
export type EventMapType = {
  metric: keyof EWMAFlags;
  events: string[];
  severity: number[];
};

export type StaticFlags = {
  cpu: 0 | 1;
  memory: 0 | 1;
  latency: 0 | 1;
  error_rate: 0 | 1;
  login_fail_rate: 0 | 1;
};

export type EWMAMetrics = {
  cpu: number;
  memory: number;
  latency: number;
  error_rate: number;
  login_fail_rate: number;
};

export type EWMAFlags = {
  cpu: 1 | -1 | 0;
  memory: 1 | -1 | 0;
  latency: 1 | -1 | 0;
  error_rate: 1 | -1 | 0;
  login_fail_rate: 1 | -1 | 0;
};

export type DriftCount = {
  drift_up: EWMAMetrics;
  drift_down: EWMAMetrics;
};

export type EWMASpikeFlags = {
  cpu: 1 | 0;
  memory: 1 | 0;
  latency: 1 | 0;
  error_rate: 1 | 0;
  login_fail_rate: 1 | 0;
};

export type Score = {
  metric: keyof EWMAFlags;
  score: number;
  timestamp: string;
};
