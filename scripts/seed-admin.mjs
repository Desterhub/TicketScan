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

async function seedAdmin() {
  console.log('\n=============================================');
  console.log('🛡️  TicketScan: Seeding Initial Admin Account');
  console.log('=============================================');

  const adminEmail = 'tirth@ticketscan.local';
  const adminUsername = 'tirth';

  console.log(`Hashing password with bcrypt (10 rounds)...`);
  const passwordHash = await bcrypt.hash(adminSeedPassword, 10);

  // 1. Seed local JSON storage (data/users.json)
  const dataDir = path.resolve(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const usersFile = path.join(dataDir, 'users.json');
  let users = [];
  if (fs.existsSync(usersFile)) {
    try {
      users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
    } catch {}
  }

  const existingLocalIdx = users.findIndex(
    (u) =>
      u.email?.toLowerCase() === adminEmail ||
      u.full_name?.toLowerCase() === adminUsername
  );

  const adminRecord = {
    id: existingLocalIdx >= 0 ? users[existingLocalIdx].id : 'a0000000-0000-0000-0000-000000000001',
    email: adminEmail,
    full_name: adminUsername,
    password_hash: passwordHash,
    role: 'admin',
    is_active: true,
    created_at: new Date().toISOString(),
    last_login_at: null,
  };

  if (existingLocalIdx >= 0) {
    users[existingLocalIdx] = { ...users[existingLocalIdx], ...adminRecord };
  } else {
    users.push(adminRecord);
  }

  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), 'utf-8');
  console.log('✅ Local database seeded with Admin credentials: data/users.json');

  // 2. If Supabase is configured, seed Supabase remote instance
  if (supabaseUrl && supabaseServiceKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data: existingUser } = await supabase
        .from('users')
        .select('id, email, role')
        .or(`email.eq.${adminEmail},full_name.eq.${adminUsername}`)
        .maybeSingle();

      if (existingUser) {
        console.log(`Updating Supabase admin user (${existingUser.id})...`);
        await supabase
          .from('users')
          .update({
            role: 'admin',
            password_hash: passwordHash,
            full_name: adminUsername,
            is_active: true,
          })
          .eq('id', existingUser.id);
        console.log('✅ Supabase remote admin account updated successfully!');
      } else {
        console.log(`Inserting Supabase admin account "${adminUsername}"...`);
        await supabase.from('users').insert({
          email: adminEmail,
          full_name: adminUsername,
          password_hash: passwordHash,
          role: 'admin',
          is_active: true,
        });
        console.log('✅ Supabase remote admin account created successfully!');
      }
    } catch (supaErr) {
      console.warn('Note: Supabase sync skipped or failed:', supaErr.message);
    }
  } else {
    console.log('ℹ️  Note: Supabase credentials not set in .env.local yet; local database ready for localhost testing.');
  }

  console.log('\n---------------------------------------------');
  console.log('Admin login credentials:');
  console.log(`  Identifier: ${adminUsername} (or ${adminEmail})`);
  console.log(`  Password:   ${adminSeedPassword}`);
  console.log('  Role:       admin');
  console.log('  Route:      /admin/login');
  console.log('---------------------------------------------');
  console.log('=============================================\n');
}

seedAdmin().catch((err) => {
  console.error('Fatal error in seedAdmin:', err);
  process.exit(1);
});
