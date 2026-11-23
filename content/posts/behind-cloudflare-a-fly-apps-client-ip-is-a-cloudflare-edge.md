---
title: "Behind Cloudflare, a Fly app's client IP is a Cloudflare edge"
date: 2026-11-23T12:00:00+10:00
draft: false
client: true
format: til
slug: behind-cloudflare-a-fly-apps-client-ip-is-a-cloudflare-edge
showReadingTime: false
tags:
  - TIL
  - cloudflare
  - fly
  - elixir
---

Put Cloudflare in front of a Fly app, and the client IP Fly hands you is a
Cloudflare edge. Fly's docs say so for
[`Fly-Client-IP`](https://docs.fly.io/networking/request-headers#fly-client-ip),
and the last hop in `x-forwarded-for` goes the same way. A rate limit that reads
that last hop lumps together everyone who comes through the same Cloudflare
edge.

The client is the hop Cloudflare appended before its own.
[`remote_ip`](https://hexdocs.pm/remote_ip/) reads `x-forwarded-for` right to
left and skips the proxies you give it, so give it
[Cloudflare's published ranges](https://www.cloudflare.com/ips/):

```elixir
@cloudflare ~w(173.245.48.0/20 103.21.244.0/22 [...the rest of cloudflare.com/ips...])

defp forwarded_for(headers, proxies),
  do: RemoteIp.from(headers, headers: ["x-forwarded-for"], proxies: proxies)
```

A client can forge hops on the left, but `remote_ip` stops at the first hop
that isn't Cloudflare:

```elixir
assert ClientIP.from_conn(conn("198.51.100.9, 203.0.113.7, 172.70.1.2")) == "203.0.113.7"
```

Anyone can send `cf-ipcountry` and `cf-ipcity` too, so believe them only
when the request came through Cloudflare, which is when skipping Cloudflare's
ranges changes the answer:

```elixir
def via_cloudflare?(headers),
  do: forwarded_for(headers, @cloudflare) != forwarded_for(headers, [])
```
