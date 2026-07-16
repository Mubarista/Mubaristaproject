import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetAdminPassword() {
  try {
    // Get the admin user
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      process.exit(1);
    }

    const adminUser = users.users.find(u => u.email === 'admin@mubarista.com');
    
    if (!adminUser) {
      console.error('Admin user not found');
      process.exit(1);
    }

    console.log('Found admin user:', adminUser.email);
    console.log('User ID:', adminUser.id);

    // Reset password using admin API
    const { data, error } = await supabase.auth.admin.updateUserById(adminUser.id, {
      password: 'Admin123!'
    });

    if (error) {
      console.error('Error resetting password:', error);
      process.exit(1);
    }

    console.log('✅ Password reset successfully!');
    console.log('Email: admin@mubarista.com');
    console.log('Password: Admin123!');
    console.log('');
    console.log('⚠️  Please change this password immediately after logging in!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

resetAdminPassword();
