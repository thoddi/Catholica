import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://tsfsqjfrikybwnzhclyt.supabase.co';
const PUBLISHABLE_KEY = 'sb_publishable_6wZnSn7Su9Yq6df8tjOeyQ_ZXxnCirv';

export const supabase = createClient(SUPABASE_URL, PUBLISHABLE_KEY);
