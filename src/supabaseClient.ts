
import { createClient } from '@supabase/supabase-js';

// Supabase project URL and anon key (safe to use in browser)
// Questi valori sono forniti per il test, in un'app reale andrebbero nelle variabili d'ambiente
const supabaseUrl = 'https://ybjcwjmzwgobxgopntpy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliamN3am16d2dvYnhnb3BudHB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2OTY4ODAsImV4cCI6MjA2MjI3Mjg4MH0.Wbf__F-WKhCkkQefz-NNoPGjDIGtIluixZbwsDeIfkU';

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseKey);
