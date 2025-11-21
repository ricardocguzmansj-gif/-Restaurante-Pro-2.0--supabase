
import { createClient } from '@supabase/supabase-js';

export const DEFAULT_SUPABASE_URL = 'https://rlrnrnngfkzovxoocntp.supabase.co';

const getSupabaseCredentials = () => {
    let url = localStorage.getItem('supabase_url');
    let key = localStorage.getItem('supabase_key');

    // Try to get from env if not in local storage (safe check for browser env)
    try {
        if (typeof process !== 'undefined' && process.env) {
            if (!url) url = process.env.SUPABASE_URL || null;
            if (!key) key = process.env.SUPABASE_KEY || null;
        }
    } catch (e) {
        // Ignore errors accessing process.env
    }

    // Fallback to hardcoded default for URL
    if (!url) url = DEFAULT_SUPABASE_URL;

    return { url, key };
};

export const isSupabaseConfigured = (): boolean => {
    const { url, key } = getSupabaseCredentials();
    return !!url && !!key;
};

export const getSupabaseClient = () => {
    const { url, key } = getSupabaseCredentials();
    if (!url || !key) {
        return null;
    }
    return createClient(url, key);
};
