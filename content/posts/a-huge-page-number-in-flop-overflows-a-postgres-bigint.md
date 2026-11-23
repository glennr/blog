---
title: "A huge page number in Flop overflows a Postgres bigint"
date: 2026-11-20T12:31:50+10:00
draft: false
client: true
format: til
slug: a-huge-page-number-in-flop-overflows-a-postgres-bigint
showReadingTime: false
tags:
  - TIL
  - elixir
  - flop
  - postgres
---

A huge `?page=` in the URL makes [`Flop`](https://hexdocs.pm/flop/), an Elixir
library that pages database queries, build an SQL `OFFSET` too big for a
Postgres bigint. `Flop` only checks that `page` is
[greater than zero](https://github.com/woylie/flop/blob/0.28.0/lib/flop/validation.ex#L279-L281),
then computes the offset as
[`(page - 1) * page_size`](https://github.com/woylie/flop/blob/0.28.0/lib/flop/adapter/ecto.ex#L537).
So `?page=1000000000000000000000000000000`, a 1 and thirty zeros, on any paged
list in our app returned a 500 error. At a page size of 25, the offset came to
a 32-digit number, the `got` value below, and `Postgrex`, the Postgres driver,
would not encode it:

```text
%DBConnection.EncodeError{message: "Postgrex expected an integer in -9223372036854775808..9223372036854775807, got 24999999999999999999999999999975. Please make sure the value you are passing matches the definition in your table or in your query or convert the value accordingly."}
```

`Flop`'s `max_limit` option caps `page_size`, but nothing caps `page`. Our app
drops a `page` or `page_size` of more than 9 digits from the query params
before they reach `Flop`:

```elixir
defp rest_param?({key, value}, _filterable) when key in ~w(page page_size),
  do: is_binary(value) and value =~ ~r/\A\d{1,9}\z/
```

With our `max_limit` of 100, the biggest offset stays under 100 billion, far
inside the bigint range in the error above.
