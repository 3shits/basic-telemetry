import { credentials, Metadata } from "@grpc/grpc-js";
import { QueueClient, RawMetrics } from "./MetricIngestionService/QueueHandler";

const client = new QueueClient("0.0.0.0:50051", credentials.createInsecure());

const meta = new Metadata();
meta.add("server-id", "1");

const call = client.loadMetric(meta, (err, res) => {
  if (err) console.log(err);
  else console.log(res);
});

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

let driftCpu = 45;
let driftLatency = 140;

function stable(): RawMetrics {
  return {
    cpu: rand(38, 45),
    memory: rand(55, 65),
    latency: rand(110, 135),

    failedReq: Math.floor(rand(0, 2)),
    failedLogins: Math.floor(rand(0, 1)),

    totalReq: Math.floor(rand(140, 180)),
    totalLogins: Math.floor(rand(35, 50)),
  };
}

function spike(): RawMetrics {
  const isSpike = Math.random() < 0.18;

  if (isSpike) {
    return {
      cpu: rand(80, 92),
      memory: rand(70, 85),
      latency: rand(420, 560),

      failedReq: Math.floor(rand(6, 15)),
      failedLogins: Math.floor(rand(2, 6)),

      totalReq: Math.floor(rand(200, 260)),
      totalLogins: Math.floor(rand(60, 90)),
    };
  }

  return stable();
}

function drift(): RawMetrics {
  driftCpu += rand(1.3, 2.6);
  driftLatency += rand(10, 16);

  return {
    cpu: driftCpu,
    memory: rand(65, 80),
    latency: driftLatency,

    failedReq: Math.floor(rand(3, 7)),
    failedLogins: Math.floor(rand(1, 4)),

    totalReq: Math.floor(rand(220, 280)),
    totalLogins: Math.floor(rand(70, 100)),
  };
}

function meltdown(): RawMetrics {
  return {
    cpu: rand(90, 100),
    memory: rand(92, 98),
    latency: rand(700, 1200),

    failedReq: Math.floor(rand(50, 140)),
    failedLogins: Math.floor(rand(20, 70)),

    totalReq: Math.floor(rand(320, 500)),
    totalLogins: Math.floor(rand(100, 150)),
  };
}

function sendMetric(data: RawMetrics) {
  call.write({
    data: {
      data: data,
      timestamp: Date.now().toString(),
    },
  });

  console.log("metric:", data);
}

function startSimulation(mode: "stable" | "spike" | "drift" | "meltdown") {
  console.log("Running mode:", mode);

  setInterval(() => {
    let metric: RawMetrics;

    switch (mode) {
      case "stable":
        metric = stable();
        break;

      case "spike":
        metric = spike();
        break;

      case "drift":
        metric = drift();
        break;

      case "meltdown":
        metric = meltdown();
        break;

      default:
        console.log("Mode not selected");
        return;
    }

    sendMetric(metric);
  }, 1000);
}

const mode = process.argv[2] as "stable" | "spike" | "drift" | "meltdown";

startSimulation(mode);
