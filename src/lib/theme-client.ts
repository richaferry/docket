"use client";

import { useSyncExternalStore } from "react";

export type ThemePref = "light" | "dark" | "system";

export const THEME_EVENT = "docket-theme-change";
export const THEME_KEY = "theme";
export const COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

export function getThemeSnapshot(): ThemePref {
  const stored = localStorage.getItem(THEME_KEY);
  return stored === "light" || stored === "dark" ? stored : "system";
}

export function subscribeTheme(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(THEME_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(THEME_EVENT, callback);
  };
}

// Writes the preference to localStorage and the `theme` cookie (the cookie is
// what the server reads to render the correct theme on the next request), then
// notifies every mounted theme component via a custom event.
export function applyTheme(value: ThemePref) {
  if (value === "system") {
    localStorage.removeItem(THEME_KEY);
    document.cookie = `${THEME_KEY}=; path=/; max-age=0; samesite=lax`;
    document.documentElement.removeAttribute("data-theme");
  } else {
    localStorage.setItem(THEME_KEY, value);
    document.cookie = `${THEME_KEY}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
    document.documentElement.setAttribute("data-theme", value);
  }
  window.dispatchEvent(new Event(THEME_EVENT));
}

export function useThemePref(initialPref: ThemePref): ThemePref {
  return useSyncExternalStore(subscribeTheme, getThemeSnapshot, () => initialPref);
}
