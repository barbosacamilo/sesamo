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
 * Walk a removed subtree and apply a visitor function
 * to each node in the tree.
 *
 * @internal
 */
export function traverseRemovedTree(node: Node): void {
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
