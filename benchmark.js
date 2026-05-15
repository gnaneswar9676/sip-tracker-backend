const autocannon = require("autocannon");

const fs = require("fs");



// =====================================
// RUN BENCHMARK
// =====================================

const runBenchmark = async (
  title,
  url
) => {

  console.log(
    `\nRunning benchmark for ${title}...\n`
  );

  const result =
  await autocannon({

    url,

    connections: 50,

    duration: 10,

    pipelining: 1,

    method: "GET"

  });


  const output = `

====================================================
${title}
====================================================

URL:
${url}

Requests/sec:
${result.requests.average}

Latency Avg:
${result.latency.average} ms

Throughput Avg:
${result.throughput.average}

2xx Responses:
${result["2xx"]}

Non-2xx Responses:
${result.non2xx}

Errors:
${result.errors}

Timeouts:
${result.timeouts}

====================================================

`;


  console.log(output);


  fs.appendFileSync(

    "benchmark-results.txt",

    output

  );

};



// =====================================
// START BENCHMARKS
// =====================================

const start = async () => {

  // CLEAR OLD RESULTS

  fs.writeFileSync(

    "benchmark-results.txt",

    "SIP Tracker Backend Benchmark Results\n\n"

  );


  // ROOT API

  await runBenchmark(

    "Root API",

    "http://localhost:5000/"

  );


  // FUNDS API

  await runBenchmark(

    "Funds API",

    "http://localhost:5000/api/funds"

  );


  // INVESTOR API

  await runBenchmark(

    "Investor API",

    "http://localhost:5000/api/investors/1"

  );


  // SIP API

  await runBenchmark(

    "SIP API",

    "http://localhost:5000/api/sips"

  );


  console.log(

    "Benchmark results saved to benchmark-results.txt"

  );

};


start();