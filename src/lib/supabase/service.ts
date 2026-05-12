import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase admin client using the service role key.
 * Use ONLY in server-side API routes for operations that bypass RLS:
 * - Writing to proposal_views / proposal_events
 * - Reading proposals by hosted_token (public page)
 * - Updating proposal status from unauthenticated endpoints
 *
 * NEVER import this in client components.
 */
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
