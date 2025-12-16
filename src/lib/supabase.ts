import { createClient } from '@supabase/supabase-js';

// Substitua pelas suas chaves do Painel do Supabase (Project Settings -> API)
const supabaseUrl = 'https://cjznwscxwfddbgsulgtf.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqem53c2N4d2ZkZGJnc3VsZ3RmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MTMzMTQsImV4cCI6MjA4MTQ4OTMxNH0.pCIIBie9op8MYmuhCLhTz4A_vIAEaUrBq0PXEnoYgP8';

export const supabase = createClient(supabaseUrl, supabaseKey);