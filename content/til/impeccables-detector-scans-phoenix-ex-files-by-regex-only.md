---
title: "impeccable's detector scans Phoenix .ex files by regex only"
date: 2026-10-30T21:08:40+10:00
draft: true
format: til
client: true
tags:
  - impeccable
  - phoenix
  - claude-code
---

In our Phoenix LiveView app, [`impeccable`](https://github.com/pbakaus/impeccable)'s detector reads most of the markup by regex only. `impeccable` is a design skill for [Claude Code](https://code.claude.com/docs/en/overview), and its detector scans markup for design anti-patterns. Most of the app's markup is in `.ex` files, not `.heex` templates. The detector only regex-matches `.ex`. It also skips `.ex` files inside a directory. Given a file and a directory, it scans only the file:

```console
$ npx impeccable detect lib/my_app_web/components/layouts.ex lib/my_app_web/live
1 file scanned with regex matching only (.ex).
Rules that need a parsed page (tiny-text, low-contrast and other element rules) did not run on them; findings are an undercount, not a clean bill of health.
For the full check, scan the running dev server (npx impeccable detect http://localhost:PORT) or a static site's built .html.
```

Named one at a time, the `.ex` files gave one finding, a thick left border (`side-tab`):

```console
$ npx impeccable detect lib/my_app_web/components/component.ex
  line 625: [side-tab] border-l-4
```

`critique`, the design-review command, runs the same detector in the page as an overlay script, `detect.js`. The app's Content Security Policy (CSP) blocks it:

```text
Loading the script 'http://localhost:8400/detect.js' violates the following Content Security Policy directive: "script-src 'self' https://example.com". Note that 'script-src-elem' was not explicitly set, so 'script-src' is used as a fallback. The action has been blocked.
```

So the element rules from the first output don't run here. `critique` reviews screenshots instead. On a tab menu, it found the fault before I picked a fix. The tab rows each looked different, and none had a rule for mobile widths.
