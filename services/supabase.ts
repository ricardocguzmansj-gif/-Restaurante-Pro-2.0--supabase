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
// Ref: rlrnrnngfkzovxoocntp
// Url: https://rlrnrnngfkzovxoocntp.supabase.co
const PROVIDED_URL = "https://rlrnrnngfkzovxoocntp.supabase.co";
const PROVIDED_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJscm5ybm5nZmt6b3Z4b29jbnRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1ODkxMTIsImV4cCI6MjA3OTE2NTExMn0.G4iLMiRgy8tzA3bKj_ZKvB2Y30NLJpns3L8TZGdObX8";

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