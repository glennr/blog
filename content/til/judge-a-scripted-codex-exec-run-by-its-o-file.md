---
title: "A scripted codex exec can hang or fail with no -o file"
date: 2026-10-18T22:02:03+10:00
draft: false
format: til
tags:
  - codex
---

A scripted [`codex exec`](https://github.com/openai/codex/blob/main/docs/exec.md) can hang or fail without an answer, so check its `-o` (`--output-last-message`) file before you trust the run.

A prompt argument doesn't stop it reading stdin, so a background job with stdin left open waits. `codex exec --help` says so: "If stdin is piped and a prompt is also provided, stdin is appended as a `<stdin>` block". One run sat out a 900 second timeout with only this in the log:

```console
Reading additional input from stdin...
```

(That line prints with stdin closed too, so don't grep for it.)

With the model at capacity, it wrote no `-o` file:

```console
ERROR: Selected model is at capacity. Please try a different model.
ERROR: Selected model is at capacity. Please try a different model.
```

An agent reported a capacity run as exit 0. That was the exit code of a `tail` piped after `codex`. Measured directly, `codex` exited 1.

Close stdin, pass `-o`, and retry until the file has content:

```sh
rm -f out.md
for try in 1 2 3; do
  codex exec -s read-only -o out.md - < prompt.md || true
  [ -s out.md ] && break
  [ "$try" = 3 ] && { echo "codex wrote no out.md after 3 tries" >&2; exit 1; }
  sleep 30
done
```

`[ -s ]` catches a missing file and an empty one, and the `rm` clears a stale `out.md`.
