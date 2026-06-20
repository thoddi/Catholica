import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

export const SUPABASE_URL = 'https://tsfsqjfrikybwnzhclyt.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_6wZnSn7Su9Yq6df8tjOeyQ_ZXxnCirv';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let _cachedSession = null;

supabase.auth.getSession().then(({ data }) => {
    _cachedSession = data.session ?? null;
});

supabase.auth.onAuthStateChange((_event, session) => {
    _cachedSession = session;
});

export function getCachedSession() {
    return _cachedSession;
}
