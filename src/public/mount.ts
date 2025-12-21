import type { Component } from "./types.js";
import { observer } from "../internal/cleanup.js";

/**
 * Track which roots are already being observed so we don't attach the
 * MutationObserver more than once per root.
 *
 * @internal
 */
const observedRoots = new WeakSet<Node>();

/**
 * Mount content into a root element.
 *
 * @param root - The container element to mount into.
 * @param content - A component function or a Node to mount.
 *
 * @example
 * ```ts
 * import { mount, h } from "sesamo";
 *
 * const App = () => h("button", { onclick: () => alert("hi") }, "Click me");
 *
 * mount(document.getElementById("app")!, App);
 * // or
 * mount(document.getElementById("app")!, App());
 * ```
 */
export function mount(root: HTMLElement, content: Component | Node): void {
  const node = typeof content === "function" ? content() : content;

  root.replaceChildren(node);

  if (!observedRoots.has(root)) {
    observer.observe(root, { childList: true, subtree: true });
    observedRoots.add(root);
  }
}
