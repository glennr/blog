---
title: "Which id belongs in the URI"
description: "A record with its own primary key and an id from the upstream system that sent it. The upstream id usually belongs in the URI, when it passes three tests."
date: 2026-02-26T22:07:34+10:00
draft: false
format: explainer
categories:
  - web development
tags:
  - Elixir
  - Phoenix
  - API
  - REST
---

> [!TLDR]
> Put the id your caller already holds in the URI. For an integration API
> that's the external id the upstream system sent, as long as it's unique,
> stable and safe in a path segment. If it can change, put the primary key in
> the URI and keep the external id for ingestion.

## Two ids for one order

Say you're filling out the CRUD (create, read, update, delete) endpoints on an
integration API. Upstream systems push daily snapshots into it, and each record
carries an external id: the upstream system's own id, with its name in front,
like `crm:ORD-4821`. Your database also gives the row a `bigint` primary key.

So which one goes in `/v1/orders/:id`?

## Ingestion already chose

The ingestion endpoint uses the external id:

```http
PUT /v1/orders/crm:ORD-4821
```

`PUT` fits because it's
[idempotent](https://www.rfc-editor.org/rfc/rfc9110#name-idempotent-methods):
sending the same request twice has the same intended effect as sending it
once, and a
daily snapshot sends the same record over and over. The upstream system picks
the URI, and it only knows the external id.

That leaves the id in the `GET`, `PATCH` and `DELETE` paths, and in the
`Location` header that `POST` returns. There are three options:

1. The primary key everywhere, with `PUT` as the one exception.
2. The external id everywhere.
3. Both, with a second path like `/v1/orders/by-external-id/:external_id`.

## Use the caller's id

A URI identifies a resource, and nothing in HTTP says the id in it has to be
your primary key. What matters is which id the caller already holds.

For an integration API the caller is the upstream system, and it holds the
external id. With the primary key in the `GET`, `PATCH` and `DELETE` paths, a
caller has to get the primary key from a lookup or an earlier response, and
store it next to its own id. That's state the upstream system keeps only
because of your URI choice.

```elixir
scope "/v1", MyAppWeb.API do
  pipe_through :api

  post "/orders", OrderController, :create

  get    "/orders/:external_id", OrderController, :show
  put    "/orders/:external_id", OrderController, :upsert
  patch  "/orders/:external_id", OrderController, :update
  delete "/orders/:external_id", OrderController, :delete
end
```

The primary key is still useful to you in logs, support and joins, so return
both ids in the body:

```elixir
# OrderController
def create(conn, %{"order" => params}) do
  {:ok, order} = Orders.create_order(params)

  conn
  |> put_status(:created)
  |> put_resp_header("location", "/v1/orders/#{order.external_id}")
  |> render(:show, order: order)
end

# OrderJSON
def show(%{order: order}) do
  %{id: order.id, external_id: order.external_id}
end
```

## Three tests for the id

The external id has to be:

- Unique. The source prefix keeps two sources apart, so `crm:ORD-4821` and
  `billing:ORD-4821` are different orders, but each source still has to keep
  its own ids unique. Drop the prefix and you have a collision the day a
  second system sends its own `ORD-4821`.
- Stable. When an id changes, every client holding the old URI breaks, unless
  you keep the old one working.
- Safe in a path segment.
  [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986#section-3.3) allows the
  colon in `/v1/orders/crm:ORD-4821`. A slash isn't allowed: the caller has to
  send `%2F`, and some servers, like Apache,
  [reject that by default](https://httpd.apache.org/docs/2.4/mod/core.html#allowencodedslashes).

An id that isn't unique needs a better prefix, whatever goes in the URI. One
that isn't stable means option 1: the primary key goes in the URI, and the
external id stays in the ingestion path only. One that isn't safe in a path
can't go in any path, so ingestion takes it in the body of a `POST` instead.

## The case against both

Option 3 gives one order two URIs, `/v1/orders/42` and
`/v1/orders/by-external-id/crm:ORD-4821`. That's two cache keys for the same
row, so every change has to clear both. If you need both, pick one as the
address you document and return in `Location`, and make the other a `GET` that
redirects to it.
