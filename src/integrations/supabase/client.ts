import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ynkkxtwagizzzckfcvjc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlua2t4dHdhZ2l6enpja2ZjdmpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MTA2NTEsImV4cCI6MjA3ODM4NjY1MX0.rb0I34xgTbwLT1QWb_oFKqA1f5mhaqGL0wRSLCf-d4c';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);