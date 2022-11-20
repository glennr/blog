---
title: "ESLint config for React + Redux projects"
description: "ESLint config for React + Redux projects"
date: 2015-11-19
categories:
  - web development
tags:
  - tooling
  - JavaScript
  - ReactJS
  - Redux
  - static-analysis
  - SCA
---

In my ongoing love affair with static code analysis tools, I wanted to find a good code linter for JavaScript, to use with Sublime. More specifically, a ReactJS project, with Mocha for tests, and of course using the awesome ES6 syntax (with Babel).

With a background in Ruby and Go, I'm used to some great tooling like Rubocop/BeautifyRuby/govet/gofmt/golint. There is a tight feedback loop when running a linter (automatically on saving a file). A team discussing+agreeing+following+evolving the same coding style on a project is a good thing, and fun process to be a part of.

Also, if you're relatively new to a language, code linters can be a great source of learning to avoid common mistakes.

In terms of JavaScript, there are some decent JS linter tools out there, for example;

- [JSLint](http://www.jslint.com/)
- [JSCS](http://jscs.info/)
- [JSHint](jshint.com)
- [ESLint](http://eslint.org/)

In the context of my problem, Sublime+ES6+Babel, it came down to JSHint vs ESLint. JSHint was okay, and had decent support via [SublimeLinter-jshint](https://github.com/SublimeLinter/SublimeLinter-jshint). However I was able to get up and running much faster with ESLint, [with some help from Mr Redux himself, Dan A](https://medium.com/@dan_abramov/lint-like-it-s-2015-6987d44c5b48#.fxqvf1ja6).

My current .eslintrc looks like this;

<script src="https://gist.github.com/glennr/6070f2c5a28ac397572b.js"></script>

Main style points include;

- 2-space indentation
- [dangling comma's OK](http://eslint.org/docs/rules/comma-dangle.html)
- Standard [ESLint React Plugin](https://github.com/yannickcr/eslint-plugin-react) rules.
