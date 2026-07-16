import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function runSchema() {
  const schemaPath = path.join(__dirname, 'supabase-schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf-8');

  // Use the PostgreSQL connection via Supabase REST API
  // We'll use the /rest/v1/rpc endpoint approach - but for DDL we need the SQL editor
  // Instead, let's use the Supabase Management API or direct pg connection
  
  // Try using fetch to the Supabase SQL endpoint
  const response = await fetch(`${supabaseUrl}/rest/v1/`, {
    method: 'POST',
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });

  console.log('Response status:', response.status);
  const text = await response.text();
  console.log('Response:', text.substring(0, 500));
}

runSchema().catch(console.error);
