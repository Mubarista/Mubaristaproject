import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminAuthUser() {
  try {
    console.log('Creating admin auth user...');
    
    // Create auth user with admin privileges
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@mubarista.com',
      password: 'Admin@2024!',
      email_confirm: true,
      user_metadata: {
        name: 'System Admin',
        role: 'admin'
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      if (authError.message.includes('already registered')) {
        console.log('User already exists, updating password...');
        
        // Try to update the existing user
        const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
          '00000000-0000-0000-0000-000000000001',
          { password: 'Admin@2024!' }
        );
        
        if (updateError) {
          console.error('Error updating user:', updateError);
        } else {
          console.log('Password updated successfully');
        }
      }
      return;
    }

    console.log('Auth user created successfully:', authData.user?.id);

    // Update the user profile to match the auth user ID
    if (authData.user?.id) {
      const { error: profileError } = await supabase
        .from('users')
        .update({ 
          id: authData.user.id,
          role: 'admin',
          is_premium: true,
          email_verified: true,
          updated_at: new Date().toISOString()
        })
        .eq('email', 'admin@mubarista.com');

      if (profileError) {
        console.error('Error updating user profile:', profileError);
      } else {
        console.log('User profile updated successfully');
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

createAdminAuthUser();
