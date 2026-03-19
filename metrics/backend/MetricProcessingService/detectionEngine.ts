import { metric_keys } from "../constants";
import type {
  DriftCount,
  EWMAFlags,
  EWMAMetrics,
  EWMASpikeFlags,
  MetricsData,
  StaticFlags,
} from "../types";

const checkThreshold = (
  threholds: MetricsData,
  raw_metrics: MetricsData,
): StaticFlags => {
  const flags = {} as StaticFlags;
  const threshold_keys = Object.keys(threholds) as (keyof MetricsData)[];
  threshold_keys.forEach((key) => {
    flags[key] = raw_metrics[key] > threholds[key] ? 1 : 0;
  });
  return flags;
};

const checkDrift = (
  drift: DriftCount,
  N: number,
  ewma_keys: (keyof EWMAMetrics)[],
) => {
  const flags = {} as EWMAFlags;
  const { drift_up, drift_down } = drift;
  ewma_keys.forEach((key) => {
    if (drift_up[key] >= N) flags[key] = 1;
    else if (drift_down[key] >= N) flags[key] = -1;
    else flags[key] = 0;
  });
  return flags;
};

const updateDriftCount = (
  drift_ewma: EWMAMetrics,
  ewma_keys: (keyof EWMAMetrics)[],
  drift: DriftCount,
): DriftCount => {
  const { drift_up, drift_down } = drift;
  ewma_keys.forEach((key) => {
    if (drift_ewma[key] == 1) {
      drift_up[key] += 1;
      drift_down[key] = 0;
    } else if (drift_ewma[key] == -1) {
      drift_down[key] += 1;
      drift_up[key] = 0;
    } else {
      drift_up[key] = Math.max(drift_up[key] - 1, 0);
      drift_down[key] = Math.max(drift_down[key] - 1, 0);
    }
  });
  return { drift_up, drift_down };
};

const calculateEWMADrift = (
  slopes: EWMAMetrics,
  ewma_keys: (keyof EWMAMetrics)[],
  epsilon: EWMAMetrics,
): EWMAMetrics => {
  const drift = {} as EWMAMetrics;
  ewma_keys.forEach((key) => {
    if (slopes[key] > epsilon[key]) drift[key] = 1;
    else if (slopes[key] < -epsilon[key]) drift[key] = -1;
    else drift[key] = 0;
  });
  return drift;
};
const calculateEWMASlope = (
  cur: EWMAMetrics,
  prev: EWMAMetrics,
  k: number,
  ewma_keys: (keyof EWMAMetrics)[],
): EWMAMetrics => {
  const ewma_slope = {} as EWMAMetrics;
  ewma_keys.forEach((key) => {
    ewma_slope[key] = (cur[key] - prev[key]) / k;
  });
  return ewma_slope;
};

export const calculateEWMA = (
  prev: EWMAMetrics,
  raw: EWMAMetrics,
  alpha: number,
): EWMAMetrics => {
  let ewma = {} as EWMAMetrics;
  metric_keys.forEach((key) => {
    ewma[key] = alpha * raw[key] + (1 - alpha) * prev[key];
  });
  return ewma;
};

export const calculateVariance = (
  deviation: EWMAMetrics,
  beta: number,
  prev: EWMAMetrics,
): EWMAMetrics => {
  const variance = {} as EWMAMetrics;
  metric_keys.forEach((key) => {
    variance[key] = beta * Math.pow(deviation[key], 2) + (1 - beta) * prev[key];
  });
  return variance;
};

const checkSpikes = (
  sigma: EWMAMetrics,
  k: number,
  deviation: EWMAMetrics,
): EWMASpikeFlags => {
  const flags = {} as EWMASpikeFlags;
  metric_keys.forEach((key) => {
    flags[key] = deviation[key] > k * sigma[key] ? 1 : 0;
  });
  return flags;
};
const calculateSigma = (
  variance: EWMAMetrics,
  minSigma: number,
): EWMAMetrics => {
  const sigma = {} as EWMAMetrics;
  metric_keys.forEach((key) => {
    sigma[key] = Math.max(Math.sqrt(variance[key]), minSigma);
  });
  return sigma;
};

export const calculateDeviation = (
  ewma: EWMAMetrics,
  raw_metrics: EWMAMetrics,
): EWMAMetrics => {
  const deviation = {} as EWMAMetrics;
  metric_keys.forEach((key) => {
    deviation[key] = Math.abs(raw_metrics[key] - ewma[key]);
  });
  return deviation;
};

const checkCUSUMThreshold = (
  pos: EWMAMetrics,
  neg: EWMAMetrics,
  threshold: number,
) => {
  const flags = {} as EWMAFlags;

  metric_keys.forEach((key) => {
    if (pos[key] > threshold) flags[key] = 1;
    else if (neg[key] > threshold) flags[key] = -1;
    else flags[key] = 0;
  });
  return flags;
};

