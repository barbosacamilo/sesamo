/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi } from "vitest";
import { h } from "../src/public/h";
import { Ref } from "../src/public/ref";

describe("h()", () => {
  it("creates an element with the correct tag", () => {
    const div = h("div", null);
    expect(div).toBeInstanceOf(HTMLDivElement);
  });

  it("applies basic native props", () => {
    const btn = h("button", { id: "my-btn", disabled: true });
    expect(btn.id).toBe("my-btn");
    expect(btn.disabled).toBe(true);
  });

  it("renders string children as text nodes", () => {
    const p = h("p", null, "Hello ", "world");
    expect(p.childNodes.length).toBe(2);
    expect(p.textContent).toBe("Hello world");
  });

  it("appends HTMLElement children directly", () => {
    const strong = document.createElement("strong");
    strong.textContent = "world";

    const p = h("p", null, "Hello ", strong);

    expect(p.childNodes.length).toBe(2);
    expect(p.firstChild?.textContent).toBe("Hello ");
    expect(p.lastChild).toBe(strong);
  });

  it("wires event handlers from props (onclick)", () => {
    const onclick = vi.fn();

    const btn = h("button", { onclick }, "Click me");
    btn.click();

    expect(onclick).toHaveBeenCalledTimes(1);
  });

  it("does not append holes", () => {
    const el = h("div", null, null, undefined, true, false);
    expect(el.childNodes.length).toBe(0);
  });

  it("renders Ref child and updates when Ref changes", () => {
    const r = new Ref(0);

    const el = h("div", null, r);
    expect(el.textContent).toBe("0");

    r.set(42);
    expect(el.textContent).toBe("42");
  });

  it("applies style object via props.style", () => {
    const div = h("div", {
      style: { color: "red", backgroundColor: "blue" },
    });

    expect(div.style.color).toBe("red");
    expect(div.style.backgroundColor).toBe("blue");
  });

  it("accepts arrays as children", () => {
    const list = h("li", null, [1, 2, 3, 4]);
    expect(list.childNodes.length).toBe(4);
    expect(list.textContent).toBe("1234");
  });

  it("accepts nested arrays of children", () => {
    const div = h("div", null, ["a", ["b", "c"], [["d"]]]);
    expect(div.childNodes.length).toBe(4);
    expect(div.textContent).toBe("abcd");
  });

  it("skips holes inside arrays", () => {
    const div = h("div", null, ["a", null, undefined, true, false, "b"]);

    expect(div.childNodes.length).toBe(2);
    expect(div.textContent).toBe("ab");
  });

  it("handles mixed child types inside arrays", () => {
    const ref = new Ref(1);
    const span = document.createElement("span");
    span.textContent = "X";

    const div = h("div", null, ["start-", ref, "-mid-", span, "-end"]);

    expect(div.textContent).toBe("start-1-mid-X-end");

    ref.set(2);
    expect(div.textContent).toBe("start-2-mid-X-end");
  });
});
