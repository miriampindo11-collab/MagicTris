
import { createClient } from '@supabase/supabase-js';

// Detectamos si las variables de entorno son reales o placeholders
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Un check estricto: la URL debe empezar con https y la clave debe tener longitud suficiente
const isConfigured = 
  supabaseUrl.startsWith('https://') && 
  !supabaseUrl.includes('placeholder') &&
  supabaseAnonKey.length > 20;

export const supabase = isConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Helper para verificar si la base de datos está lista.
 * Si retorna false, la app usará localStorage automáticamente.
 */
export const isSupabaseReady = () => {
    return !!supabase;
};
