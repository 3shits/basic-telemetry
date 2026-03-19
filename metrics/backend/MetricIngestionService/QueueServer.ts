/**
npx protoc \
--plugin=../node_modules/.bin/protoc-gen-ts_proto \
--ts_proto_out=./ \
--ts_proto_opt=outputServices=grpc-js \
-I ./ \
QueueHandler.proto 
*/

import {
  sendUnaryData,
  Server,
  ServerCredentials,
  ServerReadableStream,
  ServerUnaryCall,
  ServerWritableStream,
} from "@grpc/grpc-js";
import {
  GetMetricRequest,
  GetMetricResponse,
  LoadMetricRequest,
  LoadMetricResponse,
  MetricResponse,
  QueueService,
  StreamMetricRequest,
  StreamMetricResponse,
} from "./QueueHandler";

const MetricBuffer = new Map<string, Array<MetricResponse>>();
const MAX_SIZE = 100;
let StreamState = new Map<string, boolean>();
let streaming = new Map<string, NodeJS.Timeout>();
export const loadMetric = async (
  call: ServerReadableStream<LoadMetricRequest, LoadMetricResponse>,
  callback: sendUnaryData<LoadMetricResponse>,
) => {
  const id = call.metadata.get("server-id")[0] as string;
  if (!id)
    callback(null, {
      message: "No machine id provided",
    });
  if (!MetricBuffer.has(id)) {
    MetricBuffer.set(id, new Array<MetricResponse>());
  }

  call.on("data", (req: LoadMetricRequest) => {
    // console.log(req);
    console.log(MetricBuffer);
    const buffer = MetricBuffer.get(id);
    const len = buffer.length;
    if (len >= MAX_SIZE) {
      buffer.shift();
    }
    buffer.push(req.data);
  
    // console.log(buffer);
  });
  call.on("end", () => {
    console.log("Disconnected");

    callback(null, {
      message: "Disconnected",
    });
  });

  call.on("error", (err) => {
    console.log("Erorr" + err);
    callback(null, {
      message: "Error",
    });
  });
};

export const getMetric = (
  call: ServerUnaryCall<GetMetricRequest, GetMetricResponse>,
  callback: sendUnaryData<GetMetricResponse>,
) => {
  const id = call.request.targetID;
  const metric = MetricBuffer.get(id);
  console.log(metric);
  callback(null, {
    metric,
  });
  MetricBuffer.set(id, []);
};

export const streamMetrics = (
  call: ServerWritableStream<StreamMetricRequest, StreamMetricResponse>,
) => {
  const id = call.request.targetID;

  const stream = setInterval(() => MetricStream(), 100);
  StreamState.set(id, true);
  streaming.set(id, stream);
  call.on("close", () => {
    clearMetric();
    console.log("Ingestion Stopped");
  });

  call.on("drain", () => {
    StreamState.set(id, true);
  });

  call.on("error", () => {
    clearMetric();
    console.log("Ingestion Error ");
  });
  const clearMetric = () => {
    clearInterval(stream);
    streaming.delete(id);
    StreamState.delete(id);
  };
  const MetricStream = () => {
    let metric = MetricBuffer.get(id);
    if (!metric || metric.length < 10) return;
    const batch = metric.splice(0, 10);
    const writable = call.write({ metric: batch });

    if (!writable) clearMetric();
  };
};

const server = new Server();
server.addService(QueueService, {
  loadMetric,
  getMetric,
  streamMetrics,
});

server.bindAsync(
  "0.0.0.0:50051",
  ServerCredentials.createInsecure(),
  (err, port) => {
    console.log("Server on " + port);
    if (err) console.log(err);
  },
);
