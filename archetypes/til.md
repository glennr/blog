---
title: "{{ replace .File.ContentBaseName "-" " " | humanize }}"
date: {{ .Date }}
draft: true
client: false
format: til
slug: {{ .File.ContentBaseName }}
showReadingTime: false
tags:
  - TIL
---
