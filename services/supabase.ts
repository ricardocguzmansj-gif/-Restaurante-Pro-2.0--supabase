
import { createClient } from '@supabase/supabase-js';

// Helper to safely access env vars in various environments (Vite, Webpack, etc.)
const getEnv = (key: string) => {
    try {
        // Check process.env (Standard Node/Webpack/CRA)
        if (typeof process !== 'undefined' && process.env && process.env[key]) {
            return process.env[key];
        }
    } catch (e) {
        // Ignore errors
    }

    try {
        // Check import.meta.env (Vite)
        if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
            return (import.meta as any).env[key];
        }
    } catch (e) {
        // Ignore errors
    }

    return '';
};

// --- CREDENCIALES ---
// Using credentials provided by user for Online Mode.
// NOTE: Service Role Key is intentionally omitted for security. Only Anon Key is used.
const PROVIDED_URL = "https://grtifyijkqxckkglfibq.supabase.co";
const PROVIDED_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdydGlmeWlqa3F4Y2trZ2xmaWJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MjA4OTYsImV4cCI6MjA3OTM5Njg5Nn0.RjcHfJhPJ5MBHBZ5m6EeQs9bhxKP4Ycfh17eKSXVLNc";

const envUrl = getEnv('VITE_SUPABASE_URL') || getEnv('REACT_APP_SUPABASE_URL');
const envKey = getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('REACT_APP_SUPABASE_ANON_KEY');

const supabaseUrl = envUrl || PROVIDED_URL;
const supabaseKey = envKey || PROVIDED_ANON_KEY;

export const isSupabaseConfigured = (): boolean => {
    return !!supabaseUrl && !!supabaseKey;
};

export const getSupabaseClient = () => {
    if (!supabaseUrl || !supabaseKey) {
        console.warn("Faltan las credenciales de Supabase. Verifique las variables de entorno.");
        return null;
    }
    return createClient(supabaseUrl, supabaseKey);
};
