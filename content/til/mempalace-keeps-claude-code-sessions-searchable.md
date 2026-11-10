---
title: "mempalace keeps Claude Code sessions searchable"
date: 2026-09-17T10:23:26+10:00
draft: false
format: til
tags:
  - claude-code
  - mempalace
---

[Claude Code deletes local session transcripts after 30 days by default](https://code.claude.com/docs/en/data-usage#data-retention). Once a transcript is gone, `claude --resume` can't open the session, and nothing on disk says what I decided in it.

The oldest transcript on this machine is 27 days old:

```console
$ find ~/.claude/projects -name '*.jsonl' -printf '%TY-%Tm-%Td\n' | sort | head -1
2026-08-21
```

To keep the transcripts longer, set `cleanupPeriodDays` in `~/.claude/settings.json`:

```json
{ "cleanupPeriodDays": 365 }
```

Grepping those JSONL files is still a poor way to find a decision I have forgotten. [`mempalace`](https://github.com/MemPalace/mempalace) indexes the transcripts into a local search index:

```sh
mempalace mine ~/.claude/projects/ --mode convos
mempalace search "cleanupPeriodDays"
```

Its [Claude Code plugin hooks](https://github.com/MemPalace/mempalace/blob/main/.claude-plugin/hooks/hooks.json) add each new session to that index as it runs, so the index outlives the 30-day cleanup.
