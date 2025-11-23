import type { Subscriber, Updater } from "./types.js";

/**
 * Minimal reactive value container.
 *
 * Holds a value of type `T` and lets subscribers react when it changes.
 *
 * @typeParam T - Type of the wrapped value.
 */
export class Ref<T> {
  private value: T;
  private readonly subs: Set<Subscriber> = new Set();

  constructor(initialValue: T) {
    this.value = initialValue;
  }

  /**
   * Get the current value.
   */
  get(): T {
    return this.value;
  }

  /**
   * Set the value.
   *
   * Accepts either:
   * - a direct value, or
   * - an updater function that derives the next value from the current one.
   *
   * Notifies subscribers only if the value actually changes
   * (using `Object.is` for comparison).
   */
  set(next: T | Updater<T>): T {
    const previous = this.value;

    const nextValue =
      typeof next === "function" ? (next as Updater<T>)(previous) : next;

    // No change, no notifications.
    if (Object.is(previous, nextValue)) {
      return previous;
    }

    this.value = nextValue;

    // Snapshot subscribers in case the set is mutated during notifications.
    const listeners = Array.from(this.subs);

    for (const fn of listeners) {
      try {
        fn();
      } catch {
        // Ignore subscriber errors so other listeners still run.
      }
    }

    return this.value;
  }

  /**
   * Subscribe to value changes.
   *
   * The subscriber is called whenever `set` changes the value.
   */
  subscribe(fn: Subscriber): void {
    this.subs.add(fn);
  }

  /**
   * Unsubscribe a previously registered subscriber.
   */
  unsub(fn: Subscriber): void {
    this.subs.delete(fn);
  }
}

/**
 * Helper to create a `Ref` with type inference.
 */
export function ref<T>(initialValue: T): Ref<T> {
  return new Ref(initialValue);
}
