
import { createClient } from '@supabase/supabase-js';

// Helper to safely access env vars in various environments (Vite, Webpack, etc.)
const getEnv = (key: string) => {
    try {
        // Check import.meta.env (Vite)
        if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
            return (import.meta as any).env[key];
        }
    } catch (e) {
        // Ignore errors accessing import.meta
    }

    try {
        // Check process.env (Standard Node/Webpack/CRA)
        if (typeof process !== 'undefined' && process.env && process.env[key]) {
            return process.env[key];
        }
    } catch (e) {
        // Ignore errors accessing process
    }

    return '';
};

// --- CREDENCIALES DE PRODUCCIÓN ---
// Derivadas del JWT proporcionado:
// Ref: grtifyijkqxckkglfibq
// Url: https://grtifyijkqxckkglfibq.supabase.co
const PROVIDED_URL = "https://grtifyijkqxckkglfibq.supabase.co";
const PROVIDED_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdydGlmeWlqa3F4Y2trZ2xmaWJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MjA4OTYsImV4cCI6MjA3OTM5Njg5Nn0.RjcHfJhPJ5MBHBZ5m6EeQs9bhxKP4Ycfh17eKSXVLNc";

// Priorizamos variables de entorno, si no existen, usamos las proporcionadas hardcodeadas
const supabaseUrl = getEnv('VITE_SUPABASE_URL') || PROVIDED_URL;
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY') || PROVIDED_ANON_KEY;

export const isSupabaseConfigured = (): boolean => {
    return !!supabaseUrl && !!supabaseKey;
};

export const getSupabaseClient = () => {
    if (!supabaseUrl || !supabaseKey) {
        console.error("Faltan las credenciales de Supabase. Verifique services/supabase.ts");
        return null;
    }
    return createClient(supabaseUrl, supabaseKey);
};
