/* ============================================
   Supabase Client — Anonymous Upsert
   ============================================
   Progressive saving: records are created on
   Screen 2 and updated on Screens 4 and 5.
   Uses upsert keyed on session_id.

   SETUP: Replace URL and ANON KEY below.
   ============================================ */

const SUPABASE_URL = 'https://vughmtwcucegylcieats.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_bnbnz2wBgiGa9KNOxm4Szg_CGCKFghW';

const SUPABASE_CONFIGURED = !SUPABASE_URL.includes('YOUR_PROJECT');
let supabaseClient = null;

function getSupabase() {
  if (!SUPABASE_CONFIGURED) return null;
  if (supabaseClient) return supabaseClient;

  if (typeof window.supabase !== 'undefined') {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return supabaseClient;
  }

  return null;
}

/**
 * Upsert a response record. Creates on first call,
 * updates on subsequent calls (matched by session_id).
 * @param {Object} data - Session data object
 * @returns {Object} { success: boolean, error?: any, fallback?: boolean }
 */
async function submitResponse(data) {
  const client = getSupabase();

  if (!client) {
    console.info('[Birdie] Supabase not configured — data logged locally.');
    console.table(data);
    return { success: true, fallback: true };
  }

  try {
    const { error } = await client
      .from('responses')
      .upsert([data], { onConflict: 'session_id' });

    if (error) {
      console.error('[Birdie] Upsert error:', error.message);
      return { success: false, error };
    }

    console.info('[Birdie] Response saved successfully.');
    return { success: true };
  } catch (err) {
    console.error('[Birdie] Submit exception:', err);
    return { success: false, error: err };
  }
}
