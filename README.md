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

## Example: Counter (no bundler needed)

If you want to use **sesamo** in a plain HTML file without Vite/Webpack/etc.,  
you can import it directly from a CDN and use `mount()` to render your component.

### `index.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>sesamo counter (CDN)</title>
  </head>
  <body>
    <div id="app"></div>

    <script type="module">
      // Import sesamo directly from a CDN – works in any browser that supports ES modules.
      import {
        h,
        ref,
        mount,
      } from "https://unpkg.com/sesamo@latest/dist/index.js?module";

      // Reactive value for the count
      const count = ref(0);

      // A simple component
      function Counter() {
        return h(
          "button",
          {
            onclick: () => {
              count.set((n) => n + 1);
            },
          },
          "Clicked ",
          count,
          " times"
        );
      }

      // Mount the component into #app
      mount(document.getElementById("app"), Counter);
    </script>
  </body>
</html>
```

## Example: Counter (import map, no bundler)

If you’re serving your project with a simple static server (no bundler), you can use an
**import map** to tell the browser where `"sesamo"` lives on disk.

Assuming you installed `sesamo` with npm and are serving your project so that
`/node_modules` is accessible, you can do:

### `index.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>sesamo counter (import map)</title>

    <!-- Import map that tells the browser how to resolve "sesamo" -->
    <script type="importmap">
      {
        "imports": {
          "sesamo": "/node_modules/sesamo/dist/index.js"
        }
      }
    </script>
  </head>
  <body>
    <div id="app"></div>

    <script type="module">
      // Bare import specifier resolved via the import map above
      import { h, ref, mount } from "sesamo";

      const count = ref(0);

      function Counter() {
        return h(
          "button",
          {
            onclick: () => {
              count.set((n) => n + 1);
            },
          },
          "Clicked ",
          count,
          " times"
        );
      }

      const root = document.getElementById("app");
      if (root) {
        mount(root, Counter);
      }
    </script>
  </body>
</html>
```
