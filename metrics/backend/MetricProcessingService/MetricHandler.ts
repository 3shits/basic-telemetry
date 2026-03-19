import { credentials } from "@grpc/grpc-js";
import { DetectionEngineConfig, metric_keys } from "../constants";
import {
  AdaptiveThresholdDetector,
  calculateDeviation,
  calculateEWMA,
  calculateVariance,
  CUSUMDetector,
  EWMADriftDetection,
  EWMASpikeDetection,
  StaticThresholdDetector,
} from "./detectionEngine";
import {
  QueueClient,
  StreamMetricRequest,
  StreamMetricResponse,
} from "../MetricIngestionService/QueueHandler";
import {
  EngineConfig,
  EWMAFlags,
  EWMAMetrics,
  EWMASpikeFlags,
  Flags,
  MetricFlags,
  MetricsData,
  PrevState,
  RawMetrics,
  StaticFlags,
} from "../types";
import { SignalProcessingService } from "./SignalHandler";

const PrevDetectionState = {} as PrevState;
let PrevStateInitialized = false;
const KPrevEWMA = new Array<EWMAMetrics>();
let ProcessingState = false;
const MetricIngestionService = () => {
  const client = new QueueClient("0.0.0.0:50051", credentials.createInsecure());
  const request: StreamMetricRequest = {
    targetID: "1",
  };
  const call = client.streamMetrics(request);
  console.log("Connected to Stream");
  call.on("data", (res: StreamMetricResponse) => {
    const flags = MetricProcessingService(res);
  });
  call.on("end", () => {
    console.log("StreamEnd");
    ReconnectClient();
  });
  call.on("error", (err) => {
    console.log(err.message);
    ReconnectClient();
  });
};

const ReconnectClient = () => {
  setTimeout(() => {
    MetricIngestionService();
  }, 2000);
};

const getPrevMetrics = () => {
  if (!PrevStateInitialized) {
    //Query Database
    GetMetricsFromDb();
    PrevStateInitialized = true;
  }
  //else {
  //   PrevDetectionState.kewma = {
  //     cpu: 0.4,
  //     memory: 0.4,
  //     latency: 0.4,
  //     error_rate: 0.4,
  //     login_fail_rate: 0.4,
  //   }; //query from db
  // }
  return PrevDetectionState;
};

const GetMetricsFromDb = () => {
  PrevDetectionState.ewma = {
    cpu: 45,
    memory: 65,
    latency: 120,
    error_rate: 0.5,
    login_fail_rate: 1.5,
  };

  PrevDetectionState.variance = {
    cpu: 4,
    memory: 6,
    latency: 25,
    error_rate: 0.2,
    login_fail_rate: 0.5,
  };

  PrevDetectionState.drift = {
    drift_up: {
      cpu: 0,
      memory: 0,
      latency: 0,
      error_rate: 0,
      login_fail_rate: 0,
    },
    drift_down: {
      cpu: 0,
      memory: 0,
      latency: 0,
      error_rate: 0,
      login_fail_rate: 0,
    },
  };

  PrevDetectionState.kewma = {
    cpu: 45,
    memory: 65,
    latency: 120,
    error_rate: 0.5,
    login_fail_rate: 1.5,
  };

  PrevDetectionState.cusumnegative = {
    cpu: 0,
    memory: 0,
    latency: 0,
    error_rate: 0,
    login_fail_rate: 0,
  };

  PrevDetectionState.cusumpositive = {
    cpu: 0,
    memory: 0,
    latency: 0,
    error_rate: 0,
    login_fail_rate: 0,
  };
};

