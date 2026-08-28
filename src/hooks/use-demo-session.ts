"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/src/lib/supabase/client";

type DemoSessionStatus = "disabled" | "loading" | "ready" | "error";

export type DemoSession = {
  client: SupabaseClient | null;
  configured: boolean;
  status: DemoSessionStatus;
  user: User | null;
  userId: string | null;
  error: string | null;
  saveState: (stateKey: string, state: unknown) => Promise<void>;
  loadState: <T>(stateKey: string) => Promise<T | null>;
  resetState: (stateKeys?: string[]) => Promise<void>;
};

export function useDemoSession(): DemoSession {
  const configured = isSupabaseConfigured();
  const client = useMemo(() => getSupabaseBrowserClient(), []);
  const [status, setStatus] = useState<DemoSessionStatus>(configured ? "loading" : "disabled");
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!configured || !client) return;

    let cancelled = false;
    const activeClient = client;

    async function ensureAnonymousSession() {
      setStatus("loading");
      setError(null);

      const sessionResult = await activeClient.auth.getSession();
      if (cancelled) return;

      if (sessionResult.error) {
        setError(sessionResult.error.message);
        setStatus("error");
        return;
      }

      let currentUser = sessionResult.data.session?.user ?? null;
      if (!currentUser) {
        const signInResult = await activeClient.auth.signInAnonymously();
        if (cancelled) return;
        if (signInResult.error) {
          setError(signInResult.error.message);
          setStatus("error");
          return;
        }
        currentUser = signInResult.data.user ?? null;
      }

      if (!currentUser) {
        setError("Anonymous session could not be created.");
        setStatus("error");
        return;
      }

      const touchResult = await activeClient.from("demo_sessions").upsert(
        {
          user_id: currentUser.id,
          last_seen_at: new Date().toISOString(),
          metadata: { userAgent: window.navigator.userAgent.slice(0, 240) },
        },
        { onConflict: "user_id" },
      );

      if (cancelled) return;
      if (touchResult.error) {
        setError(touchResult.error.message);
        setStatus("error");
        return;
      }

      setUser(currentUser);
      setStatus("ready");
    }

    void ensureAnonymousSession();

    const { data } = activeClient.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, [client, configured]);

  const saveState = useCallback(
    async (stateKey: string, state: unknown) => {
      if (!client || !user) return;
      const { error: saveError } = await client.from("demo_user_state").upsert(
        {
          user_id: user.id,
          state_key: stateKey,
          state,
        },
        { onConflict: "user_id,state_key" },
      );
      if (saveError) throw saveError;
    },
    [client, user],
  );

  const loadState = useCallback(
    async <T,>(stateKey: string): Promise<T | null> => {
      if (!client || !user) return null;
      const { data, error: loadError } = await client
        .from("demo_user_state")
        .select("state")
        .eq("user_id", user.id)
        .eq("state_key", stateKey)
        .maybeSingle();

      if (loadError) throw loadError;
      return (data?.state as T | undefined) ?? null;
    },
    [client, user],
  );

  const resetState = useCallback(
    async (stateKeys?: string[]) => {
      if (!client || !user) return;
      let query = client.from("demo_user_state").delete().eq("user_id", user.id);
      if (stateKeys?.length) query = query.in("state_key", stateKeys);
      const { error: resetError } = await query;
      if (resetError) throw resetError;
    },
    [client, user],
  );

  return useMemo(() => ({
    client,
    configured,
    status,
    user,
    userId: user?.id ?? null,
    error,
    saveState,
    loadState,
    resetState,
  }), [client, configured, error, loadState, resetState, saveState, status, user]);
}
