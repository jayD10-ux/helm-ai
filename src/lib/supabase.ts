
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nwaeufzdrvwfavohsklz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53YWV1ZnpkcnZ3ZmF2b2hza2x6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE1OTMxODcsImV4cCI6MjA1NzE2OTE4N30.si5TevkXkFREsmwqH44kENpejPUBCr9ghs07rE5yHTU';

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
