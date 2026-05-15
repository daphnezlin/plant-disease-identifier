import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tczegzswzjtyzowgejnc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjemVnenN3emp0eXpvd2dlam5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3MTg0NzEsImV4cCI6MjA5NDI5NDQ3MX0.cbUfqh87PLjitr4zyvWVlgqPCb8-gcXx5GJuidaWwq0';

export const supabase = createClient(supabaseUrl, supabaseKey);