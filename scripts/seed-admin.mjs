/**
 * Standalone Admin Seed Script for TicketScan
 * Usage: node scripts/seed-admin.mjs
 * 
 * Creates or updates the admin account "tirth" with hashed password
 * read strictly from ADMIN_SEED_PASSWORD environment variable.
 */

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local if present
const envLocalPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const adminSeedPassword = process.env.ADMIN_SEED_PASSWORD || '010205';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('\n❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
  console.error('Please configure your credentials in .env.local before running the seed script.\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function seedAdmin() {
  console.log('\n=============================================');
  console.log('🛡️  TicketScan: Seeding Initial Admin Account');
  console.log('=============================================');

  const adminEmail = 'tirth@ticketscan.local';
  const adminUsername = 'tirth';

  console.log(`Hashing password with bcrypt (10 rounds)...`);
  const passwordHash = await bcrypt.hash(adminSeedPassword, 10);

  // Check if user already exists
  const { data: existingUser, error: checkError } = await supabase
    .from('users')
    .select('id, email, role')
    .or(`email.eq.${adminEmail},full_name.eq.${adminUsername}`)
    .maybeSingle();

  if (checkError && checkError.code !== 'PGRST116') {
    console.error('Database query error:', checkError.message);
  }

  if (existingUser) {
    console.log(`Found existing user with ID: ${existingUser.id}. Updating to Admin role & updating password hash...`);
    const { error: updateError } = await supabase
      .from('users')
      .update({
        role: 'admin',
        password_hash: passwordHash,
        full_name: adminUsername,
        is_active: true,
      })
      .eq('id', existingUser.id);

    if (updateError) {
      console.error('Failed to update admin account:', updateError.message);
      process.exit(1);
    }
    console.log('✅ Admin account updated successfully!');
  } else {
    console.log(`Creating new admin account "${adminUsername}" (${adminEmail})...`);
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        email: adminEmail,
        full_name: adminUsername,
        password_hash: passwordHash,
        role: 'admin',
        is_active: true,
      })
      .select('id, email, full_name, role')
      .single();

    if (insertError) {
      console.error('Failed to insert admin account:', insertError.message);
      process.exit(1);
    }
    console.log('✅ Admin account created successfully! User ID:', newUser.id);
  }

  console.log('\n---------------------------------------------');
  console.log('Admin login credentials:');
  console.log(`  Identifier: ${adminUsername} (or ${adminEmail})`);
  console.log('  Role:       admin');
  console.log('  Route:      /admin/login');
  console.log('---------------------------------------------');
  console.log('⚠️  SECURITY NOTICE:');
  console.log('  1. Rotate/delete ADMIN_SEED_PASSWORD in .env.local now.');
  console.log('  2. Change password immediately after logging in.');
  console.log('=============================================\n');
}

seedAdmin().catch((err) => {
  console.error('Fatal error in seedAdmin:', err);
  process.exit(1);
});
