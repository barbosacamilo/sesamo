import type { ChildLike, Props } from "./types.js";

import { onUnmount } from "../internal/cleanup.js";
import { appendChild } from "../internal/dom.js";

/**
 * Create a DOM element with props and children.
 *
 * @typeParam K - HTML tag name.
 *
 * @param tag - HTML tag for the element.
 * @param props - Properties/attributes/event handlers applied to the element.
 * @param children - Child values to append to the element.
 *
 * @returns The created HTML element.
 *
 * @example
 * const button = h("button", { onclick: () => alert("hi") }, "Click me");
 */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props?: Props<K> | null,
  ...children: ChildLike[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);

  if (props) {
    setProps(el, props);
  }

  for (const child of children) {
    appendChild(el, child);
  }

  return el;
}

/**
 * Apply `props` to an element.
 *
 * @internal
 */
function setProps<K extends keyof HTMLElementTagNameMap>(
  el: HTMLElementTagNameMap[K],
  props: Props<K>
): void {
  for (const [name, value] of Object.entries(props)) {
    if (name === "style") {
      applyStyle(el, value);
      continue;
    }

    if (name.startsWith("on") && typeof value === "function") {
      attachEventListener(el, name, value as EventListener);
      continue;
    }

    if (name in el) {
      (el as any)[name] = value;
    } else {
      el.setAttribute(name, String(value));
    }
  }
}

/**
 * Apply inline styles.
 *
 * Accepts either:
 * - a CSS text string or
 * - an style object.
 *
 * @internal
 */
function applyStyle(el: HTMLElement, value: unknown): void {
  if (typeof value === "string") {
    el.setAttribute("style", value);
    return;
  }

  if (value && typeof value === "object") {
    Object.assign(el.style, value as Partial<CSSStyleDeclaration>);
    return;
  }

  throw new Error("props.style must be a string or an object");
}

/**
 * Attach an event listener and ensure it is removed when the element is unmounted.
 *
 * @internal
 */
function attachEventListener(
  el: HTMLElement,
  name: string,
  listener: EventListener
): void {
  // "onclick" -> "click"
  const type = name.slice(2).toLowerCase();

  el.addEventListener(type, listener);

  onUnmount(el, () => el.removeEventListener(type, listener));
}
