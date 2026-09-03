"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "./auth-provider";

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
  const { user } = useAuth();
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

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client || !user) return;
    Promise.all([
      client.from("user_favorites").select("passport_iso3").eq("user_id", user.id),
      client.from("saved_routes").select("*").eq("user_id", user.id).order("saved_at", { ascending: false }),
    ]).then(([favoriteResult, routeResult]) => {
      if (!favoriteResult.error) {
        const cloudFavorites = (favoriteResult.data ?? []).map((row) => row.passport_iso3 as string);
        const mergedFavorites = Array.from(new Set([...readList<string>(FAVORITES_KEY), ...cloudFavorites]));
        writeList(FAVORITES_KEY, mergedFavorites);
      }
      if (!routeResult.error) {
        const cloudRoutes = (routeResult.data ?? []).map((row) => ({
          id: row.source_id as string,
          originIso3: row.origin_iso3 as string,
          destinationIso3: row.destination_iso3 as string,
          purpose: row.purpose as string,
          tripDays: row.trip_days as number,
          departureDate: (row.departure_date as string | null) ?? "",
          transitIso3: (row.transit_iso3 as string | null) ?? undefined,
          savedAt: row.saved_at as string,
        } satisfies SavedRoute));
        const current = readList<SavedRoute>(ROUTES_KEY);
        const mergedRoutes = [...cloudRoutes, ...current.filter((route) => !cloudRoutes.some((cloudRoute) => cloudRoute.id === route.id))].slice(0, 50);
        writeList(ROUTES_KEY, mergedRoutes);
      }
    });
  }, [user]);

  const toggleFavorite = useCallback((iso3: string) => {
    const current = readList<string>(FAVORITES_KEY);
    const isRemoving = current.includes(iso3);
    const next = isRemoving ? current.filter((item) => item !== iso3) : [iso3, ...current];
    writeList(FAVORITES_KEY, next);
    const client = getSupabaseBrowserClient();
    if (client && user) {
      if (isRemoving) void client.from("user_favorites").delete().eq("user_id", user.id).eq("passport_iso3", iso3);
      else void client.from("user_favorites").upsert({ user_id: user.id, passport_iso3: iso3 }, { onConflict: "user_id,passport_iso3" });
    }
  }, [user]);

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
    const client = getSupabaseBrowserClient();
    if (client && user) void client.from("saved_routes").upsert({
      user_id: user.id,
      source_id: nextRoute.id,
      origin_iso3: nextRoute.originIso3,
      destination_iso3: nextRoute.destinationIso3,
      purpose: nextRoute.purpose,
      trip_days: nextRoute.tripDays,
      departure_date: nextRoute.departureDate || null,
      transit_iso3: nextRoute.transitIso3 ?? null,
      saved_at: nextRoute.savedAt,
    }, { onConflict: "user_id,source_id" });
  }, [user]);

  const removeRoute = useCallback((id: string) => {
    writeList(ROUTES_KEY, readList<SavedRoute>(ROUTES_KEY).filter((route) => route.id !== id));
    const client = getSupabaseBrowserClient();
    if (client && user) void client.from("saved_routes").delete().eq("user_id", user.id).eq("source_id", id);
  }, [user]);

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
