import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyThemeClass,
  getStoredTheme,
  isThemePreference,
  nextTheme,
  resolveTheme,
  storeTheme,
  THEME_STORAGE_KEY,
} from "./theme";

function createStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
  };
}

describe("theme", () => {
  const classList = {
    toggle: vi.fn(),
    contains: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(() => {
    const storage = createStorage();
    vi.stubGlobal("window", {
      localStorage: storage,
      matchMedia: () => ({ matches: true }),
    });
    vi.stubGlobal("localStorage", storage);
    vi.stubGlobal("document", {
      documentElement: { classList },
    });
    classList.toggle.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("validates preferences", () => {
    expect(isThemePreference("light")).toBe(true);
    expect(isThemePreference("dark")).toBe(true);
    expect(isThemePreference("system")).toBe(true);
    expect(isThemePreference("neon")).toBe(false);
  });

  it("cycles system → light → dark", () => {
    expect(nextTheme("system")).toBe("light");
    expect(nextTheme("light")).toBe("dark");
    expect(nextTheme("dark")).toBe("system");
  });

  it("persists preference", () => {
    storeTheme("light");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    expect(getStoredTheme()).toBe("light");
  });

  it("falls back to system for invalid storage", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "nope");
    expect(getStoredTheme()).toBe("system");
  });

  it("resolves light/dark directly", () => {
    expect(resolveTheme("light")).toBe("light");
    expect(resolveTheme("dark")).toBe("dark");
  });

  it("resolves system from matchMedia", () => {
    expect(resolveTheme("system")).toBe("dark");
  });

  it("applies dark class", () => {
    applyThemeClass("dark");
    expect(classList.toggle).toHaveBeenCalledWith("dark", true);
    applyThemeClass("light");
    expect(classList.toggle).toHaveBeenCalledWith("dark", false);
  });
});
