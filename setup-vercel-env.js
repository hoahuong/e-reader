#!/usr/bin/env node
/**
 * Script để set Vercel environment variables
 * Chạy: node setup-vercel-env.js
 */

const { execSync } = require('child_process');

// Đọc từ .env.local hoặc yêu cầu user nhập
const fs = require('fs');
const path = require('path');

let envVars = {
  GITHUB_OWNER: 'hoahuong',
  GITHUB_REPO: 'e-reader',
};

// Thử đọc từ .env.local
try {
  const envLocalPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envLocalPath)) {
    const envContent = fs.readFileSync(envLocalPath, 'utf-8');
    const tokenMatch = envContent.match(/GITHUB_TOKEN=(.+)/);
    if (tokenMatch) {
      envVars.GITHUB_TOKEN = tokenMatch[1].trim();
    }
  }
} catch (error) {
  console.warn('Không thể đọc .env.local:', error.message);
}

// Nếu không có token, yêu cầu user nhập
if (!envVars.GITHUB_TOKEN) {
  console.log('❌ Không tìm thấy GITHUB_TOKEN trong .env.local');
  console.log('📝 Vui lòng set manual qua Vercel Dashboard hoặc nhập token khi được hỏi');
  process.exit(1);
}

const environments = ['production', 'preview', 'development'];

function checkVercelCLI() {
  try {
    execSync('vercel --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function setEnvVar(key, value, env) {
  try {
    console.log(`Setting ${key} for ${env}...`);
    const command = `echo "${value}" | vercel env add ${key} ${env}`;
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${key} đã được set cho ${env}`);
    return true;
  } catch (error) {
    console.error(`❌ Lỗi khi set ${key} cho ${env}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Bắt đầu setup Vercel environment variables...\n');

  if (!checkVercelCLI()) {
    console.log('❌ Vercel CLI chưa được cài đặt.');
    console.log('📦 Cài đặt bằng: npm i -g vercel');
    console.log('   Hoặc dùng npx: npx vercel env add ...');
    console.log('\n📝 Hoặc set manual qua Vercel Dashboard:');
    console.log('   1. Vào https://vercel.com/dashboard');
    console.log('   2. Chọn project → Settings → Environment Variables');
    console.log('   3. Thêm các biến sau:\n');
    console.log(`   GITHUB_TOKEN = [Token từ .env.local]`);
    console.log(`   GITHUB_OWNER = hoahuong`);
    console.log(`   GITHUB_REPO = e-reader`);
    process.exit(1);
  }

  console.log('✅ Vercel CLI đã được cài đặt\n');

  // Chỉ set cho production để tránh nhiều lần nhập
  const env = 'production';
  console.log(`📝 Setting environment variables cho ${env}...\n`);

  let successCount = 0;
  for (const [key, value] of Object.entries(envVars)) {
    if (setEnvVar(key, value, env)) {
      successCount++;
    }
    console.log('');
  }

  console.log(`\n✅ Đã set ${successCount}/${Object.keys(envVars).length} environment variables`);
  console.log('\n📝 Bước tiếp theo:');
  console.log('   1. Redeploy project trên Vercel để áp dụng changes');
  console.log('   2. Hoặc push code mới để trigger auto-deploy');
  console.log('   3. Check logs để xem có lỗi không');
}

main().catch(console.error);
