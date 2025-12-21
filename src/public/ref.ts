type Subscriber = () => void;
type Updater<T> = (curr: T) => T;

export class Ref<T> {
  private value: T;
  private readonly subs: Set<Subscriber> = new Set();

  constructor(initialValue: T) {
    this.value = initialValue;
  }

  /**
   * Get the current value.
   *
   * @returns The current value stored in this `Ref`.
   */
  get(): T {
    return this.value;
  }

  /**
   * Set the value.
   *
   * @param next - The next value or an updater function.
   * @returns The current value after the update (or the previous value if unchanged).
   */
  set(next: T | Updater<T>): T {
    const prev = this.value;

    const nextValue =
      typeof next === "function" ? (next as Updater<T>)(prev) : next;

    if (Object.is(prev, nextValue)) {
      return prev;
    }

    this.value = nextValue;

    const listeners = Array.from(this.subs);

    for (const fn of listeners) {
      try {
        fn();
      } catch (err) {
        // Catch errors thrown by subscribers so other listeners still run.
      }
    }

    return this.value;
  }

  /**
   * Subscribe to value changes.
   *
   * @param fn - The function to run when the value changes.
   * @returns The function to remove the subscription.
   */
  subscribe(fn: Subscriber): () => void {
    this.subs.add(fn);
    return () => this.subs.delete(fn);
  }

  /**
   * Unsubscribe a previously registered subscriber.
   *
   * @param fn - The same function reference previously passed to `subscribe`.
   */
  unsub(fn: Subscriber): void {
    this.subs.delete(fn);
  }
}

/**
 * Helper to create a `Ref`.
 *
 * @typeParam T - Type of `initialValue`.
 * @param initialValue - Initial value of the `Ref`.
 * @returns A `Ref` instance.
 */
export function ref<T>(initialValue: T): Ref<T> {
  return new Ref(initialValue);
}
