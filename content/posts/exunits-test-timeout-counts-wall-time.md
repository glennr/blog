---
title: "ExUnit's test timeout counts wall time"
date: 2026-11-23T10:00:00+10:00
draft: false
client: true
format: til
slug: exunits-test-timeout-counts-wall-time
showReadingTime: false
tags:
  - TIL
  - elixir
  - exunit
---

ExUnit's per-test [`timeout`](https://hexdocs.pm/ex_unit/ExUnit.html#configure/1)
counts wall time, so a test starved of CPU times out. When several checkouts of
a Phoenix app ran its suite at once on one 16-core machine, tests that pass
alone failed like this:

```text
** (ExUnit.TimeoutError) test timed out after 10000ms. You can change the timeout:

  1. per test by setting "@tag timeout: x" (accepts :infinity)
  2. per test module by setting "@moduletag timeout: x" (accepts :infinity)
  3. globally via "ExUnit.start(timeout: x)" configuration
  4. by running "mix test --timeout x" which sets timeout
  5. or by running "mix test --trace" which sets timeout to infinity
     (useful when using IEx.pry/0)

where "x" is the timeout given as integer in milliseconds (defaults to 60_000).

stacktrace:
  (kernel 11.0.3) code_server.erl:164: :code_server.call/1
  (kernel 11.0.3) code.erl:587: :code.ensure_loaded/1
  (kernel 11.0.3) error_handler.erl:86: :error_handler.undefined_function/3
```

Some failures came with a database error, pointing at the pool:

```text
** (DBConnection.ConnectionError) client #PID<0.1090.0> exited
```

It wasn't the pool. The app's `test_helper.exs` sets `max_cases` from `pool_size`,
so each case has its own connection, and that error is ExUnit killing
the test mid-query. The stack shows the real wait: loading a module, with
no CPU to spare. Each run starts 32 cases, so three runs put
about 96 busy tests on 16 cores.

The fix lets one run use the machine at a time, with a
[`flock`](https://man7.org/linux/man-pages/man1/flock.1.html) on a file in the
git common directory, which every worktree shares:

```bash
exec 9>"$(git rev-parse --path-format=absolute --git-common-dir)/test.lock"
flock -n 9 || {
  echo "waiting for another worktree's test run to finish" >&2
  flock 9
}
mix test "$@"
```

`mix test` inherits file descriptor 9 and holds the lock until it exits.
