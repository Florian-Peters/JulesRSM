
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const SUPABASE_URL = 'https://xmdmcwbditnqpzvngtfw.supabase.co'; 

// Using the correct Anon/Public JWT key provided
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtZG1jd2JkaXRucXB6dm5ndGZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwMDM0MTEsImV4cCI6MjA4MjU3OTQxMX0.HgJSajY4oxeK7R_LXIo9lDb0qCJbfsJ-_0viwhtHn9I';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
