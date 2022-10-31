---
title: "K6 Soak Tests Too Many Open Files"
date: 2022-10-26T23:21:33+10:00
draft: true
categories:
- load-testing
tags:
- linux
- k6
---

Soak testing k6

```
ERRO[0543] GoError: dial tcp 1.2.3.4:443: socket: too many open files
running at go.k6.io/k6/js/modules/k6/ws.(*WS).Connect-fm (native)
```

```
% ulimit -n
1024
```

The fix
```
% ulimit -n 10000
% ulimit -n
10000
```

