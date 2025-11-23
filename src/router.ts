import { h } from "./h.js";
import type { Child, Component, Props } from "./types.js";

/**
 * Route configuration: map from paths ("/", "/about") to components.
 */
type RoutesConfig = Record<string, Component>;

// Internal registry of active routes.
const routes = new Map<string, Component>();

// Root element where the router renders the active component.
let routerRoot: HTMLElement | null = null;

/**
 * Normalize a route path so it always starts with "/".
 *
 * @internal
 */
function normalizePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

/**
 * Replace all current routes with a new configuration.
 *
 * @internal
 */
function setRoutes(config: RoutesConfig): void {
  routes.clear();
  for (const [path, component] of Object.entries(config)) {
    routes.set(normalizePath(path), component);
  }
}

/**
 * Read the current hash fragment and turn it into a route path.
 *
 * "#/about" -> "/about"
 * "" (no hash) -> "/"
 *
 * @internal
 */
function getCurrentPathFromHash(): string {
  const hash = location.hash; // e.g. "#/about"
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  const path = raw || "/";
  return normalizePath(path);
}

/**
 * Ensure the router root has been set.
 *
 * @throws if `createRouter` has not been called yet.
 * @internal
 */
function ensureRouterRoot(): HTMLElement {
  if (!routerRoot) {
    throw new Error("Router not initialized. Call createRouter(...) first.");
  }
  return routerRoot;
}

/**
 * Render the component associated with the given path into the root element.
 *
 * @internal
 */
function renderRoute(path: string): void {
  const root = ensureRouterRoot();
  const component = routes.get(path);

  if (!component) {
    root.replaceChildren(document.createTextNode("Not found"));
    return;
  }

  const node = component();
  root.replaceChildren(node);
}

/**
 * Navigate to a given path.
 *
 * Updates `location.hash`, which triggers the router to re-render.
 */
export function navigate(path: string): void {
  const normalized = normalizePath(path);

  // Avoid unnecessary hash updates if we’re already on this path.
  if (getCurrentPathFromHash() === normalized) return;

  location.hash = normalized;
}

/**
 * Anchor component that integrates with the router.
 *
 * Prevents the browser's default navigation and instead calls `navigate`.
 */
export function Link(
  props: (Props<"a"> & { href?: string }) | null,
  ...children: Child[]
): HTMLElementTagNameMap["a"] {
  const targetPath = normalizePath(props?.href ?? "/");

  const onClick = (event: MouseEvent) => {
    event.preventDefault();
    navigate(targetPath);
  };

  const configuredProps: Props<"a"> = {
    ...(props ?? {}),
    href: `#${targetPath}`,
    onclick: onClick,
  };

  return h("a", configuredProps, ...children);
}

/**
 * Initialize the router.
 *
 * @param root - DOM element where route components will be rendered.
 * @param routesConfig - Map from paths to components.
 */
export function createRouter(
  root: HTMLElement,
  routesConfig: RoutesConfig
): void {
  routerRoot = root;
  setRoutes(routesConfig);

  const handleHashChange = () => {
    const path = getCurrentPathFromHash();
    renderRoute(path);
  };

  window.addEventListener("hashchange", handleHashChange);

  // Initial render based on the current hash.
  handleHashChange();
}
