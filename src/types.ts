import type { Ref } from "./ref.js";

/**
 * Function called when a reactive value changes.
 */
export type Subscriber = () => void;

/**
 * Functional updater used by `Ref.set`.
 *
 * Receives the current value and must return the next one.
 */
export type Updater<T> = (curr: T) => T;

/**
 * Values that render as “nothing” in the DOM.
 *
 * `null`, `undefined` and booleans are treated as holes and skipped.
 */
export type Hole = null | undefined | boolean;

/**
 * Primitive child values that become text nodes.
 */
export type PrimitiveChild = string | number;

/**
 * Any value that can be passed as a child into `h` / append helpers.
 *
 * - `PrimitiveChild` → text node
 * - `Ref` → bound to a text node and kept in sync
 * - `Hole` → ignored
 * - `Node` → appended directly
 */
export type Child = PrimitiveChild | Ref<any> | Hole | Node;

/**
 * A UI component: a function that returns a DOM node.
 */
export type Component = () => Node;

/**
 * Base props derived from the native HTMLElement type, without `style`.
 */
type NativeElementProps<K extends keyof HTMLElementTagNameMap> = Omit<
  Partial<HTMLElementTagNameMap[K]>,
  "style"
>;

/**
 * Props for an intrinsic HTML element (`"div"`, `"button"`, etc.).
 *
 * Based on the native element props, but with a friendlier `style` type
 * that accepts both:
 *   - a raw CSS string, or
 *   - a partial style object.
 */
export type Props<K extends keyof HTMLElementTagNameMap> =
  NativeElementProps<K> & {
    style?: string | Partial<CSSStyleDeclaration>;
  };
