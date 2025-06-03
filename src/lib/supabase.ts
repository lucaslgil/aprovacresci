import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://brkkmtiwembjzvupxwcr.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJya2ttdGl3ZW1ianp2dXB4d2NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NDY1MzksImV4cCI6MjA2NDEyMjUzOX0.KN_ZMr-xelbDlsznUgvQS6Fy0DgfOjQkPL8R19KOcIA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey) 