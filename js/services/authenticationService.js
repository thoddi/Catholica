import { supabase } from './supabaseClient.js';

export async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { user: data?.user, error };
}

export async function signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    return { user: data?.user, error };
}

export async function isLoggedIn() {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
        return false;
    }

    return !!data?.session?.user;
}
