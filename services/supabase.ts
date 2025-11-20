
import { createClient } from '@supabase/supabase-js';

const getSupabaseCredentials = () => {
    const url = localStorage.getItem('supabase_url');
    const key = localStorage.getItem('supabase_key');
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
