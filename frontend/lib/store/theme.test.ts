import { describe, expect, it } from "vitest";
import { makeStore } from "./index";
import reducer, {
  applyTheme,
  chooseTheme,
  parseThemeMode,
  readSavedTheme,
  setThemeMode,
  THEME_INIT_SCRIPT,
} from "./theme";

describe("parseThemeMode", () => {
  it.each([
    ["light", "light"],
    ["dark", "dark"],
    ["system", "system"],
    ["purple", "system"],
    ["", "system"],
    [undefined, "system"],
    [null, "system"],
  ])("reads %j as %j", (saved, mode) => {
    expect(parseThemeMode(saved)).toBe(mode);
  });
});

describe("readSavedTheme", () => {
  it.each([
    ["theme=dark", "dark"],
    ["a=1; theme=light; b=2", "light"],
    ["a=1; theme=bogus", "system"],
    ["othertheme=dark", "system"],
    ["", "system"],
  ])("reads %j as %j", (cookie, mode) => {
    expect(readSavedTheme(cookie)).toBe(mode);
  });
});

describe("THEME_INIT_SCRIPT (runs in <head> before the first paint)", () => {
  const run = (cookie: string) => {
    const attributes: Record<string, string> = {};
    const document = { cookie, documentElement: { setAttribute: (name: string, value: string) => (attributes[name] = value) } };
    new Function("document", THEME_INIT_SCRIPT)(document);
    return attributes;
  };

  it("puts the saved theme on <html>", () => {
    expect(run("a=1; theme=dark; b=2")).toEqual({ "data-theme": "dark" });
    expect(run("theme=light")).toEqual({ "data-theme": "light" });
    expect(run("theme=system")).toEqual({ "data-theme": "system" });
  });

  it("leaves the default alone when nothing valid is saved", () => {
    expect(run("")).toEqual({});
    expect(run("theme=bogus")).toEqual({});
  });

  it("never throws, even without a document", () => {
    expect(() => new Function("document", THEME_INIT_SCRIPT)(undefined)).not.toThrow();
  });

  it("agrees with readSavedTheme on every saved value", () => {
    for (const mode of ["light", "dark", "system"] as const) {
      expect(run(`x=1; theme=${mode}`)["data-theme"]).toBe(readSavedTheme(`x=1; theme=${mode}`));
    }
  });
});

describe("applyTheme", () => {
  it("sets the attribute and remembers the choice for a year", () => {
    const attributes: Record<string, string> = {};
    const cookies: string[] = [];
    applyTheme("dark", { setAttribute: (name, value) => (attributes[name] = value) }, (cookie) => cookies.push(cookie));
    expect(attributes).toEqual({ "data-theme": "dark" });
    expect(cookies).toEqual(["theme=dark; path=/; max-age=31536000; samesite=lax"]);
  });
});

describe("theme slice", () => {
  it("follows the device until someone chooses", () => {
    expect(reducer(undefined, { type: "@@init" })).toEqual({ mode: "system" });
  });

  it("switches to the chosen mode", () => {
    expect(reducer({ mode: "system" }, setThemeMode("dark"))).toEqual({ mode: "dark" });
    expect(reducer({ mode: "dark" }, setThemeMode("light"))).toEqual({ mode: "light" });
  });
});

describe("makeStore", () => {
  it("starts from the theme it is given", () => {
    const store = makeStore({ theme: { mode: "dark" } });
    expect(store.getState().theme.mode).toBe("dark");
    store.dispatch(setThemeMode("light"));
    expect(store.getState().theme.mode).toBe("light");
  });

  it("gives each caller its own store", () => {
    const a = makeStore({ theme: { mode: "dark" } });
    const b = makeStore();
    a.dispatch(setThemeMode("light"));
    expect(b.getState().theme.mode).toBe("system");
  });

  it("chooseTheme updates the store and then the page (the page is stubbed here)", () => {
    const store = makeStore();
    const attributes: string[] = [];
    // Node has no document: give the thunk one to write to.
    const g = globalThis as unknown as { document?: unknown };
    g.document = {
      documentElement: { setAttribute: (_name: string, value: string) => attributes.push(value) },
      cookie: "",
    };
    try {
      store.dispatch(chooseTheme("dark"));
    } finally {
      delete g.document;
    }
    expect(store.getState().theme.mode).toBe("dark");
    expect(attributes).toEqual(["dark"]);
  });
});
