
import { createClient } from '@supabase/supabase-js';

// These values should be set via environment variables in a real application
// For this demo, we're using a public testing Supabase instance
const supabaseUrl = 'https://nsyvrwbgdxxfkhdjhkmp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zeXZyd2JnZHh4ZmtoZGpoa21wIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODUxNjgwNzAsImV4cCI6MjAwMDc0NDA3MH0.vaH0_WSiTVY5T_AYJ1EnXc3q8fRHNJDUOvZ4nCQV5kg';

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseKey);
