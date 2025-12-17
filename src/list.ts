import { Ref } from "./ref.js";
import type { ChildLike, Props } from "./types.js";
import { onUnmount } from "./cleanup.js";
import { appendChild, h } from "./h.js";

/**
 * Creates an element that renders a list derived from a reactive `Ref`.
 *
 * The list is fully re-rendered on every change notification from `items`.
 * This favors correctness and simplicity over diffing.
 *
 * @typeParam K - HTML tag name of the parent element.
 * @typeParam T - Item type contained in the list.
 *
 * @param tag - The HTML tag to create for the list container.
 * @param props - Attributes/properties/event handlers to apply to the container.
 * @param items - Reactive container holding the current list of items.
 * @param renderFn - Maps an item + index to its rendered child content.
 * @returns The created container element.
 *
 * @example
 * ```ts
 * const items = new Ref<readonly string[]>(["a", "b"]);
 *
 * const el = list("ul", { className: "menu" }, items, (text) =>
 *   h("li", null, text)
 * );
 *
 * // Later: items.set(["x", "y", "z"]) -> re-renders <li> children.
 * ```
 */
export function list<K extends keyof HTMLElementTagNameMap, T>(
  tag: K,
  props: Props<K> | null,
  items: Ref<readonly T[]>,
  renderFn: (item: T, index: number) => ChildLike
): HTMLElementTagNameMap[K] {
  const parent = h(tag, props);

  const clearChildren = (): void => {
    // Use a simple loop for broad DOM compatibility and predictable semantics.
    while (parent.firstChild) parent.removeChild(parent.firstChild);
  };

  const render = (): void => {
    clearChildren();

    const current = items.get();
    if (current.length === 0) return;

    // Batch DOM writes to avoid repeated layout/paint work on large lists.
    const frag = document.createDocumentFragment();

    let index = 0;
    for (const item of current) {
      appendChild(frag, renderFn(item, index++));
    }

    parent.appendChild(frag);
  };

  render();

  items.subscribe(render);
  onUnmount(parent, () => items.unsub(render)); // Assumption A/B

  return parent;
}
