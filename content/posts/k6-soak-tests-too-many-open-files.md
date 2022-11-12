---
title: "K6 Soak Tests: Too Many Open Files"
date: 2022-10-26T23:21:33+10:00
categories:
  - devops
tags:
  - load-testing
  - linux
  - k6
---

While doing a soak test using [k6](https://www.k6.io) I ran into this error:

```
ERRO[0543] GoError: dial tcp 1.2.3.4:443: socket: too many open files
running at go.k6.io/k6/js/modules/k6/ws.(*WS).Connect-fm (native)
```

Indicating a hard limit imposed by the Linux kernel, as the `k6` process was trying to establish a _lot_ of simultaneous connections.

Since this test was executing locally, this error was related to my personal limit:

```
% ulimit -n
1024
```

The fix was simple:

```
% ulimit -n 10000
```

And to verify:

````
% ulimit -n
10000
```

````
