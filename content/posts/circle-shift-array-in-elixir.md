---
title: "Circle Shift an Array in Elixir"
description: ""
date: 2020-09-27
categories:
  - Algorithms
tags:
  - Elixir
---

I recently came across a problem in Elixir where I needed to shift a list of items by a given offset aka an "Array Circular shift."

Other language solutions for this exist [on StackOverflow](https://stackoverflow.com/questions/876293/fastest-algorithm-for-circle-shift-n-sized-array-for-m-position) and [TheoryApp](http://theoryapp.com/array-circular-shift/).

These appear to be implementations of Jon Bentley's algorithm in [Programming Pearls 2nd Edition](https://www.oreilly.com/library/view/programming-pearls-second/9780134498058/), which solves the problem in O(n) time.

I wrote an Elixir implementation using [Enum.reverse_slice/3](https://hexdocs.pm/elixir/Enum.html#reverse_slice/3)

```elixir
  defmodule ListShift do
    @moduledoc """
    Circle shift a list by a given number of positions in O(n) time.

  An implementation of the algorithm described in Jon Bentley's "Programming Pearls 2nd Edition".

  ## Examples

      iex> ListShift.left([1, 2, 3, 4], 1)
      [2, 3, 4, 1]

      iex> ListShift.left([1, 2, 3, 4], 2)
      [3, 4, 1, 2]

      iex> ListShift.left([1, 2, 3, 4], 3)
      [4, 1, 2, 3]

      iex> ListShift.left([1, 2, 3, 4], 6)
      [1, 2, 3, 4]

      iex> ListShift.left([1, 2, 3, 4], -1)
      [1, 2, 3, 4]
  """

  def left(list, n) when n < 0, do: list

  def left(list, n) do
    size = Enum.count(list)

    list
    |> Enum.reverse_slice(n, size)
    |> Enum.reverse_slice(0, n)
    |> Enum.reverse_slice(0, size)
  end
end
```

Tested with [doctests](https://elixir-lang.org/getting-started/mix-otp/docs-tests-and-with.html#doctests) as follows:

```elixir
defmodule ListShiftTest do
  use ExUnit.Case
  doctest ListShift
end
```
