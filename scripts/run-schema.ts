import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase URL or anon key environment variables');
}

async function runSchema() {
  const schemaPath = path.join(__dirname, 'supabase-schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf-8');

  const response = await fetch(`${supabaseUrl}/rest/v1/`, {
    method: 'POST',
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
    } as HeadersInit,
    body: JSON.stringify({ query: sql }),
  });

  console.log('Response status:', response.status);
  const text = await response.text();
  console.log('Response:', text.substring(0, 500));
}

runSchema().catch(console.error);
