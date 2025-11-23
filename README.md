# sesamo

sesamo is a minimalist JavaScript UI library to avoid downloading 1TB of dependencies just to make a counter.

## Features

- **DOM:** works with the real DOM – no virtual DOM.
- **Reactivity:** `ref()` for tiny, straightforward reactive state.
- **Routing:** simple client-side routing with a tiny SPA-style router.
- **Modularity:** encourages small, composable functions and modules.
- **TypeScript:** written in TS and ships types out of the box.
- **API:** small, focused API instead of a giant surface area.
- **Dependencies:** zero runtime dependencies – only dev deps for TypeScript, tests, etc.

## Installation

```bash
npm install sesamo
# or
yarn add sesamo
# or
pnpm add sesamo
```

## Example: Counter

This example uses three files:

- `index.html` – the page with a root element.
- `counter.js` – the counter "component".
- `index.js` – the entrypoint that mounts the component.

### `index.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>sesamo counter</title>
  </head>
  <body>
    <!-- Root element where we'll render our app -->
    <div id="app"></div>

    <!-- Entry point of our app as an ES module -->
    <script type="module" src="./index.js"></script>
  </body>
</html>
```

### `index.js`

```js
// Import the Counter component from our module.
import { Counter } from "./counter.js";

// Find the root element in the DOM.
const root = document.getElementById("app");

// Render the Counter inside #app.
if (root) {
  // `Counter()` returns a DOM node, so we just replace the contents of #app with it.
  root.replaceChildren(Counter());
}
```

### `counter.js`

```js
// Import the primitives from sesamo
import { h, ref } from "sesamo";

// Create a reactive value for the count.
// `ref(0)` means the initial value is 0.
const count = ref(0);

// Define a Counter "component" as a plain function.
// It returns a DOM node created with `h()`.
export function Counter() {
  return h(
    "button",
    {
      // When the button is clicked, increase the count by 1.
      onclick: () => {
        // Using the "updater" form: receives current value and returns the next.
        count.set((current) => current + 1);
      },
    },
    // Children of the button:

    // Plain text node
    "Clicked ",

    // You can pass a ref directly as a child.
    // sesamo will keep this part of the DOM in sync with the ref's value.
    count,

    // Another plain text node
    " times"
  );
}
```
