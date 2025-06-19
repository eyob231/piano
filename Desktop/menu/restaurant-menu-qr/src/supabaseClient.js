import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sopmtbfdhrfncqxdgzgw.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvcG10YmZkaHJmbmNxeGRnemd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwMzUzNzgsImV4cCI6MjA2MTYxMTM3OH0.EbsR6cPiPoNmfscErHmFSmnzpIoAXUO1VGE76FE3RBo'



export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'X-Client-Info': 'restaurant-menu-app'
    }
  }
});
