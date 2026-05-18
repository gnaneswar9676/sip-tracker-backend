const { trace } = require("@opentelemetry/api");

const tracer = trace.getTracer("sip-tracker");

module.exports = tracer;