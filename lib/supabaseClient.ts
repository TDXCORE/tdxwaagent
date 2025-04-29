// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!supabaseUrl) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL");
}

// Cliente para el lado del cliente (browser)
// Usa la clave anónima pública que tiene permisos limitados
const createBrowserClient = () => {
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseAnonKey) {
    throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  });
};

// Cliente para el lado del servidor
// Usa la Service Role Key que tiene permisos elevados
const createServerClient = () => {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseServiceKey) {
    throw new Error("Missing env.SUPABASE_SERVICE_ROLE_KEY");
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  });
};

// Determinar si estamos en el servidor o en el cliente
const isServer = typeof window === 'undefined';

// Exportar el cliente apropiado según el entorno
export const supabase = isServer ? createServerClient() : createBrowserClient();

// También exportamos los creadores de clientes por separado para casos específicos
export { createBrowserClient, createServerClient };