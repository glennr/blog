---
title: "uv tool install builds on the system Python"
date: 2026-09-20T22:50:06+10:00
draft: true
format: til
tags:
  - uv
  - python
  - backblaze
---

`uv tool install` builds the tool environment against the system Python unless a uv-managed Python is already installed. I moved the [Backblaze `b2` CLI](https://github.com/Backblaze/B2_Command_Line_Tool) off `pipx` so a pacman `python` bump could not break the backup push, and it changed nothing:

```console
$ cat ~/.local/share/uv/tools/b2/pyvenv.cfg
home = /usr/bin
implementation = CPython
uv = 0.12.13
version_info = 3.14.7
include-system-site-packages = false
```

`home = /usr/bin` is pacman's `python`. A patch bump is harmless, but 3.15 takes 3.14 away, and [the uv tool docs](https://docs.astral.sh/uv/concepts/tools/) are blunt about the result: "If the Python version used by a tool is uninstalled, the tool environment will be broken and the tool may be unusable."

Install a managed interpreter first, then pin the tool to it:

```sh
uv python install 3.14
uv tool install --managed-python --reinstall b2
```

That moves `home` to `~/.local/share/uv/python/`.

The `python-preference` setting defaults to `managed`, but [uv's docs](https://docs.astral.sh/uv/concepts/python-versions/) add that "system Python installations are still preferred over downloading a managed Python version." So the tool follows Arch's upgrade schedule.
