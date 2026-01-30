#!/usr/bin/env node
/**
 * Script để test Supabase connection trực tiếp
 * Usage: node scripts/test-supabase-connection.js
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env vars
function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  const env = {};
  
  for (const file of envFiles) {
    try {
      const content = readFileSync(join(__dirname, '..', file), 'utf-8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          if (key && valueParts.length > 0) {
            env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
          }
        }
      });
    } catch (e) {
      // File không tồn tại, bỏ qua
    }
  }
  
  return env;
}

async function testSupabaseConnection() {
  console.log('🧪 Testing Supabase connection...\n');
  
  const env = loadEnv();
  const supabaseUrl = process.env.SUPABASE_URL || env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || env.SUPABASE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY');
    console.log('\nSet trong .env.local:');
    console.log('SUPABASE_URL=https://dkwaexdmbwyozzomdkoj.supabase.co');
    console.log('SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
    process.exit(1);
  }
  
  console.log('📋 Configuration:');
  console.log(`  SUPABASE_URL: ${supabaseUrl}`);
  console.log(`  SUPABASE_ANON_KEY: ${supabaseKey.substring(0, 20)}...\n`);
  
  const testKey = 'pdf-metadata';
  const testValue = {
    catalogs: [
      { id: 'test-1', name: 'Test Catalog', files: [] }
    ],
    files: [
      { id: 'test-file-1', name: 'test.pdf', catalogId: 'test-1' }
    ],
    lastSync: Date.now(),
    version: 1,
  };
  
  // Test 1: GET (kiểm tra table có tồn tại không)
  console.log('🧪 Test 1: GET metadata (kiểm tra table)');
  try {
    const url = `${supabaseUrl}/rest/v1/metadata?key=eq.${testKey}&select=value`;
    const startTime = Date.now();
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });
    
    const duration = Date.now() - startTime;
    console.log(`  Status: ${response.status} ${response.statusText}`);
    console.log(`  Duration: ${duration}ms`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`  Response:`, JSON.stringify(data, null, 2).substring(0, 300));
      console.log('  ✅ GET thành công - Table tồn tại!\n');
    } else {
      const errorText = await response.text();
      console.error(`  ❌ GET failed: ${errorText}`);
      
      if (response.status === 404 || errorText.includes('relation') || errorText.includes('does not exist')) {
        console.log('\n  ⚠️ Table chưa được tạo!');
        console.log('  Chạy SQL trong supabase-setup.sql trong Supabase SQL Editor\n');
      }
    }
  } catch (error) {
    console.error(`  ❌ GET error:`, error.message);
    console.log('');
  }
  
  // Test 2: POST (upsert)
  console.log('🧪 Test 2: POST metadata (upsert)');
  try {
    const url = `${supabaseUrl}/rest/v1/metadata`;
    const startTime = Date.now();
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        key: testKey,
        value: testValue,
      }),
    });
    
    const duration = Date.now() - startTime;
    console.log(`  Status: ${response.status} ${response.statusText}`);
    console.log(`  Duration: ${duration}ms`);
    
    if (response.ok) {
      const data = await response.json().catch(() => null);
      console.log(`  Response:`, data ? JSON.stringify(data, null, 2) : 'Success (no body)');
      console.log('  ✅ POST thành công!\n');
    } else {
      const errorText = await response.text();
      console.error(`  ❌ POST failed: ${errorText}`);
      
      if (errorText.includes('permission') || errorText.includes('policy')) {
        console.log('\n  ⚠️ Row Level Security (RLS) policy chưa được set!');
        console.log('  Chạy SQL trong supabase-setup.sql để tạo policy\n');
      }
    }
  } catch (error) {
    console.error(`  ❌ POST error:`, error.message);
    console.log('');
  }
  
  // Test 3: GET lại để verify
  console.log('🧪 Test 3: GET lại để verify');
  try {
    const url = `${supabaseUrl}/rest/v1/metadata?key=eq.${testKey}&select=value`;
    const startTime = Date.now();
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });
    
    const duration = Date.now() - startTime;
    
    if (response.ok) {
      const data = await response.json();
      if (data && Array.isArray(data) && data.length > 0) {
        const metadata = data[0].value;
        console.log(`  ✅ GET thành công trong ${duration}ms`);
        console.log(`  Catalogs: ${metadata.catalogs?.length || 0}`);
        console.log(`  Files: ${metadata.files?.length || 0}`);
        console.log('  ✅ Data đã được lưu và đọc thành công!\n');
      } else {
        console.log(`  ⚠️ Không có data (${duration}ms)\n`);
      }
    } else {
      const errorText = await response.text();
      console.error(`  ❌ GET failed: ${errorText}\n`);
    }
  } catch (error) {
    console.error(`  ❌ GET error:`, error.message);
    console.log('');
  }
  
  console.log('✅ Test hoàn tất!');
}

testSupabaseConnection().catch(error => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});
