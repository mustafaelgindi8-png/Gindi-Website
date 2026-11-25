/*
 * Gindi Studio — connection settings
 * Fill these from Supabase → Project Settings → API.
 * Both values are public by design (they ship inside the app); the database
 * rules in supabase/schema.sql decide who can see and change what.
 * Never put the service_role key or the database password here.
 * While these are empty the app runs in demo mode only.
 */
window.GINDI_APP_CONFIG = {
  supabaseUrl: '',
  supabaseAnonKey: '',
};
