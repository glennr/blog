---
title: "SaladUI leaves a stale keydown handler on re-render"
date: 2026-11-23T12:00:00+10:00
draft: false
client: true
format: til
slug: saladui-leaves-a-stale-keydown-handler-on-re-render
showReadingTime: false
tags:
  - TIL
  - saladui
  - liveview
  - javascript
---

When LiveView re-renders a [SaladUI](https://github.com/bluzky/salad_ui) dialog
or menu, a keydown handler from the old component stays on the element. The
next key pressed in it logs this, once per stale component:

```text
TypeError: Cannot read properties of null (reading 'state')
```

SaladUI keeps a component's keydown handlers in a `Map`
[keyed by element](https://github.com/bluzky/salad_ui/blob/v1.0.0/assets/salad_ui/core/component.js#L325).
A dialog has one key map for its closed state and one for its open state, both
on the same element, so the second `set` overwrites the first, and `destroy()`
removes only that one.

On an update, SaladUI's LiveView hook
[destroys the component](https://github.com/bluzky/salad_ui/blob/v1.0.0/assets/salad_ui/core/hook.js#L45)
and builds a new one on the same element. `destroy()` sets `stateMachine` to
`null`, and the leftover handler
[reads `this.stateMachine.state`](https://github.com/bluzky/salad_ui/blob/v1.0.0/assets/salad_ui/core/component.js#L308).
Nothing visible breaks, and a reload clears it.

SaladUI 1.0.0 and its main branch both have it. The fix in `app.js` keys the
map by handler instead:

```javascript
import Component from "salad_ui/core/component"

const setupKeyEventHandlers = Component.prototype.setupKeyEventHandlers
Component.prototype.setupKeyEventHandlers = function () {
  const handlers = this.keyEventHandlers
  this.keyEventHandlers = {set: (element, handler) => handlers.set(handler, element)}
  setupKeyEventHandlers.call(this)
  this.keyEventHandlers = handlers
}
Component.prototype.removeKeyEventHandlers = function () {
  this.keyEventHandlers.forEach((element, handler) => element.removeEventListener("keydown", handler))
  this.keyEventHandlers.clear()
}
```
