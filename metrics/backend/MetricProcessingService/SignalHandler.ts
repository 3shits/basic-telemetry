import { EventMap, detectorWeight, metricWeight } from "../constants";
import { Flags, MetricFlags, Score } from "../types";

type Event = {
  timestamp: string;
  event: string;
  severity: number;
  metric: string;
};

let Events: Event[] = [];
const DELAY = 300;
export const SignalProcessingService = (flags: MetricFlags[]) => {
  const scores: Score[] = flags.map((flag) => {
    return checkScores(flag);
  });

  scores.forEach((score) => {
    checkSeverity(score);
  });
  clearEvents();

  CorrelationEngine();
};

const CorrelationEngine = () => {
  const EventClusters = createCluster();
};

const createCluster = () => {
  // Events.forEach((e)=>{
  //   if(!cluster.includes(e))
  // })
};
const clearEvents = () => {
  const now = Date.now();
  Events = Events.filter((e) => now - Date.parse(e.timestamp) <= DELAY);
  while (Events.length > 0 && now - Date.parse(Events[0].timestamp) > DELAY) {
    //redundant
    Events.shift();
  }
};

const checkSeverity = (score: Score) => {
  const MetricEvents = EventMap.find(({ metric }) => metric === score.metric)!;
  const eventSeverity = MetricEvents.severity
    .filter((v) => {
      Number(v) <= score.score;
    })
    .findIndex((a, b) => a > b);
  const newEvent = {
    timestamp: score.timestamp,
    event: MetricEvents.events[eventSeverity],
    severity: eventSeverity,
    metric: score.metric,
  };
  if (!Events.includes(newEvent)) Events.push(newEvent);
};

const checkScores = (flag: MetricFlags) => {
  const { metric, flags, timestamp } = flag;
  let severity = 0;

  (Object.keys(flags) as (keyof Flags)[]).forEach((key) => {
    if (flags[key]) severity += detectorWeight[key] * flags[key];
  });
  return { metric, score: metricWeight[metric] * severity, timestamp };
};
