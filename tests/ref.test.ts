import { describe, it, expect } from "vitest";
import { Ref } from "../src/ref";

describe("Ref", () => {
  it("set() updates the value and returns the new value", () => {
    const r = new Ref(1);

    const result = r.set(2);

    expect(result).toBe(2);
    expect(r.get()).toBe(2);
  });

  it("does not notify subscribers when Object.is(old, new) is true", () => {
    const r = new Ref(NaN);
    let calls = 0;

    r.subscribe(() => {
      calls++;
    });

    r.set(NaN);

    expect(calls).toBe(0);
  });

  it("notifies all subscribers once when the value changes", () => {
    const r = new Ref(0);
    let a = 0;
    let b = 0;

    r.subscribe(() => {
      a++;
    });

    r.subscribe(() => {
      b++;
    });

    r.set(1);

    expect(a).toBe(1);
    expect(b).toBe(1);
  });

  it("can unsubscribe a subscriber so it stops being notified", () => {
    const r = new Ref(0);
    let calls1 = 0;
    let calls2 = 0;

    const fn1 = () => {
      calls1++;
    };

    const fn2 = () => {
      calls2++;
    };

    r.subscribe(fn1);
    r.subscribe(fn2);

    r.set(1);
    expect(calls1).toBe(1);
    expect(calls2).toBe(1);

    r.unsub(fn1);
    r.set(2);

    expect(calls1).toBe(1);
    expect(calls2).toBe(2);
  });

  it("doesn't stop the other subscribers when one throws", () => {
    const r = new Ref(1);
    let calls = 0;

    r.subscribe(() => {
      calls++;
      throw new Error();
    });

    r.subscribe(() => {
      calls++;
    });

    r.set(2);

    expect(calls).toBe(2);
  });

  it("uses the updater result and returns the new value", () => {
    const r = new Ref(1);

    const result = r.set((curr) => curr + 1);

    expect(result).toBe(2);
    expect(r.get()).toBe(2);
  });

  it("does not notify subscribers if updater returns the same value", () => {
    const r = new Ref(1);
    let calls = 0;

    r.subscribe(() => {
      calls++;
    });

    r.set((curr) => curr);

    expect(calls).toBe(0);
  });
});
