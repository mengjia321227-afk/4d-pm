import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kpcddxgmgaylhegjdkxu.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwY2RkeGdtZ2F5bGhlZ2pka3h1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNDQ0MDAsImV4cCI6MjA5NDkyMDQwMH0.3RmGPpBaNTdujNz3gUuszo-nHydUrNMCmq01Ie1ly_E'

export const supabase = createClient(supabaseUrl, supabaseKey)
