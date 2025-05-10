
import { createClient } from '@supabase/supabase-js';

// Supabase project URL and anon key (safe to use in browser)
// Questi valori sono forniti per il test, in un'app reale andrebbero nelle variabili d'ambiente
const supabaseUrl = 'https://yhsxqxguqgeexbfmadil.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inloc3hxeGd1cWdlZXhiZm1hZGlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTYyMjU1MzAsImV4cCI6MjAzMTgwMTUzMH0.RsD0v-h1jPGe-1CCtXQQhgjVu17YC6eK1WSXi9aB1pA';

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseKey);
