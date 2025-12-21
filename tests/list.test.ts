/**
 * @vitest-environment jsdom
 */

import { describe, expect, it, vi } from "vitest";
import { list } from "../src/public/list";
import { h } from "../src/public/h";
import { ref } from "../src/public/ref";
import { mount } from "../src/public/mount";

async function flushMutations(): Promise<void> {
  // In jsdom, MutationObserver callbacks are scheduled as microtasks.
  // Some environments require an extra microtask tick to reliably flush.
  await new Promise<void>((resolve) => queueMicrotask(resolve));
  await new Promise<void>((resolve) => queueMicrotask(resolve));
}

describe("list()", () => {
  it("creates an element and renders initial items", () => {
    const items = ref<readonly number[]>([1, 2, 3]);

    const ul = list("ul", null, items, (item) => h("li", null, String(item)));

    expect(ul.tagName).toBe("UL");
    expect(ul.childNodes.length).toBe(3);
    expect(ul.textContent).toBe("123");
  });

  it("applies props to the parent element", () => {
    const items = ref<readonly number[]>([1]);

    const ul = list("ul", { id: "numbers", className: "menu" }, items, (item) =>
      h("li", null, String(item))
    );

    expect(ul.id).toBe("numbers");
    expect(ul.className).toBe("menu");
  });

  it("re-renders when items grow", () => {
    const items = ref<readonly number[]>([1, 2, 3]);
    const ul = list("ul", null, items, (item) => h("li", null, String(item)));

    items.set([...items.get(), 4]);

    expect(ul.childNodes.length).toBe(4);
    expect(ul.textContent).toBe("1234");
  });

  it("re-renders when items change (replaces children, does not append)", () => {
    const items = ref<readonly number[]>([1, 2, 3]);
    const ul = list("ul", null, items, (item) => h("li", null, String(item)));

    items.set([9]);

    expect(ul.childNodes.length).toBe(1);
    expect(ul.textContent).toBe("9");

    items.set([4, 5]);
    expect(ul.childNodes.length).toBe(2);
    expect(ul.textContent).toBe("45");
  });

  it("re-renders when items shrink", () => {
    const items = ref<readonly number[]>([1, 2, 3]);
    const ul = list("ul", null, items, (item) => h("li", null, String(item)));

    items.set(items.get().filter((n) => n !== 2));

    expect(ul.childNodes.length).toBe(2);
    expect(ul.textContent).toBe("13");
  });

  it("clears children when items become empty", () => {
    const items = ref<readonly number[]>([1, 2]);
    const ul = list("ul", null, items, (item) => h("li", null, String(item)));

    items.set([]);

    expect(ul.childNodes.length).toBe(0);
    expect(ul.textContent).toBe("");
  });

  it("passes the correct index to renderFn on each render", () => {
    const items = ref<readonly string[]>(["a", "b", "c"]);
    const renderFn = vi.fn((value: string, index: number) =>
      h("li", null, `${index}:${value}`)
    );

    const ul = list("ul", null, items, renderFn);

    expect(renderFn).toHaveBeenCalledTimes(3);
    expect(renderFn).toHaveBeenNthCalledWith(1, "a", 0);
    expect(renderFn).toHaveBeenNthCalledWith(2, "b", 1);
    expect(renderFn).toHaveBeenNthCalledWith(3, "c", 2);
    expect(ul.textContent).toBe("0:a1:b2:c");

    renderFn.mockClear();
    items.set(["x", "y"]);

    expect(renderFn).toHaveBeenCalledTimes(2);
    expect(renderFn).toHaveBeenNthCalledWith(1, "x", 0);
    expect(renderFn).toHaveBeenNthCalledWith(2, "y", 1);
    expect(ul.textContent).toBe("0:x1:y");
  });

  it("replaces DOM nodes on each re-render (no diffing)", () => {
    const items = ref<readonly number[]>([1, 2, 3]);
    const ul = list("ul", null, items, (item) => h("li", null, String(item)));

    const firstLiBefore = ul.firstChild;
    expect(firstLiBefore).not.toBeNull();

    items.set([1, 2, 3, 4]);

    const firstLiAfter = ul.firstChild;
    expect(firstLiAfter).not.toBeNull();

    expect(firstLiAfter).not.toBe(firstLiBefore);
  });

  it("does not cleanup on move (node stays connected)", async () => {
    const items = ref<readonly number[]>([1, 2, 3]);
    const renderFn = vi.fn((item: number) => h("li", null, String(item)));

    const root = document.createElement("div");
    const other = document.createElement("div");
    document.body.appendChild(root);
    document.body.appendChild(other);

    mount(root, () => list("ul", null, items, renderFn));

    const ul = root.querySelector("ul");
    expect(ul).not.toBeNull();

    renderFn.mockClear();

    // Move (not destroy): DOM nodes cannot exist in two places; this re-parents the same node.
    other.appendChild(ul!);

    expect(other.querySelector("ul")).toBe(ul);
    expect(root.querySelector("ul")).toBeNull();
    expect(ul!.isConnected).toBe(true);

    await flushMutations();

    // Subscription should still be active after move.
    items.set([7, 8]);

    expect(renderFn).toHaveBeenCalledTimes(2);
    expect(other.querySelector("ul")?.textContent).toBe("78");

    document.body.removeChild(root);
    document.body.removeChild(other);
  });

  it("cleans up subscription on removal (unmount)", async () => {
    const items = ref<readonly number[]>([1, 2, 3]);
    const renderFn = vi.fn((item: number) => h("li", null, String(item)));

    const root = document.createElement("div");
    document.body.appendChild(root);

    mount(root, () => list("ul", null, items, renderFn));

    // Initial render happened:
    expect(renderFn).toHaveBeenCalledTimes(3);

    const ul = root.querySelector("ul");
    expect(ul).not.toBeNull();

    renderFn.mockClear();

    // Removal should trigger onUnmount via MutationObserver (since node becomes disconnected).
    ul!.remove();
    expect(ul!.isConnected).toBe(false);

    await flushMutations();

    // After unmount, updates must not re-render.
    items.set([9, 9, 9]);

    expect(renderFn).not.toHaveBeenCalled();

    document.body.removeChild(root);
  });
});
