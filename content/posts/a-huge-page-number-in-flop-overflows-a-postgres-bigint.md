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

A huge `?page=` makes [`Flop`](https://hexdocs.pm/flop/) build an offset that
`Postgrex` can't encode. `Flop` only checks that `page` is
[greater than zero](https://github.com/woylie/flop/blob/0.28.0/lib/flop/validation.ex#L279-L281),
then computes the offset as
[`(page - 1) * page_size`](https://github.com/woylie/flop/blob/0.28.0/lib/flop/adapter/ecto.ex#L537).
So `?page=1000000000000000000000000000000` on any paged list in our app was a
500:

```text
{%DBConnection.EncodeError{message: "Postgrex expected an integer in -9223372036854775808..9223372036854775807, got 24999999999999999999999999999975. Please make sure the value you are passing matches the definition in your table or in your query or convert the value accordingly."}
```

`max_limit` caps `page_size`, but nothing caps `page`. So our app drops a
`page` or `page_size` of more than 9 digits before the params reach `Flop`:

```elixir
defp rest_param?({key, value}, _filterable) when key in ~w(page page_size),
  do: is_binary(value) and value =~ ~r/\A\d{1,9}\z/
```

Nine digits times any sane page size stays well inside a bigint.
