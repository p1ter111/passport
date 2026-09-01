"use client";

import { useCallback, useEffect, useState } from "react";

export type SavedRoute = {
  id: string;
  originIso3: string;
  destinationIso3: string;
  purpose: string;
  tripDays: number;
  departureDate: string;
  transitIso3?: string;
  savedAt: string;
};

const FAVORITES_KEY = "passport-atlas-favorites";
const RECENT_KEY = "passport-atlas-recent-passports";
const ROUTES_KEY = "passport-atlas-saved-routes";
const LIBRARY_EVENT = "passport-atlas-library-change";

function readList<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function writeList<T>(key: string, value: T[]) {
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(LIBRARY_EVENT));
}

export function usePassportLibrary() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentPassports, setRecentPassports] = useState<string[]>([]);
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(() => {
    setFavorites(readList<string>(FAVORITES_KEY));
    setRecentPassports(readList<string>(RECENT_KEY));
    setSavedRoutes(readList<SavedRoute>(ROUTES_KEY));
    setLoaded(true);
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener(LIBRARY_EVENT, refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(LIBRARY_EVENT, refresh);
    };
  }, [refresh]);

  const toggleFavorite = useCallback((iso3: string) => {
    const current = readList<string>(FAVORITES_KEY);
    const next = current.includes(iso3) ? current.filter((item) => item !== iso3) : [iso3, ...current];
    writeList(FAVORITES_KEY, next);
  }, []);

  const addRecentPassport = useCallback((iso3: string) => {
    const current = readList<string>(RECENT_KEY);
    writeList(RECENT_KEY, [iso3, ...current.filter((item) => item !== iso3)].slice(0, 8));
  }, []);

  const saveRoute = useCallback((route: Omit<SavedRoute, "id" | "savedAt">) => {
    const transit = route.transitIso3 || "direct";
    const id = `${route.originIso3}-${route.destinationIso3}-${route.purpose}-${transit}`;
    const nextRoute: SavedRoute = { ...route, id, savedAt: new Date().toISOString() };
    const current = readList<SavedRoute>(ROUTES_KEY);
    writeList(ROUTES_KEY, [nextRoute, ...current.filter((item) => item.id !== id)].slice(0, 12));
  }, []);

  const removeRoute = useCallback((id: string) => {
    writeList(ROUTES_KEY, readList<SavedRoute>(ROUTES_KEY).filter((route) => route.id !== id));
  }, []);

  return {
    loaded,
    favorites,
    recentPassports,
    savedRoutes,
    toggleFavorite,
    addRecentPassport,
    saveRoute,
    removeRoute,
  };
}
