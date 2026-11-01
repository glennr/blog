---
title: "Let Claude Code design in the running app"
description: "Why I stopped relaying work between Claude Design and Claude Code, and moved the design step into the app itself"
date: 2026-11-01T19:33:43+10:00
draft: true
format: explainer
client: true
categories:
  - ai
tags:
  - claude-code
  - ux
  - phoenix
alt: "A risograph print of a phone sketch on an easel, beside a real phone screen being marked up with a pencil"
illustration:
  style: risograph
  subject: "an empty easel holding a paper sketch of a phone screen, ignored, while beside it a real working phone screen is being marked up directly with a pencil"
  prompt: |
    Draw the header illustration for a blog post.

    House style:
    Medium: a risograph print in two or three spot inks, with visible grain,
    slight misregistration between layers, and flat overlapping shapes.
    Palette: fluorescent pink #FF48B0, teal #00838A and yellow #FFE800 on uncoated
    cream paper #F6F0E1. Where two inks overlap, let them mix.
    Composition: an editorial illustration that turns the post's idea into a
    metaphor with everyday objects (a jammed drawer, a tangled hose, two keys on
    one ring). Big, simple shapes, one clear focal object, a playful tilt.
    Mood: wry and a bit cheeky, like the cover of a small zine.
    Avoid: any text, letters, numbers or labels; logos; faces or people; photo
    realism; gradients; glowing brains, robots, circuit patterns or sci-fi light.

    The post is titled "Let Claude Code design in the running app".
    It is about this: Why I stopped relaying work between Claude Design and Claude Code, and moved the design step into the app itself
    The picture shows: an empty easel holding a paper sketch of a phone screen, ignored, while beside it a real working phone screen is being marked up directly with a pencil

    Frame it as a wide 16:9 landscape. Keep the subject in the centre, with
    nothing important near the left and right edges, because the image is
    cropped to 16:9 from the centre. The picture must contain no text at all.

    Save it in the current directory as feature.png.
---

> [!TLDR]
> On projects without a full-time designer, Claude Design can help cover some bases. In my setup, Claude Code can't start or message its chat. So I carried each round in as a zip and pasted the replies back out. Nobody worked in the canvas, so keeping it current was overhead. Now Claude Code builds design options as pages in the running app. It recommends one and waits for my sign-off.

We're building a [Phoenix LiveView](https://hexdocs.pm/phoenix_live_view/) app with Claude Code, without a full-time designer. My part is getting each screen change designed before it's built. [Claude Design](https://claude.ai/design) looked like it could cover that. It is a canvas of boards, with a chat that draws on them.

## Why the canvas needed me

As far as I know, Claude Code can't start or message a Claude Design chat. The two share files: the canvas and a copy of the design system. So getting work in meant a zip. Claude Code packed the specs (the GitHub issues that describe each change), the design tokens (the colour, spacing and type values), 60 screenshots and a list of prompts. I uploaded it and pasted the prompts in one at a time. Getting work out meant me as well: in one session I pasted Claude Design's replies into Claude Code twice in ten minutes.

To cut the relay, Claude Code wrote a canvas page for each piece of work, with skills (sets of instructions Claude Code loads for one kind of job). The page held the screens as they are today and a brief for the change. I still started each round:

```mermaid
flowchart TD
  A[Claude Code writes the page] --> B[I start the chat]
  B --> C[Claude Design draws, logs decisions]
  C --> D[Claude Code updates the spec]
```

A team with a designer would keep a library of every screen, in [Figma](https://www.figma.com) or in code with a component catalogue such as [Storybook](https://storybook.js.org). I kept one on the canvas for a while, and keeping it in sync felt like a fool's errand. Nobody sits in the canvas owning those boards, and the code moves faster than they do. So Claude Code drew the current screens fresh from the code for each piece of work, and the canvas was overhead nobody used.

## Design in the app

I wanted Claude Code to design in the app, show me options and stop only for my call. Skipping the design step isn't the answer, even for a small fix. One that wrapped a row of links reached review with no screenshots, and it looked broken on a phone.

So I built a `ux` skill on [`impeccable`](https://github.com/pbakaus/impeccable), a design skill that works on the real components and data. `ux` calls it for two steps only, framing the options and critiquing the one it recommends. A run that used it throughout scored no better with a blind judge, on half again the tokens.

## Build options as dev pages

Claude Code runs `ux` when an issue changes a screen. It:

1. checks the design system for a pattern that already fits
2. runs `impeccable`'s `shape` step, which frames the problem and the options
3. builds each option as a development-only page, or behind a development-only switch on the real screen
4. screenshots each in a headless browser (one with no window): phone, tablet and desktop, light and dark
5. picks one, critiques it with `impeccable`, and recommends it

Then it posts its recommendation on the issue and stops:

```text
Recommend A: <why>. Tradeoff: <what A gives up>.
A: http://localhost:<port>/dev/ux/<issue>/a
B: http://localhost:<port>/dev/ux/<issue>/b
Sign off, or redirect.
```

Each page has a switcher to the others. Claude Code builds once I sign off. A UI fix goes through `ux` too, however small; it can come down to one option and its screenshots.

```mermaid
flowchart TD
  A[ux] --> B[Check design system]
  B --> C[Options as dev pages]
  C --> D[Headless screenshots]
  D --> E[Critique, recommend]
  E --> F[I sign off]
  F -->|redirect| C
```

## When the canvas still fits

A large new flow has many screens, and a canvas page shows them together. I'd keep the canvas skills for that.
