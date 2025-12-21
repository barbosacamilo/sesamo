/**
 * Map each DOM node to the set of callbacks that should run when that node is
 * removed from the document.
 *
 * Using a `WeakMap` avoids retaining detached nodes in memory once nothing else
 * references them.
 *
 * @internal
 */
type UnmountCallback = () => void;

const nodeUnmountCallbacks = new WeakMap<Node, Set<UnmountCallback>>();

/**
 * Register a callback to run when `node` is removed from the document.
 *
 * @internal
 */
export function onUnmount(node: Node, fn: UnmountCallback): void {
  let set = nodeUnmountCallbacks.get(node);

  if (!set) {
    set = new Set<UnmountCallback>();
    nodeUnmountCallbacks.set(node, set);
  }

  set.add(fn);
}

/**
 * Global observer that detects removed nodes and triggers unmount cleanup.
 *
 * @internal
 */
export const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const removed of mutation.removedNodes) {
      // Nodes can appear in `removedNodes` even if they were moved elsewhere
      // during the same microtask; only unmount if they're truly detached.
      if (!removed.isConnected) {
        unmountTree(removed);
      }
    }
  }
});

/**
 * Walk a node tree and run all associated unmount callbacks.
 *
 * @internal
 */
export function unmountTree(root: Node): void {
  // Iterative traversal to avoid call stack growth on deep trees.
  const stack: Node[] = [root];

  while (stack.length) {
    const node = stack.pop()!;
    runUnmountCallbacks(node);

    // Preserve the same left-to-right order as recursive traversal:
    // push children in reverse so the first child is processed first.
    const children = node.childNodes;
    for (let i = children.length - 1; i >= 0; i--) {
      const child = children[i];
      if (child) stack.push(child);
    }
  }
}

/**
 * Run and clear all unmount callbacks associated with a node.
 *
 * @internal
 */
function runUnmountCallbacks(node: Node): void {
  const set = nodeUnmountCallbacks.get(node);
  if (!set) return;

  for (const fn of set) {
    try {
      fn();
    } catch {
      // Intentionally swallow errors so other callbacks still run.
    }
  }

  set.clear();
  nodeUnmountCallbacks.delete(node);
}
