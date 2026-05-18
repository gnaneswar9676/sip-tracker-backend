const fs = require("fs");

const {
  NodeSDK
} = require("@opentelemetry/sdk-node");

const {
  getNodeAutoInstrumentations
} = require("@opentelemetry/auto-instrumentations-node");

const {
  SimpleSpanProcessor
} = require("@opentelemetry/sdk-trace-base");

class FileSpanExporter {
  export(spans, resultCallback) {
    const logs = spans.map(span => ({
      traceId: span.spanContext().traceId,
      spanId: span.spanContext().spanId,
      name: span.name,
      startTime: span.startTime,
      endTime: span.endTime,
      attributes: span.attributes
    }));

    fs.appendFileSync(
      "traces.log",
      JSON.stringify(logs, null, 2) + "\n"
    );

    resultCallback({ code: 0 });
  }

  shutdown() {
    return Promise.resolve();
  }
}

const sdk = new NodeSDK({
  spanProcessor: new SimpleSpanProcessor(
    new FileSpanExporter()
  ),
  instrumentations: [
    getNodeAutoInstrumentations()
  ]
});

sdk.start();

console.log("OpenTelemetry initialized");