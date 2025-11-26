import { Ref } from "./ref.js";
import { onUnmount } from "./cleanup.js";
import type { Child, Hole, Props } from "./types.js";

/**
 * Treat null, undefined, and boolean as "holes" (no visible output).
 *
 * @internal
 */
function isHole(value: unknown): value is Hole {
  return value == null || typeof value === "boolean";
}

/**
 * Apply a props object to a DOM element.
 * Supports `style` as a string or style object and `onClick`-style event props.
 *
 * @internal
 */
function setProps<K extends keyof HTMLElementTagNameMap>(
  el: HTMLElementTagNameMap[K],
  props?: Props<K> | null
): void {
  if (!props) return;

  for (const [name, value] of Object.entries(props)) {
    // Skip null/undefined props so callers can pass optional values.
    if (value == null) continue;

    if (name === "style") {
      applyStyle(el, value);
      continue;
    }

    if (name.startsWith("on") && typeof value === "function") {
      attachEventListener(el, name, value as EventListener);
      continue;
    }

    // Prefer setting known properties (e.g. `value`, `checked`) directly
    // and fall back to attributes for everything else.
    if (name in el) {
      (el as any)[name] = value;
    } else {
      el.setAttribute(name, String(value));
    }
  }
}

/**
 * Handle `style` prop: accept either a CSS string or a style object.
 *
 * @internal
 */
function applyStyle(el: HTMLElement, value: unknown): void {
  if (typeof value === "string") {
    // Raw CSS string: "color: red; background: blue;"
    el.setAttribute("style", value);
  } else if (value && typeof value === "object") {
    // Style object: { color: "red", backgroundColor: "blue" }
    Object.assign(el.style, value as Partial<CSSStyleDeclaration>);
  } else {
    throw new Error("Invalid value for 'props.style'");
  }
}

/**
 * Handle `onClick`-style event props.
 *
 * @internal
 */
function attachEventListener(
  el: HTMLElement,
  name: string,
  listener: EventListener
): void {
  const type = name.slice(2).toLowerCase();

  el.addEventListener(type, listener);

  // Ensure the listener is removed when this element is unmounted.
  onUnmount(el, () => el.removeEventListener(type, listener));
}

/**
 * Append a list of children to a parent node, delegating the handling
 * of each child to `appendChild`.
 *
 * @internal
 */
function appendChildren(parent: Node, children: Child[]): void {
  for (const child of children) {
    appendChild(parent, child);
  }
}

/**
 * Append a single child value to a parent node.
 *
 * - Holes (null/undefined/boolean) are ignored.
 * - `Ref` values are bound to a text node and kept in sync.
 * - Nodes are appended directly.
 * - Everything else is stringified into a text node.
 *
 * @internal
 */
function appendChild(parent: Node, child: Child): void {
  if (isHole(child)) return;

  if (child instanceof Ref) {
    appendRefChild(parent, child);
    return;
  }

  if (child instanceof Node) {
    parent.appendChild(child);
    return;
  }

  parent.appendChild(document.createTextNode(String(child)));
}

/**
 * Bind a `Ref` to a text node inside the DOM so that updates to the ref
 * automatically update the rendered text.
 *
 * @internal
 */
function appendRefChild(parent: Node, ref: Ref<any>): void {
  const textNode = document.createTextNode("");
  parent.appendChild(textNode);

  const render = () => {
    const value = ref.get();
    textNode.textContent = isHole(value) ? "" : String(value);
  };

  render();

  ref.subscribe(render);
  onUnmount(textNode, () => ref.unsub(render));
}

/**
 * Create a DOM element with props and children, similar to JSX/React.createElement.
 *
 * @typeParam K - Tag name of the element to create (e.g. `"div"`, `"button"`).
 * @param tag - The HTML tag to create.
 * @param props - Attributes, properties, and event handlers to apply to the element.
 * @param children - Child nodes or values to append to the element.
 * @returns The created HTMLElement.
 *
 * @example
 * const button = h("button", { onclick: () => alert("hi") }, "Click me");
 * document.body.append(button);
 */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Props<K> | null,
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  setProps(el, props);
  appendChildren(el, children);
  return el;
}
