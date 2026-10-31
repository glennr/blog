---
title: "TIL: A tmux lock key, like Zellij's locked mode"
description: "One F12 binding that makes the outer tmux ignore every key, so a nested tmux gets them all"
date: 2026-10-31T11:03:00+10:00
draft: true
categories:
  - til
tags:
  - tmux
  - zellij
  - omarchy
  - dotfiles
---

Running tmux inside tmux (say, over SSH) and tired of the outer one eating
your prefix? [Zellij](https://zellij.dev/) has a locked mode for exactly this:
`Ctrl g` and it passes every key through until you press `Ctrl g` again.
tmux has nothing built in, but one binding gets you most of the way.

```tmux
bind -T root F12 \
  set prefix None \;\
  set prefix2 None \;\
  set key-table off \;\
  set status-style "fg=brightblack,bg=default" \;\
  if -F '#{pane_in_mode}' 'send-keys -X cancel' \;\
  refresh-client -S

bind -T off F12 \
  set -u prefix \;\
  set -u prefix2 \;\
  set -u key-table \;\
  set -u status-style \;\
  refresh-client -S
```

The trick is `key-table off`. There's nothing called `off`, so it's an empty
table apart from the F12 that switches back, and every other key falls straight
through to the pane. The status bar dims so you know where you are.

A few things bit me on [Omarchy](https://omarchy.org/):

- Omarchy sets two prefixes, `C-Space` and `C-b`. Clear only `prefix` and
  `C-b` still gets caught, so `prefix2` has to go too.
- I wanted a `LOCKED` tag next to the stock `COPY`/`PREFIX`/`ZOOM` ones. You
  can't reference `status-right` inside itself, so I copied the stock line and
  prepended `#{?#{==:#{client_key_table},off},LOCKED ,}`. The downside is it won't
  follow upstream changes to that line.
- My dotfiles live in yadm with `.config` gitignored. `yadm add` on the
  already tracked `tmux.conf` printed the ignore hint and exited non-zero,
  but it had staged the file anyway. So my `add && commit` never got to the
  commit.

If you only need the odd key, pressing the prefix twice (`C-Space C-Space` on
Omarchy) runs `send-prefix` and passes one prefix to the inner tmux without
locking anything.

The full config is in my
[dotfiles](https://github.com/glennr/dotfiles/blob/master/.config/tmux/tmux.conf).
