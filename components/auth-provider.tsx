"use client";

import type { User } from "@supabase/supabase-js";
import { CloudUpload, Database, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { SavedRoute } from "./use-passport-library";

type AuthResult = { error: string | null; needsEmailConfirmation?: boolean };

type AuthContextValue = {
  configured: boolean;
  loading: boolean;
  user: User | null;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string, displayName: string) => Promise<AuthResult>;
  requestPasswordReset: (email: string) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const MIGRATION_KEY = "passport-atlas-cloud-migration";

function readLocalList<T>(key: string): T[] {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const client = useMemo(() => getSupabaseBrowserClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(configured);
  const [migrationOpen, setMigrationOpen] = useState(false);
  const [migrationBusy, setMigrationBusy] = useState(false);
  const [migrationMessage, setMigrationMessage] = useState("");

  useEffect(() => {
    if (!client) {
      setLoading(false);
      return;
    }
    client.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
    const { data: subscription } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => subscription.subscription.unsubscribe();
  }, [client]);

  useEffect(() => {
    if (!user) {
      setMigrationOpen(false);
      return;
    }
    const migrationState = window.localStorage.getItem(`${MIGRATION_KEY}:${user.id}`);
    if (migrationState) return;
    const favorites = readLocalList<string>("passport-atlas-favorites");
    const routes = readLocalList<SavedRoute>("passport-atlas-saved-routes");
    if (favorites.length || routes.length) setMigrationOpen(true);
  }, [user]);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!client) return { error: "Supabase is not configured yet." };
    const { error } = await client.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, [client]);

  const signUp = useCallback(async (email: string, password: string, displayName: string): Promise<AuthResult> => {
    if (!client) return { error: "Supabase is not configured yet." };
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName.trim() },
        emailRedirectTo: `${window.location.origin}/account`,
      },
    });
    return { error: error?.message ?? null, needsEmailConfirmation: !data.session && !error };
  }, [client]);

  const requestPasswordReset = useCallback(async (email: string): Promise<AuthResult> => {
    if (!client) return { error: "Supabase is not configured yet." };
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/account?mode=recovery`,
    });
    return { error: error?.message ?? null };
  }, [client]);

  const updatePassword = useCallback(async (password: string): Promise<AuthResult> => {
    if (!client) return { error: "Supabase is not configured yet." };
    const { error } = await client.auth.updateUser({ password });
    return { error: error?.message ?? null };
  }, [client]);

  const signOut = useCallback(async () => {
    await client?.auth.signOut();
  }, [client]);

  const finishMigration = (state: "imported" | "declined") => {
    if (user) window.localStorage.setItem(`${MIGRATION_KEY}:${user.id}`, state);
    setMigrationOpen(false);
  };

  const migrateLocalData = async () => {
    if (!client || !user) return;
    setMigrationBusy(true);
    setMigrationMessage("");
    const favorites = readLocalList<string>("passport-atlas-favorites");
    const routes = readLocalList<SavedRoute>("passport-atlas-saved-routes");
    const favoriteRows = favorites.map((passportIso3) => ({ user_id: user.id, passport_iso3: passportIso3 }));
    const routeRows = routes.map((route) => ({
      user_id: user.id,
      source_id: route.id,
      origin_iso3: route.originIso3,
      destination_iso3: route.destinationIso3,
      purpose: route.purpose,
      trip_days: route.tripDays,
      departure_date: route.departureDate || null,
      transit_iso3: route.transitIso3 ?? null,
      saved_at: route.savedAt,
    }));
    const favoriteResult = favoriteRows.length
      ? await client.from("user_favorites").upsert(favoriteRows, { onConflict: "user_id,passport_iso3" })
      : { error: null };
    const routeResult = routeRows.length
      ? await client.from("saved_routes").upsert(routeRows, { onConflict: "user_id,source_id" })
      : { error: null };
    const error = favoriteResult.error ?? routeResult.error;
    setMigrationBusy(false);
    if (error) {
      setMigrationMessage(error.message);
      return;
    }
    window.dispatchEvent(new Event("passport-atlas-library-change"));
    finishMigration("imported");
  };

  const value = useMemo<AuthContextValue>(() => ({
    configured,
    loading,
    user,
    signIn,
    signUp,
    requestPasswordReset,
    updatePassword,
    signOut,
  }), [configured, loading, user, signIn, signUp, requestPasswordReset, updatePassword, signOut]);

  return (
    <AuthContext.Provider value={value}>
      {children}
      {migrationOpen && (
        <div className="cloud-migration-backdrop" role="presentation">
          <section className="cloud-migration-dialog" role="dialog" aria-modal="true" aria-labelledby="cloud-migration-title">
            <button type="button" className="cloud-migration-close" onClick={() => finishMigration("declined")} aria-label="Close"><X size={17} /></button>
            <span className="cloud-migration-icon"><CloudUpload size={21} /></span>
            <small>PERSONAL TRAVEL SPACE</small>
            <h2 id="cloud-migration-title">Sync this browser to your account?</h2>
            <p>Your saved passports and routes can follow you across devices. Nothing is removed from this browser.</p>
            {migrationMessage && <div className="cloud-migration-error" role="alert">{migrationMessage}</div>}
            <div>
              <button type="button" onClick={migrateLocalData} disabled={migrationBusy}><Database size={16} />{migrationBusy ? "Syncing..." : "Sync my data"}</button>
              <button type="button" onClick={() => finishMigration("declined")} disabled={migrationBusy}>Keep it on this device</button>
            </div>
          </section>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}

