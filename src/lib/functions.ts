"use client";
import { createClient } from "@/lib/supabase/client";

/** Calls a Supabase Edge Function with the signed-in user's token. Throws the server's message on error. */
export async function callFn<T = unknown>(name: string, body: Record<string, unknown>): Promise<T> {
  const supabase = createClient();
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    let message = error.message;
    try {
      const ctx = (error as { context?: Response }).context;
      if (ctx) message = (await ctx.json()).error ?? message;
    } catch {}
    throw new Error(message);
  }
  return data as T;
}
