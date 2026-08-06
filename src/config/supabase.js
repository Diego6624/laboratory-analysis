export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
export const SUPABASE_REST_URL = `${SUPABASE_URL}/rest/v1`
export const SUPABASE_AUTH_URL = `${SUPABASE_URL}/auth/v1`
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const PATIENTS_TABLE = import.meta.env.VITE_PATIENTS_TABLE
export const ORDERS_TABLE = import.meta.env.VITE_ORDERS_TABLE
export const ANALYSES_TABLE = import.meta.env.VITE_ANALYSES_TABLE
export const RESULTS_TABLE = import.meta.env.VITE_RESULTS_TABLE
export const ADMIN_SESSION_KEY = import.meta.env.VITE_ADMIN_SESSION_KEY