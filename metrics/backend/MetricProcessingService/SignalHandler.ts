import { EventMap, detectorWeight, metricWeight } from "../constants";
import { MetricFlags, Score } from "../types";

let Events: string[] = [];
let StartTimer = false;
const DELAY = 300;
export const SignalProcessingService = (flags: MetricFlags[]) => {
  const scores: Score[] = flags.map((flag) => {
    return checkScores(flag);
  });

  scores.forEach((score) => {
    checkSeverity(score);
  });

  clearEventsTimer();
  console.log(Events);
};

const clearEventsTimer = () => {
  if (StartTimer) {
    setTimeout(cleanupEvents, DELAY);
    StartTimer = false;
  }
  if (Events.length === 1) StartTimer = true;
};

const checkSeverity = (score: Score) => {
  const MetricEvents = EventMap[score.metric];
  const thresholds = Object.keys(MetricEvents).map(Number).sort();
  let event = 0;
  for (const t of thresholds) {
    if (score.score < t) break;
    event = t;
  }
  if (event != 0 && !Events.includes(MetricEvents[event]))
    Events.push(MetricEvents[event]);
};

const checkScores = (flag: MetricFlags) => {
  const { metric, flags } = flag;
  let severity = 0;
  Object.keys(flags).forEach((key) => {
    severity = severity + detectorWeight[key] * flags[key];
  });
  return { metric, score: metricWeight[metric] * severity };
};

const cleanupEvents = () => {
  Events = [];
};