const calculateCUSUMPositive = (
  prev: EWMAMetrics,
  ewma: EWMAMetrics,
  noise: EWMAMetrics,
  raw: EWMAMetrics,
): EWMAMetrics => {
  const cusum_positve = {} as EWMAMetrics;
  metric_keys.forEach((key) => {
    cusum_positve[key] = Math.max(
      0,
      prev[key] + (raw[key] - ewma[key] - noise[key]),
    );
  });
  return cusum_positve;
};
const calculateCUSUMNegative = (
  prev: EWMAMetrics,
  ewma: EWMAMetrics,
  noise: EWMAMetrics,
  raw: EWMAMetrics,
): EWMAMetrics => {
  const cusum_negative = {} as EWMAMetrics;
  metric_keys.forEach((key) => {
    cusum_negative[key] = Math.max(
      0,
      prev[key] + (ewma[key] - raw[key] - noise[key]),
    );
  });
  return cusum_negative;
};

const checkAdaptiveThresholds = (
  upper: EWMAMetrics,
  lower: EWMAMetrics,
  raw_metrics: EWMAMetrics,
): EWMAFlags => {
  const flags = {} as EWMAFlags;
  metric_keys.forEach((key) => {
    if (raw_metrics[key] > upper[key]) flags[key] = 1;
    else if (raw_metrics[key] < lower[key]) flags[key] = -1;
    else flags[key] = 0;
  });
  return flags;
};

const calculateAdaptiveThreshold = (
  ewma: EWMAMetrics,
  sensitivity: EWMAMetrics,
  std: EWMAMetrics,
): { upper: EWMAMetrics; lower: EWMAMetrics } => {
  const upper = {} as EWMAMetrics;
  const lower = {} as EWMAMetrics;

  metric_keys.forEach((key) => {
    upper[key] = ewma[key] + sensitivity[key] * std[key];
    lower[key] = ewma[key] - sensitivity[key] * std[key];
  });
  return { upper, lower };
};
const calculateStdDev = (variance: EWMAMetrics) => {
  const std = {} as EWMAMetrics;
  metric_keys.forEach((key) => {
    std[key] = Math.sqrt(variance[key]);
  });
  return std;
};

export const StaticThresholdDetector = (
  threshold: MetricsData,
  raw_metrics: MetricsData,
): StaticFlags => {
  const flags = checkThreshold(threshold, raw_metrics);
  
  return flags;
};

export const EWMADriftDetection = (
  epi: EWMAMetrics,
  drift: DriftCount,
  cur_ewma: EWMAMetrics,
  k_prev_ewma: EWMAMetrics,
  K: number,
  N: number,
) => {
  const slope_ewma = calculateEWMASlope(cur_ewma, k_prev_ewma, K, metric_keys);
  const drift_ewma = calculateEWMADrift(slope_ewma, metric_keys, epi);
  const updated_drift = updateDriftCount(drift_ewma, metric_keys, drift);
  const flags = checkDrift(updated_drift, N, metric_keys);
  
  return { updated_drift, flags };
};

export const EWMASpikeDetection = (
  deviation: EWMAMetrics,
  variance: EWMAMetrics,
  k: number,
  minSigma: number,
) => {
  const sigma = calculateSigma(variance, minSigma);
  const flags = checkSpikes(sigma, k, deviation);
  
  return flags;
};

export const CUSUMDetector = (
  noise: EWMAMetrics,
  cur_ewma: EWMAMetrics,
  prev_cusum_positive: EWMAMetrics,
  prev_cusum_negative: EWMAMetrics,
  threshold: number,
  raw_metrics: EWMAMetrics,
) => {
  const cusum_positive = calculateCUSUMPositive(
    prev_cusum_positive,
    cur_ewma,
    noise,
    raw_metrics,
  );
  const cusum_negative = calculateCUSUMNegative(
    prev_cusum_negative,
    cur_ewma,
    noise,
    raw_metrics,
  );

  const flags = checkCUSUMThreshold(cusum_positive, cusum_negative, threshold);
  
  return { cusum_positive, cusum_negative, flags };
};

export const AdaptiveThresholdDetector = (
  ewma: EWMAMetrics,
  variance: EWMAMetrics,
  sensitivity: EWMAMetrics,
  raw_metrics: EWMAMetrics,
) => {
  const std = calculateStdDev(variance);
  const { upper, lower } = calculateAdaptiveThreshold(ewma, sensitivity, std);
  const flags = checkAdaptiveThresholds(upper, lower, raw_metrics);

  return flags;
};
