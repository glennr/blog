---
title: "A time on the Phoenix scope goes stale in a LiveView"
date: 2026-11-07T23:54:13+10:00
draft: false
client: true
format: til
tags:
  - elixir
  - phoenix
  - credo
---

Phoenix 1.8's `phx.gen.auth` builds a [`Scope`](https://hexdocs.pm/phoenix/scopes.html)
struct for each request, and it [goes first to almost every context
function](/posts/make-the-phoenix-scope-the-first-argument/). So the scope
looks like a good home for the current time: one `now` per request, which a
test can set.

That holds in a controller. A LiveView's `on_mount` hook assigns the scope once, at mount, and the
process lives as long as the browser tab is open. Leave the tab open for an
hour, and a 15-minute token checked against that `now` still reads as fresh.

So in our app the time is a `now` argument. A public function defaults it to
`DateTime.utc_now()` in its head, so a real call reads the clock and a test
can pass any time:

```elixir
def expired?(%Token{inserted_at: at}, now \\ DateTime.utc_now()) do
  DateTime.before?(at, DateTime.shift(now, minute: -15))
end

at = ~U[2026-01-02 03:04:05Z]
assert Tokens.expired?(%Token{inserted_at: at}, DateTime.shift(at, minute: 16))
```

A custom [Credo check](https://hexdocs.pm/credo/adding_checks.html) flags any
other clock read in `lib/`, Ecto's `ago/2` included. So a private function
takes `now` as a plain argument, and a query compares with `^now`.
