/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach } from "vitest";
import { createRouter, navigate, Link } from "../src/router";
import type { Component } from "../src/types.js";

describe("router", () => {
  let root: HTMLElement;

  const Home: Component = () => {
    const el = document.createElement("div");
    el.textContent = "Home";
    return el;
  };

  const About: Component = () => {
    const el = document.createElement("div");
    el.textContent = "About";
    return el;
  };

  beforeEach(() => {
    document.body.innerHTML = `<div id="app"></div>`;
    root = document.getElementById("app") as HTMLElement;
    location.hash = "";
  });

  it("renders the default route ('/') when hash is empty", () => {
    createRouter(root, {
      "/": Home,
      "/about": About,
    });

    expect(root.textContent).toBe("Home");
  });

  it("renders the route matching the initial hash", () => {
    location.hash = "#/about";

    createRouter(root, {
      "/": Home,
      "/about": About,
    });

    expect(root.textContent).toBe("About");
  });

  it("navigates to another route with navigate()", () => {
    createRouter(root, {
      "/": Home,
      "/about": About,
    });

    navigate("/about");

    window.dispatchEvent(new HashChangeEvent("hashchange"));

    expect(location.hash).toBe("#/about");
    expect(root.textContent).toBe("About");
  });

  it("renders 'Not found' when route does not exist", () => {
    createRouter(root, {
      "/": Home,
    });

    navigate("/missing");
    window.dispatchEvent(new HashChangeEvent("hashchange"));

    expect(root.textContent).toBe("Not found");
  });

  it("Link renders an <a> with correct href", () => {
    const link = Link({ href: "/about" }, "Go to about");

    expect(link.tagName).toBe("A");
    expect(link.getAttribute("href")).toBe("#/about");
    expect(link.textContent).toBe("Go to about");
  });

  it("clicking Link navigates to its href", () => {
    createRouter(root, {
      "/": Home,
      "/about": About,
    });

    const link = Link({ href: "/about" }, "Go to about");
    document.body.appendChild(link);

    link.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true })
    );

    expect(location.hash).toBe("#/about");

    window.dispatchEvent(new HashChangeEvent("hashchange"));

    expect(root.textContent).toBe("About");
  });
});
