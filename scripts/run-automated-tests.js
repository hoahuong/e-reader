#!/usr/bin/env node

/**
 * Automated Test Runner Script
 * Chạy test tự động và generate bug report
 */

import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { testRunner } from '../src/test/automated-test-runner.js';

async function main() {
  console.log('🚀 Starting Automated Test Suite...\n');

  try {
    // Run Vitest tests
    console.log('📋 Running unit tests...');
    execSync('npm run test:run', { stdio: 'inherit' });

    // Run bug detection
    console.log('\n🔍 Running bug detection...');
    const { bugs, fixReport } = await testRunner.runTests();

    // Generate report
    console.log('\n📊 Generating report...');
    const report = testRunner.generateReport();

    // Export reports
    const jsonReport = testRunner.exportReport('json');
    const markdownReport = testRunner.exportReport('markdown');

    // Save reports
    writeFileSync('bug-report.json', jsonReport);
    writeFileSync('BUG_REPORT.md', markdownReport);

    console.log('\n✅ Test completed!');
    console.log(`📄 Reports saved:`);
    console.log(`   - bug-report.json`);
    console.log(`   - BUG_REPORT.md`);

    if (bugs.length > 0) {
      console.log(`\n⚠️  Found ${bugs.length} potential bugs`);
      console.log(`   High priority: ${bugs.filter(b => b.severity === 'high').length}`);
      
      if (fixReport) {
        console.log(`\n💡 Fix plan generated:`);
        console.log(`   Estimated time: ${fixReport.estimatedTotalTime}`);
      }
      
      // Chỉ exit với error code nếu có high priority bugs
      // Low/medium priority bugs không làm fail workflow
      const highPriorityBugs = bugs.filter(b => b.severity === 'high');
      if (highPriorityBugs.length > 0) {
        console.log(`\n⚠️  High priority bugs detected - workflow sẽ fail`);
        process.exit(1);
      } else {
        console.log(`\n✅ No high priority bugs - workflow sẽ pass`);
        process.exit(0);
      }
    } else {
      console.log('\n✅ No bugs detected!');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

main();
