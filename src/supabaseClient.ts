
import { createClient } from '@supabase/supabase-js';

// These values should be set via environment variables in a real application
// For this demo, we're using a public testing Supabase instance
const supabaseUrl = 'https://ybjcwjmzwgobxgopntpy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliamN3am16d2dvYnhnb3BudHB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODQ5MDc2MTQsImV4cCI6MjAwMDQ4MzYxNH0.5xLceKTw7zOPBwKvqN4c5xFRHgQKXkVt3_ZJlFNQrMU';

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseKey);
