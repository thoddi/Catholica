// authenticationService.js
// Provides authentication methods for the app.
// Usage: import { signUp, signIn, handleAuthRedirect } from './authenticationService.js';

import { supabase } from './supabaseClient.js';

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  return { user: data?.user, error };
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { user: data?.user, error };
}

// Parses the URL hash for auth tokens and sets the session if present
export async function handleAuthRedirect() {
  const hash = window.location.hash.substring(1);
  if (!hash) return;
  const params = Object.fromEntries(new URLSearchParams(hash));
  if (params.access_token && params.refresh_token) {
    await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token
    });
    // Optionally, clean up the URL
    window.location.hash = '';
    return true;
  }
  return false;
}
