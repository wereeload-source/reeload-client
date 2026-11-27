/**
 * Public settings from .env.local (see .env.example).
 *
 * Each `process.env.NEXT_PUBLIC_*` is written out in full on purpose: Next.js only
 * inlines these into browser code when it sees the literal name.
 */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Base URL of the NestJS API in reeload-server/api, without a trailing slash. */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/+$/, "");

/** Names of the Supabase variables that are not set. Empty when everything is configured. */
export const missingSupabaseEnv: string[] = [
  !SUPABASE_URL && "NEXT_PUBLIC_SUPABASE_URL",
  !SUPABASE_ANON_KEY && "NEXT_PUBLIC_SUPABASE_ANON_KEY",
].filter((name): name is string => Boolean(name));

export class MissingEnvError extends Error {
  constructor(public readonly missing: string[]) {
    super(
      `Missing ${missing.join(" and ")}. Copy .env.example to .env.local, fill in the Supabase URL and anon key ` +
        "(printed by `supabase start` in reeload-server), then restart `npm run dev`.",
    );
    this.name = "MissingEnvError";
  }
}

/** Supabase URL and anon key. Throws a MissingEnvError that names what to set when either is missing. */
export function supabaseEnv(): { url: string; anonKey: string } {
  if (missingSupabaseEnv.length > 0) throw new MissingEnvError(missingSupabaseEnv);
  return { url: SUPABASE_URL!, anonKey: SUPABASE_ANON_KEY! };
}