const MetricProcessingService = (res: StreamMetricResponse) => {
  const prev = getPrevMetrics();
  const flags: MetricFlags[] = [];
  for (const metric of res.metric) {
    const flag = DetectionEngine(prev, DetectionEngineConfig, metric.data);
    if (flag) flags.push(...flag);
  }
  console.log("Finished Processing");

  SignalProcessingService(flags);
};
const DetectionEngine = (
  PrevMetricState: PrevState,
  Config: EngineConfig,
  RawMetrics: RawMetrics,
) => {
  const metrics = computeDerievedMetrics(
    RawMetrics,
    PrevMetricState.ewma,
    Config.ALPHA,
    PrevMetricState.variance,
    Config.BETA,
  );
  if (ProcessingState) {
    const staticFlags = StaticThresholdDetector(
      Config.STATICTHRESHOLD,
      metrics.processed_raw_data,
    );
    const ewmaDriftFlags = EWMADriftDetection(
      Config.EPSILON,
      PrevMetricState.drift,
      metrics.ewma,
      PrevMetricState.kewma,
      Config.K_DRIFT,
      Config.N,
    );
    const ewmaSpikeFlags = EWMASpikeDetection(
      metrics.deviation,
      metrics.variance,
      Config.K_SPIKE,
      Config.MINSIGMA,
    );
    const cusumFlags = CUSUMDetector(
      Config.CUSUMNOISE,
      metrics.ewma,
      PrevMetricState.cusumpositive,
      PrevMetricState.cusumnegative,
      Config.CUSUMTHRESHOLD,
      metrics.processed_data,
    );

    const adaptiveFlags = AdaptiveThresholdDetector(
      metrics.ewma,
      metrics.variance,
      Config.ADAPTIVESENSITIVITY,
      metrics.processed_data,
    );

    const flag = updateFlags(
      staticFlags,
      ewmaDriftFlags.flags,
      ewmaSpikeFlags,
      cusumFlags.flags,
      adaptiveFlags,
    );
    const updatePrevConfig = {
      ewma: metrics.ewma,
      variance: metrics.variance,
      drift: ewmaDriftFlags.updated_drift,
      kewma: KPrevEWMA.shift(),
      cusumpositive: cusumFlags.cusum_positive,
      cusumnegative: cusumFlags.cusum_negative,
    };

    updatePrev(updatePrevConfig);
    KPrevEWMA.push(metrics.ewma);
    return flag;
  }
  KPrevEWMA.push(metrics.ewma);
  if (KPrevEWMA.length >= Config.K_DRIFT) ProcessingState = true;
};

const updateFlags = (
  stat: StaticFlags,
  drift: EWMAFlags,
  spike: EWMASpikeFlags,
  cusum: EWMAFlags,
  adapt: EWMAFlags,
) => {
  return metric_keys.map((key) => {
    const flags = {
      static: stat[key],
      drift: drift[key],
      spike: spike[key],
      cusum: cusum[key],
      adapt: adapt[key],
    };
    return {
      metric: key,
      flags: Object.fromEntries(
        Object.entries(flags).filter(([, v]) => v !== 0),
      ) as Flags,
    };
  });
};
const updatePrev = (config: PrevState) => {
  PrevDetectionState.ewma = config.ewma;
  PrevDetectionState.variance = config.variance;
  PrevDetectionState.kewma = config.kewma;
  PrevDetectionState.cusumnegative = config.cusumnegative;
  PrevDetectionState.cusumpositive = config.cusumpositive;
  PrevDetectionState.drift = config.drift;
};
const computeDerievedMetrics = (
  raw: RawMetrics,
  prevEWMA: EWMAMetrics,
  alpha_EWMA: number,
  prevVariance: EWMAMetrics,
  beta_Variance: number,
) => {
  //raw--> processed -->ewma --> deviation -->variance
  const processed_data = {} as EWMAMetrics;
  const processed_raw_data = {} as MetricsData;
  processed_data.cpu = processed_raw_data.cpu = raw.cpu;
  processed_data.latency = processed_raw_data.latency = raw.latency;
  processed_data.memory = processed_raw_data.cpu = raw.memory;
  processed_data.error_rate =
    raw.totalReq == 0 ? 0 : (raw.failedReq / raw.totalReq) * 100;
  processed_data.login_fail_rate =
    raw.totalLogins == 0 ? 0 : (raw.failedLogins / raw.totalLogins) * 100;
  processed_raw_data.error_rate = raw.failedReq;
  processed_raw_data.login_fail_rate = raw.failedLogins;
  const ewma = calculateEWMA(prevEWMA, processed_data, alpha_EWMA);
  const deviation = calculateDeviation(ewma, processed_data);
  const variance = calculateVariance(deviation, beta_Variance, prevVariance);
return { processed_data, processed_raw_data, ewma, deviation, variance };
};
MetricIngestionService();
