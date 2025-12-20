import { Ref } from "./ref.js";
import type { ChildLike, Props } from "./types.js";
import { onUnmount } from "./cleanup.js";
import { appendChild, h } from "./h.js";

/**
 * Create a container element that renders the contents of a reactive list.
 *
 * This implementation fully re-renders all children whenever `items` changes.
 * It favors simplicity and correctness over keyed diffing and DOM state preservation.
 *
 * @typeParam K - HTML tag name of the container element.
 * @typeParam T - Item type contained in `items`.
 *
 * @param tag - HTML tag for the container.
 * @param props - Properties/attributes/event handlers applied to the container.
 * @param items - Reactive list of items.
 * @param renderFn - Maps an item and its index to child content.
 * @returns The created container element.
 *
 * @example
 * ```ts
 * const items = new Ref<readonly string[]>(["a", "b"]);
 *
 * const el = list("ul", { className: "menu" }, items, (text) =>
 *   h("li", null, text)
 * );
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
    while (parent.firstChild) parent.removeChild(parent.firstChild);
  };

  const render = (): void => {
    clearChildren();

    const listItems = items.get();
    if (listItems.length === 0) return;

    // Batch DOM writes to avoid repeatedly appending to the live container in a loop.
    const frag = document.createDocumentFragment();

    let index = 0;
    for (const item of listItems) {
      appendChild(frag, renderFn(item, index++));
    }

    parent.appendChild(frag);
  };

  render();

  const unsub = items.subscribe(render);
  onUnmount(parent, unsub);

  return parent;
}
