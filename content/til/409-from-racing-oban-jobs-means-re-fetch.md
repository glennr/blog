---
title: "Re-fetch on a 409 when two Oban jobs create the same record"
date: 2026-02-05T22:20:50+10:00
draft: false
format: til
tags:
  - elixir
  - oban
  - appsignal
---

When two Oban jobs GET the same record at once, both get a 404 and both POST
it. The second POST gets a
[409 Conflict](https://www.rfc-editor.org/rfc/rfc9110#name-409-conflict). That
409 means the record exists now, so fetch it again and carry on.

We returned the 409 as an error instead. Oban retried the job until a later
GET found the record. The job got there in the end, but each retry reported an
error to AppSignal.

The fix matches the conflict right after the create. `Request.create/1` is the
POST, and `request_get/1` is the same GET the job started with:

```elixir
params
|> Request.create()
|> case do
  {:error, [%{"title" => "Conflict"} | _]} ->
    # another job created it between our GET and POST
    request_get(params)

  result ->
    handle_result(result)
end
```

That match takes any 409 Conflict as "already exists". On an endpoint that
can conflict for another reason, match the error detail too.
