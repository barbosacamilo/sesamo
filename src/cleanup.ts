import type { Component, UnmountCallback } from "./types.js";

/**
 * Map each DOM node to the set of callbacks that should run
 * when that node is removed from the DOM.
 *
 * @internal
 */
const nodeUnmountCallbacks = new WeakMap<Node, Set<UnmountCallback>>();

/**
 * Register a callback to run when this specific node is removed
 * from the DOM.
 *
 * @internal
 */
export function onUnmount(node: Node, fn: UnmountCallback): void {
  let set = nodeUnmountCallbacks.get(node);

  if (!set) {
    set = new Set();
    nodeUnmountCallbacks.set(node, set);
  }

  set.add(fn);
}

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
 * Walk a removed subtree and apply a visitor function
 * to each node in the tree.
 *
 * @internal
 */
function traverseRemovedTree(node: Node): void {
  runUnmountCallbacks(node);

  node.childNodes.forEach((child) => {
    traverseRemovedTree(child);
  });
}

/**
 * Run and clear all unmount callbacks associated with a node.
 *
 * @internal
 */
function runUnmountCallbacks(node: Node): void {
  const set = nodeUnmountCallbacks.get(node);
  if (!set) return;

  // Snapshot before running, then clear so callbacks can safely
  // register new unmount callbacks if needed.
  const callbacks = Array.from(set);
  set.clear();
  nodeUnmountCallbacks.delete(node);

  for (const fn of callbacks) {
    try {
      fn();
    } catch {
      // Ignore errors so one failing cleanup doesn't block others.
    }
  }
}

/**
 * Track which roots are already being observed so we don't
 * attach the MutationObserver more than once per root.
 *
 * @internal
 */
const observedRoots = new WeakSet<Node>();

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
