# SequenceDiagram.js

A lightweight, zero-dependency JavaScript library for rendering UML sequence diagrams as inline SVG. No build step required — drop in one script tag and go.

---

## Features

- Parses a simple plain-text syntax into SVG sequence diagrams
- Supports right, left, and bidirectional arrows
- Automatically measures text and adjusts actor spacing so labels never overlap arrows
- Multiple independent diagrams can coexist on the same page
- Fully styleable via CSS classes
- Extensible via actor/signal wrappers and custom parsers

---

## Quick Start

```html
<div id="my-diagram"></div>

<script src="sequenceDiagram.js"></script>
<script>
  var d = new diagram();
  d.setContainerDiv('my-diagram');
  d.parse(
    'Client->Server: POST /login\n' +
    'Server->Database: SELECT user\n' +
    'Database->Server: User record\n' +
    'Server->Client: 200 OK + JWT'
  );
  d.draw();
</script>
```

---

## Diagram Syntax

Each line of input describes one signal (arrow) between two actors:

```
ActorA ARROW ActorB: Message text
```

Actor names containing spaces must be wrapped in double quotes:

```
"My Service"->"Other Service": Call
```

### Arrow Types

| Syntax | Direction | Description |
|--------|-----------|-------------|
| `A->B: msg` | → | Right arrow — forward call |
| `A<-B: msg` | ← | Left arrow — response / reply |
| `A<>B: msg` | ↔ | Bidirectional |
| `A--B: msg` | — | No arrowhead — association |
| `A-->B: msg` | → | Right arrow, sets `dashed` flag |
| `A<->B: msg` | ↔ | Bidirectional, sets `dashed` flag |

The arrow string must be 2 or 3 characters composed of `<`, `>`, and `-`.

> **Note:** The `dashed` flag is stored on the signal object but visual dash rendering must be applied via CSS or a custom signal wrapper (see [Extensibility](#extensibility) below).

### Actor ordering

Actors are registered in the order they first appear in the input. Left-to-right layout follows that order. When a signal references an actor that appears to the left of the other, the arrow is automatically drawn in the correct visual direction.

---

## API Reference

### `new diagram()`

Creates a new diagram instance. Each instance is independent and generates unique internal IDs, so multiple diagrams on the same page are fully supported.

---

### `diagram.setContainerDiv(id)`

Binds the diagram to a DOM element by its `id`. Must be called before `draw()`.

```js
d.setContainerDiv('container-id');
```

---

### `diagram.parse(input)`

Parses the plain-text input string and populates the actor and signal lists. Call this before `draw()`.

```js
d.parse('A->B: Hello\nB->A: World');
```

Lines that do not match the signal syntax are silently skipped, so you can include blank lines or comments freely.

---

### `diagram.draw()`

Renders the diagram into the container element as an SVG. Clears any previous content in the container first, so it is safe to call `draw()` again after re-parsing to update the diagram.

```js
d.draw();
```

---

### `diagram.addClass(key, className)`

Adds an extra CSS class to all actor or signal SVG groups. `key` must be `'actor'` or `'signal'`.

```js
d.addClass('actor', 'my-actor-style');
d.addClass('signal', 'my-signal-style');
```

---

### `diagram.addWrapper(key, fn)`

Registers a wrapper function that is called for each actor or signal SVG group before it is appended to the SVG. Use this to inject hyperlinks, tooltips, or any custom SVG structure. `key` must be `'actor'` or `'signal'`.

```js
// Wrap every actor box in an <a> element
d.addWrapper('actor', function(actor, group) {
  var a = document.createElementNS('http://www.w3.org/2000/svg', 'a');
  a.setAttribute('href', '/actors/' + actor.key);
  a.appendChild(group);
  return a;
});
```

The function receives:
- `actor` / `signal` — the data object (see [Data Objects](#data-objects))
- `group` — the SVG `<g>` element

It must return an SVG element that will be appended to the diagram.

---

### `diagram.addParser(rule, fn)`

Registers a custom line parser. Reserved for extension; not currently invoked by the built-in `parse()` method.

---

## Data Objects

### Actor

| Property | Type | Description |
|----------|------|-------------|
| `key` | string | Actor identifier (the name as written in the input) |
| `name` | string | Display name (same as `key` by default) |
| `x_pos` | number | Center X coordinate in the SVG (set during `draw()`) |
| `width` | number | Box width in pixels (set during `draw()`) |

### Signal

| Property | Type | Description |
|----------|------|-------------|
| `actorA` | Actor | Left-side actor object |
| `actorB` | Actor | Right-side actor object |
| `message` | string | Label text |
| `direction` | string | `'right'`, `'left'`, `'bi'`, or `'none'` |
| `dashed` | boolean | `true` when a 3-character arrow was used (e.g. `-->`) |
| `index` | number | Zero-based position in the signal list |

---

## CSS Customization

The SVG output uses the following CSS classes. Override them in your stylesheet to change colors, fonts, stroke styles, and more.

| Class | Applied to |
|-------|-----------|
| `squncDgrm` | Root `<svg>` element |
| `squncDgrm-actor` | Actor `<g>` group (top and bottom boxes) |
| `squncDgrm-actor_line` | Vertical lifeline `<line>` |
| `squncDgrm-signal` | Signal label `<g>` group |
| `squncDgrm-signal_line` | Horizontal arrow `<line>` |
| `squncDgrm-signal_message` | Signal label `<text>` |
| `squncDgrm-signal_rect` | White background `<rect>` behind label text |
| `squncDgrm-marker_arrow` | Arrowhead `<path>` inside SVG `<marker>` |

### Example

```css
.squncDgrm-actor rect {
  fill: #EFF6FF;
  stroke: #3B82F6;
  stroke-width: 1.5px;
}
.squncDgrm-actor text {
  font-size: 12px;
  font-weight: 600;
  fill: #1D4ED8;
}
.squncDgrm-actor_line {
  stroke: #CBD5E1;
  stroke-dasharray: 5 4;
}
.squncDgrm-signal_line {
  stroke: #334155;
  stroke-width: 1.5px;
}
.squncDgrm-signal_message {
  font-size: 11px;
  fill: #1E293B;
}
```

---

## Multiple Diagrams on One Page

Each `new diagram()` call generates a unique internal ID prefix, so filters, markers, and actor/signal elements never collide across instances.

```js
var d1 = new diagram();
d1.setContainerDiv('diagram-1');
d1.parse('A->B: Request\nB->A: Response');
d1.draw();

var d2 = new diagram();
d2.setContainerDiv('diagram-2');
d2.parse('X->Y: Ping\nY->X: Pong');
d2.draw();
```

---

## Layout Behavior

- Actors are drawn left to right in the order they first appear in the input.
- Each actor gets a top box and a mirrored bottom box connected by a dashed lifeline.
- Signal labels are measured after render; if a label is wider than the gap between two actors, the right-side actor (and all actors to its right) is automatically shifted to make room. All previously drawn signal arrows are updated to follow.
- The SVG width is sized to fit all actors after any shifts are applied.
