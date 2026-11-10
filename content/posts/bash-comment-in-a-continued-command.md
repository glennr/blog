---
title: "Bash ends a continued command at an inline comment"
date: 2026-03-02T22:18:26+10:00
draft: false
format: til
slug: bash-comment-in-a-continued-command
aliases:
  - /til/bash-comment-in-a-continued-command/
showReadingTime: false
tags:
  - TIL
  - bash
  - qemu
---

Put a `#` comment between backslash-continued lines and the command ends
there. The rest of the lines run as new commands.

```console
$ cat c.sh
#!/usr/bin/env bash
echo one \
  # a comment
  two three

$ bash c.sh
one
c.sh: line 4: two: command not found
```

The continuation joins the comment onto the command line, and `#` then
comments out everything to the end of that line, trailing backslash included.
So the chain breaks at the comment. Move the comment above the command
instead.

I found this in a long `qemu-system-x86_64` invocation, where I had annotated
the `-cpu` flags in place. Because the line began with `exec`, the truncated
command replaced the shell and the leftover flags never ran at all. No error,
just a VM missing every argument after the comment.
