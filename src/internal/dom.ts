import { Ref } from "../public/ref.js";
import type { ChildLike, Hole } from "../public/types.js";

import { onUnmount } from "./cleanup.js";

/**
 * Treat null/undefined/boolean as "holes" (no visible output).
 *
 * @internal
 */
function isHole(value: unknown): value is Hole {
  return value == null || typeof value === "boolean";
}

/**
 * Append a `child` into `parent`.
 *
 * - Holes are ignored.
 * - Arrays are flattened recursively.
 * - `Ref` values are appended as a text binding.
 * - Nodes are appended directly.
 * - Primitives are stringified into Text nodes.
 *
 * @internal
 */
export function appendChild(parent: Node, child: ChildLike): void {
  if (isHole(child)) {
    return;
  }

  if (Array.isArray(child)) {
    for (const c of child) {
      appendChild(parent, c);
    }
    return;
  }

  if (child instanceof Ref) {
    appendRefText(parent, child);
    return;
  }

  if (child instanceof Node) {
    parent.appendChild(child);
    return;
  }

  // child = string | number
  parent.appendChild(document.createTextNode(String(child)));
}

/**
 * Create a text node and keep it in sync with `ref`.
 *
 * @internal
 */
function appendRefText(parent: Node, ref: Ref<unknown>): void {
  const textNode = document.createTextNode("");
  parent.appendChild(textNode);

  function updateText() {
    const value = ref.get();
    textNode.data = isHole(value) ? "" : String(value);
  }

  updateText();

  const unsub = ref.subscribe(updateText);
  onUnmount(textNode, unsub);
}
