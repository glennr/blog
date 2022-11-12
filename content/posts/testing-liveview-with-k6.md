---
title: "How to test your Phoenix LiveView apps with k6."
date: 2022-10-25T23:09:24+10:00
draft: true
showTableOfContents: true
categories:
  - load-testing
tags:
  - Elixir
  - k6
  - LiveView
---

Elixir and Phoenix tout high performance with [low hardware
requirements](https://freecontent.manning.com/ride-the-phoenix/), and
[microsecond (μs) response times](https://medium.com/pinterest-engineering/introducing-new-open-source-tools-for-the-elixir-community-2f7bb0bb7d8c). Of course Elixir and Phoenix are only one part of your (production) stack, and thus tell only part of the whole story.

How well does your Phoenix LiveView app, and infrastructure, perform under stress?

How do you baseline performance, and how do you measure the impact of changes on that performance?

Given LiveView relies on websocket communication, how do you test that? How memory hungry are your views?

I recently had to answer these questions for [Bramble](www.brmbl.io) which is an
app built with Phoenix LiveView. I needed something to simulate HTTP and websocket traffic with spiky and sustained workloads.

## Enter k6

In the past I might have reached for good old [Apache JMeter](https://jmeter.apache.org), but the new shiny appears to be [k6](https://k6.io), an open-source load testing tool written by the folks over at Grafana Labs.

My initial impression was good. You write your tests in Javascript, using a simple API:

```javascript
import http from "k6/http";
import { sleep } from "k6";

export default function () {
  http.get("https://test.k6.io");
  sleep(1);
}
```

What's more, k6 doesn't run those tests in a browser or in a NodeJS runtime. Rather, k6 ships as a Go binary, optimized for minimal resource consumption. To run a load test, your invoke `k6` from the command line:

```bash
k6 run --vus 10 --duration 30s script.js
```

This simulates 10 Virtual Users (VUs) over a sustained period of 30 seconds.

K6 is _fast_. Efficiency is important in a load testing tool, as it means you don't need to rent half of AWS to saturate your application endpoints.

The icing on the cake is I didn't have to install any plugins as [websockets are
already supported](https://k6.io/docs/using-k6/protocols/websockets/).

## Test setup

Here's a worked example of how to get k6 up and running, and testing a LiveView app.

The test setup will be simple - we'll run both a LiveView app, and k6, locally.

We'll write a k6 test script to exercise Chris McCord's [LiveBeats project](https://fly.io/blog/livebeats/) - a "Social Music App With Phoenix LiveView".

For a production setup, you'll likely run the tests against a staging or pre-production system instead.

k6 running locally on a single machine might not be sufficient either.

Fortunately k6 additionally supports [Distributed](https://k6.io/blog/running-distributed-tests-on-k8s/) (Kubernetes) or their commercial [k6 Cloud](https://k6.io/docs/cloud/).

### Install k6

Install k6 per [their instructions](https://k6.io/docs/getting-started/installation/

ASDF users can use https://github.com/grimoh/asdf-k6

### Set up a LiveView project

Set up your LiveBeats project per the [README](https://github.com/fly-apps/live_beats)

(The setup is a little funky as you need to create a GitHub OAuth app for your
project, but it only takes 2 minutes).

Open up [LiveBeats on localhost](http:/localhost:4000), and sign in.

(Optionally create some sample data by uploading a few mp3 files you have lying
around on your hard drive. You still have some right? Right?)

LiveBeats has two main URLs we are interested in for this load test:

1. The 'My Profile' e.g. `/YOUR_GITHUB_USERNAME`.
2. The Settings page: `/profile/settings`

## A k6 test script

Let's start our k6 test script, and make it hit just the Settings page first.

```javascript {filename="test/k6/load-test.js"}
import http from "k6/http";

import { sleep, check } from "k6";

const cookie = __ENV.LIVEBEATS_COOKIE;

export default function () {
  let res = http.get("http://localhost:4000/profile/settings", {
    // dont follow authentication failure redirects
    redirects: 0,
    cookies: {
      _live_beats_key_v1: cookie,
    },
  });

  check(res, {
    "status 200": (r) => r.status === 200,
    "contains header": (r) => r.body.includes("Profile Settings"),
  });

  sleep(1);
}
```

[Source code on GitHub](https://github.com/glennr/live_beats/commit/d17cdff42b0bbe856dc818a04db191dc2bdc0cc9)

For simplicity, this script skips GitHub OAuth sign in.
Instead it expects a valid cookie exposed as an environment variable.

To do this grab the `_live_beats_key_v1` cookie from your browser, and export it
in the same session you'll run k6.

```
% export LIVEBEATS_COOKIE=YOUR_COOKIE
```

To run this script, use the k6 binary you installed:

```

% k6 run test/k6/load-test.js

          /\      |‾‾| /‾‾/   /‾‾/
     /\  /  \     |  |/  /   /  /
    /  \/    \    |     (   /   ‾‾\
   /          \   |  |\  \ |  (‾)  |
  / __________ \  |__| \__\ \_____/ .io

  execution: local
     script: test/k6/load-test.js
     output: -

  scenarios: (100.00%) 1 scenario, 1 max VUs, 10m30s max duration (incl. graceful stop):
           * default: 1 iterations for each of 1 VUs (maxDuration: 10m0s, gracefulStop: 30s)


running (00m01.1s), 0/1 VUs, 1 complete and 0 interrupted iterations
default ✓ [======================================] 1 VUs  00m01.1s/10m0s  1/1 iters, 1 per VU

     ✓ status 200
     ✓ contains header

     checks.........................: 100.00% ✓ 2        ✗ 0
     data_received..................: 39 kB   37 kB/s
     data_sent......................: 317 B   297 B/s
     http_req_blocked...............: avg=301.69µs min=301.69µs med=301.69µs max=301.69µs p(90)=301.69µs p(95)=301.69µs
     http_req_connecting............: avg=133.67µs min=133.67µs med=133.67µs max=133.67µs p(90)=133.67µs p(95)=133.67µs
     http_req_duration..............: avg=63.55ms  min=63.55ms  med=63.55ms  max=63.55ms  p(90)=63.55ms  p(95)=63.55ms
       { expected_response:true }...: avg=63.55ms  min=63.55ms  med=63.55ms  max=63.55ms  p(90)=63.55ms  p(95)=63.55ms
     http_req_failed................: 0.00%   ✓ 0        ✗ 1
     http_req_receiving.............: avg=208.26µs min=208.26µs med=208.26µs max=208.26µs p(90)=208.26µs p(95)=208.26µs
     http_req_sending...............: avg=64.63µs  min=64.63µs  med=64.63µs  max=64.63µs  p(90)=64.63µs  p(95)=64.63µs
     http_req_tls_handshaking.......: avg=0s       min=0s       med=0s       max=0s       p(90)=0s       p(95)=0s
     http_req_waiting...............: avg=63.28ms  min=63.28ms  med=63.28ms  max=63.28ms  p(90)=63.28ms  p(95)=63.28ms
     http_reqs......................: 1       0.938097/s
     iteration_duration.............: avg=1.06s    min=1.06s    med=1.06s    max=1.06s    p(90)=1.06s    p(95)=1.06s
     iterations.....................: 1       0.938097/s
     vus............................: 1       min=1      max=1
     vus_max........................: 1       min=1      max=1
```

Boom, you can see both checks worked, and various performance statistics for the
run. Our p90 HTTP request duration is 63.55ms.

## Baby's first melted CPU

Now let's add the My Profile page endpoint to the script.

```javascript
import http from "k6/http";

import { sleep, check } from "k6";

const cookie = __ENV.LIVEBEATS_COOKIE;

export default function () {
  const options = {
    redirects: 0,
    cookies: {
      _live_beats_key_v1: cookie,
    },
  };

  let res = http.get("http://localhost:4000/profile/settings", options);

  check(res, {
    "status 200": (r) => r.status === 200,
    "contains header": (r) => r.body.includes("Profile Settings"),
  });

  sleep(1);

  res = http.get("http://localhost:4000/glennr", options);

  check(res, {
    "songs status 200": (r) => r.status === 200,
    "contains table": (r) => r.body.includes("Artist"),
  });

  sleep(1);
}
```

[Full diff](https://github.com/glennr/live_beats/commit/7f004cb4de62c028eb55a0df73f2cd48ed846e3d)

Note this is test does not describe a very realistic user journey. A
sleep time of only 1 second between requests is quite short.

Let's run this updated k6 script with a twist: lets dial up the VUs + test duration.

This greatly increases both the overall the script iterations, and the load on the app.

```bash
% k6 run test/k6/load-test.js --vus 100 --duration=10s
...
running (12.0s), 000/100 VUs, 500 complete and 0 interrupted iterations
default ✓ [======================================] 100 VUs  10s

     ✓ status 200
     ✓ contains header
     ✓ songs status 200
     ✓ contains table

     checks.........................: 100.00% ✓ 2000      ✗ 0
     data_received..................: 62 MB   5.2 MB/s
     data_sent......................: 312 kB  26 kB/s
     http_req_blocked...............: avg=92.64µs  min=1.56µs  med=4.05µs   max=3.53ms   p(90)=31.17µs  p(95)=346.09µs
     http_req_connecting............: avg=34.23µs  min=0s      med=0s       max=2.7ms    p(90)=5.74µs   p(95)=157.69µs
     http_req_duration..............: avg=166.02ms min=55.06ms med=158.57ms max=435.99ms p(90)=274.61ms p(95)=323.83ms
       { expected_response:true }...: avg=166.02ms min=55.06ms med=158.57ms max=435.99ms p(90)=274.61ms p(95)=323.83ms
     http_req_failed................: 0.00%   ✓ 0         ✗ 1000
     http_req_receiving.............: avg=155.92µs min=37.41µs med=108.94µs max=2.39ms   p(90)=240.32µs p(95)=327.97µs
     http_req_sending...............: avg=32.7µs   min=6.24µs  med=17.27µs  max=2.71ms   p(90)=36.1µs   p(95)=100.31µs
     http_req_tls_handshaking.......: avg=0s       min=0s      med=0s       max=0s       p(90)=0s       p(95)=0s
     http_req_waiting...............: avg=165.84ms min=54.96ms med=158.41ms max=435.45ms p(90)=274.34ms p(95)=323.64ms
     http_reqs......................: 1000    83.414907/s
     iteration_duration.............: avg=2.33s    min=2.14s   med=2.31s    max=2.58s    p(90)=2.46s    p(95)=2.53s
     iterations.....................: 500     41.707454/s
     vus............................: 1       min=1       max=100
     vus_max........................: 100     min=100     max=100

```

With the increased Our p90 HTTP request duration has increased to 274ms, and we processed 83 HTTP requests per second.

Try increasing your VU count and observe what happens. For me I hit the open file descriptor limit at about 1000 VUs. This crashed the `phx.server` process, and causing all k6 checks to fail.
(The BEAM was still running, of course...)

```bash
% k6 run test/k6/load-test.js --vus 1000 --duration=10s
```

## Websockets and LiveView

A common LiveView optimization I often use is to defer certain costly operations until the view is [upgraded to be stateful](https://hexdocs.pm/phoenix_live_view/Phoenix.LiveView.html#module-life-cycle).

```elixir
  def mount(params, _session, socket) do
    %{current_user: current_user} = socket.assigns

    if connected?(socket) do
      <do costly things>
    ...
```

As such, any load test that hits these LiveView endpoints purely over HTTP is a _lie_.

To exercise these code paths in a load test, you have to simulate this life cycle by connecting from the client (k6) back to the server over websockets.

As mentioned above, k6 supports [websockets](https://k6.io/docs/using-k6/protocols/websockets/) out of the box.

(Note: At time of writing the [xk6-websockets extension](https://github.com/grafana/xk6-websockets) may replace this API.)

###

Lets add some extra checks to our k6 script to exercise LiveView websockets

```javascript
import http from "k6/http";
import { sleep, check, fail } from "k6";
import ws from "k6/ws";

const cookie = __ENV.LIVEBEATS_COOKIE;

export default function () {
  const host = "localhost:4000";
  const origin = `http://${host}`;
  const wsProtocol = "ws";
  const options = {
    redirects: 0,
    cookies: {
      _live_beats_key_v1: cookie,
    },
  };

  let url = `http://${host}/profile/settings`;
  let res = http.get(url, options);

  check(res, {
    "status 200": (r) => r.status === 200,
    "contains header": (r) => r.body.includes("Profile Settings"),
  });

  checkLiveViewUpgrade(host, origin, wsProtocol, cookie, res, url);

  sleep(1);

  url = `http://${host}/glennr`;
  res = http.get(url, options);

  check(res, {
    "songs status 200": (r) => r.status === 200,
    "contains table": (r) => r.body.includes("Artist"),
  });

  checkLiveViewUpgrade(host, origin, wsProtocol, cookie, res, url);

  sleep(1);
}
```

Where `checkLiveViewUpgrade` looks like this:

```javascript
// Connects the websocket to ensure the LV is upgraded.
//
// - parse the response HTML to find the LiveView websocket connection information (csrf token, topic etc)
// - build a `phx_join` message payload
// - issue a ws.connect()
//  - including several callback handlers
// - when a socket message was received, we assume the view was upgraded, and the websocket is closed.
function checkLiveViewUpgrade(
  host,
  testHost,
  wsProto,
  cookie,
  response,
  url,
  opts = {}
) {
  const debug = opts.debug || false;
  // The response html contains the LV websocket connection details
  const props = grabLVProps(response);
  const wsCsrfToken = props.wsCsrfToken;
  const phxSession = props.phxSession;
  const phxStatic = props.phxStatic;
  const topic = `lv:${props.phxId}`;
  const ws_url = `${wsProto}://${host}/live/websocket?vsn=2.0.0&_csrf_token=${wsCsrfToken}`;

  if (debug) console.log(`connecting ${ws_url}`);

  // LV handshake message
  const joinMsg = JSON.stringify(
    encodeMsg(null, 0, topic, "phx_join", {
      url: url,
      params: {
        _csrf_token: wsCsrfToken,
        _mounts: 0,
      },
      session: phxSession,
      static: phxStatic,
    })
  );

  var response = ws.connect(
    ws_url,
    {
      headers: {
        Cookie: `_live_beats_key_v1=${cookie}`,
        Origin: testHost,
      },
    },
    function (socket) {
      socket.on("open", () => {
        socket.send(joinMsg);
        if (debug) console.log(`websocket open: phx_join topic: ${topic}`);
      }),
        socket.on("message", (message) => {
          checkMessage(message, `"status":"ok"`);
          socket.close();
        });
      socket.on("error", handleWsError);
      socket.on("close", () => {
        // should we issue a phx_leave here?
        if (debug) console.log("websocket disconnected");
      });
      socket.setTimeout(() => {
        console.log("2 seconds passed, closing the socket");
        socket.close();
        fail("websocket closed");
      }, 2000);
    }
  );

  checkStatus(response, 101);
}
```

Helper functions are omitted for brevity, but the [source code is here](https://github.com/glennr/live_beats/tree/gr/k6-websockets)

Note: `checkLiveViewUpgrade` only tests the websocket is connected - it doesn't test the contents of the websocket message (like if the `phx_reply` rendered some expected HTML.)

### Socket to me

Lets re-run, using the same test parameters as before (100 VUs over 10 seconds)

```bash
% k6 run test/k6/load-test.js --vus 100 --duration=10s

          /\      |‾‾| /‾‾/   /‾‾/
     /\  /  \     |  |/  /   /  /
    /  \/    \    |     (   /   ‾‾\
   /          \   |  |\  \ |  (‾)  |
  / __________ \  |__| \__\ \_____/ .io

  execution: local
     script: test/k6/load-test.js
     output: -

  scenarios: (100.00%) 1 scenario, 100 max VUs, 40s max duration (incl. graceful stop):
           * default: 100 looping VUs for 10s (gracefulStop: 30s)


running (12.0s), 000/100 VUs, 400 complete and 0 interrupted iterations
default ✓ [======================================] 100 VUs  10s

     ✓ status 200
     ✓ contains header
     ✓ found WS token
     ✓ found phx-session
     ✓ found phx-static
     ✓ ws msg OK
     ✓ status OK
     ✓ songs status 200
     ✓ contains table

     checks.........................: 100.00% ✓ 5600      ✗ 0
     data_received..................: 90 MB   7.5 MB/s
     data_sent......................: 1.4 MB  113 kB/s
     http_req_blocked...............: avg=53.16µs  min=1.85µs  med=4µs      max=2.7ms    p(90)=144.83µs p(95)=303.66µs
     http_req_connecting............: avg=27.56µs  min=0s      med=0s       max=731.28µs p(90)=98.06µs  p(95)=196.82µs
     http_req_duration..............: avg=246.2ms  min=48.1ms  med=183.9ms  max=538.6ms  p(90)=510.16ms p(95)=526.17ms
       { expected_response:true }...: avg=246.2ms  min=48.1ms  med=183.9ms  max=538.6ms  p(90)=510.16ms p(95)=526.17ms
     http_req_failed................: 0.00%   ✓ 0         ✗ 800
     http_req_receiving.............: avg=648.09µs min=45.68µs med=111.45µs max=15.77ms  p(90)=731.57µs p(95)=4.37ms
     http_req_sending...............: avg=50.46µs  min=7.45µs  med=16.99µs  max=890.78µs p(90)=65.12µs  p(95)=268.68µs
     http_req_tls_handshaking.......: avg=0s       min=0s      med=0s       max=0s       p(90)=0s       p(95)=0s
     http_req_waiting...............: avg=245.5ms  min=47.96ms med=183.79ms max=525.87ms p(90)=508.92ms p(95)=523.4ms
     http_reqs......................: 800     66.634307/s
     iteration_duration.............: avg=2.88s    min=2.31s .config/lvim/spell/en.utf-8.add  med=2.78s    max=3.6s     p(90)=3.5s     p(95)=3.54s
     iterations.....................: 400     33.317153/s
     vus............................: 13      min=13      max=100
     vus_max........................: 100     min=100     max=100
     ws_connecting..................: avg=126.45ms min=39.85ms med=103.19ms max=359.7ms  p(90)=232.6ms  p(95)=305.48ms
     ws_msgs_received...............: 800     66.634307/s
     ws_msgs_sent...................: 800     66.634307/s
     ws_session_duration............: avg=189.21ms min=47.09ms med=145.6ms  max=620.19ms p(90)=378.3ms  p(95)=419.19ms
     ws_sessions....................: 800     66.634307/s
```

You can also see a set of new websocket-related metrics in the k6 output.

As you can see our HTTP request p(90) has almost doubled (510ms vs 274ms). Our HTTP requests per second dropped to about 66 (from 83).

Interestingly, you'll find a lower overall VU threshold because the websockets mean more file descriptors.

The main benefit however, is that you are now simulating a more realistic load on your LiveView app.

## Where to from here?

Its possible with `k6/ws` to simulate navigation within the LiveView (by keeping the websocket open and sending `redirect` or `patch` messages).

With this approach you should see more accurate resource memory consumption (in particular any memory overhead) on your servers.

If your app uses LiveView almost exclusively, your load scripts will use [k6/ws]([https://k6.io/docs/javascript-api/k6-ws/) more than [k6/http](https://k6.io/docs/javascript-api/#k6-http).

However if `k6/http` provides you with a 'good enough' load test, I would recommend starting there, as the API is simpler, and your load scripts will be easier to grok.

I recommend also checking out some of the [various test types](https://k6.io/docs/test-types/introduction/) that k6 has to offer, e.g. ramping stress tests.
