import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);

if (url && !/\.supabase\.co(:|\/|$)/.test(url)) {
  // Every real Supabase project URL is https://<ref>.supabase.co — a
  // ".com" typo (or any other host) resolves to nothing and every
  // saveCard()/upload call below will fail, but fail *silently* from the
  // UI's point of view (a swallowed network error), which is exactly the
  // kind of bug that's miserable to track down without this check.
  console.warn(
    `VITE_SUPABASE_URL ("${url}") doesn't look like a Supabase project URL ` +
      '(expected something ending in .supabase.co). Card saving, voice ' +
      'upload, and shareable links will silently fail until this is fixed.'
  );
}

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!)
  : null;

/*
 * Expected `cards` table (run once in the Supabase SQL editor):
 *
 * create table cards (
 *   share_code text primary key,
 *   recipient_name text not null,
 *   birth_date date not null,
 *   birth_time time,
 *   time_is_approximate boolean not null default false,
 *   location_name text not null,
 *   location_lat double precision not null,
 *   location_lon double precision not null,
 *   theme text not null,
 *   music_url text,
 *   poem text,
 *   voice_message_url text,
 *   created_at timestamptz not null default now()
 * );
 *
 * Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your deployment's
 * environment variables (see README) to enable this — without them the
 * app still runs, just with an in-memory store that resets on reload.
 */
