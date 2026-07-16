import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SECRET_KEY!

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function createAdmin() {
  const email = 'admin@mubarista.com'
  const password = 'Admin123!@#'
  
  console.log('Creating admin user...')
  console.log('Email:', email)
  console.log('Password:', password)
  
  // Create user in Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'admin' }
  })
  
  if (authError) {
    console.error('Auth error:', authError)
    return
  }
  
  console.log('Auth user created:', authData.user.id)
  
  // Add to users table
  const { data: userData, error: userError } = await supabase
    .from('users')
    .insert({
      id: authData.user.id,
      email: email,
      name: 'Admin User',
      role: 'admin',
      is_premium: false,
      email_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
  
  if (userError) {
    console.error('Users table error:', userError)
  } else {
    console.log('Admin user created successfully!')
    console.log('User data:', userData)
  }
}

createAdmin()
