import type { Component } from "./types.js";
import { traverseRemovedTree } from "./cleanup.js";

/**
 * Track which roots are already being observed so we don't
 * attach the MutationObserver more than once per root.
 *
 * @internal
 */
const observedRoots = new WeakSet<Node>();

/**
 * Global MutationObserver used to detect nodes that were removed
 * from any mounted root.
 *
 * @internal
 */
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    mutation.removedNodes.forEach((removed) => {
      // If the node is still connected somewhere in the document,
      // it was moved rather than destroyed, so skip running unmount callbacks.
      if (!removed.isConnected) {
        traverseRemovedTree(removed);
      }
    });
  }
});

/**
 * Mount a component into a root element and start Sesamo.
 *
 * - Renders the `component` into `root`, replacing any existing children.
 * - Starts observing the root so nodes that registered unmount callbacks
 *   (event listeners, subscriptions, etc.) are cleaned up automatically
 *   when they are removed from the DOM via the MutationObserver API.
 *
 * This is the main entry point to bootstrap an app:
 *
 * @example
 * ```ts
 * import { mount } from "sesamo";
 *
 * const App = () => h("button", { onclick: () => alert("hi") }, "Click me");
 *
 * mount(document.getElementById("app")!, App);
 * ```
 */
export function mount(root: HTMLElement, component: Component): void {
  root.replaceChildren(component());

  if (!observedRoots.has(root)) {
    observer.observe(root, { childList: true, subtree: true });
    observedRoots.add(root);
  }
}
