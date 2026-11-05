---
title: "Phoenix filter_parameters doesn't redact tokens in the URL path"
date: 2026-11-05T21:34:51+10:00
draft: true
format: til
tags:
  - phoenix
  - elixir
  - logger
---

Phoenix's `filter_parameters` only hides parameter values in the `Parameters:`
line. [`Phoenix.Logger`](https://github.com/phoenixframework/phoenix/blob/v1.8.15/lib/phoenix/logger.ex#L240-L249)
logs the raw `request_path` in the request line, at info by default:

```elixir
%{method: method, request_path: request_path} = conn
[method, ?\s, request_path]
```

So a magic link like `/users/log-in/:token` lands in production logs whole.
Anyone reading them before the link is used can log in as that user.
(I found this reading the source.)

I added a [`:logger` primary filter](https://www.erlang.org/doc/apps/kernel/logger_chapter.html#filters)
that rewrites the token segment to `[FILTERED]` in log lines and crash reports,
whichever library logged them.

- `:logger.add_primary_filter/2` puts a new filter first, before Elixir's
  translator (which turns crash reports into text), so crash text gets
  past it. Append it instead.
- `:logger` removes a filter that raises, for good, so `scrub` swaps an
  unreadable line for a placeholder.

```elixir {filename="lib/my_app_web/token_paths.ex"}
defmodule MyAppWeb.TokenPaths do
  @token_paths ~w(invites users/log-in users/settings/confirm-email)
  @token_in_path ~r{((?:^|/)(?:#{Enum.join(@token_paths, "|")})/)[^/?#\s]+}

  def redact(text) when is_binary(text), do: Regex.replace(@token_in_path, text, "\\1[FILTERED]")

  # Call from Application.start/2, before the supervision tree
  def install_log_filter do
    entry = {:token_paths, {&__MODULE__.filter_log/2, []}}
    %{filters: filters} = :logger.get_primary_config()
    :logger.set_primary_config(:filters, List.keystore(filters, :token_paths, 0, entry))
  end

  def filter_log(%{msg: {:string, text}} = event, _config), do: scrub(event, text, &{:string, &1})

  # On Elixir 1.20 a translated crash is still a report; handlers print this text
  def filter_log(%{msg: {:report, %{elixir_translation: text} = report}} = event, _config) do
    scrub(event, text, &{:report, %{report | elixir_translation: &1}})
  end

  def filter_log(_event, _config), do: :ignore

  defp scrub(event, text, msg) do
    with {:ok, binary} <- to_binary(text), ^binary <- redact(binary) do
      :ignore
    else
      :error -> %{event | msg: msg.("[FILTERED: unreadable log line]")}
      redacted -> %{event | msg: msg.(redacted)}
    end
  end

  defp to_binary(text) when is_binary(text), do: {:ok, text}

  defp to_binary(text) do
    case :unicode.characters_to_binary(text) do
      binary when is_binary(binary) -> {:ok, binary}
      _invalid -> :error
    end
  rescue
    ArgumentError -> :error
  end
end
```

A test walks the router, so a new `:token` route fails until it's on the list:

```elixir
test "every route with a token in its path is redacted" do
  paths =
    for %{path: path} <- Phoenix.Router.routes(MyAppWeb.Router), path =~ ~r/:\w*token/, uniq: true do
      Regex.replace(~r/:\w+/, path, "SECRET")
    end

  for path <- paths do
    refute TokenPaths.redact(path) =~ "SECRET", "#{path} is missing from @token_paths"
  end
end
```

The test matches the parameter name, so a new `/share/:code` route still leaks.
