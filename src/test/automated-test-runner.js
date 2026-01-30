/**
 * Automated Test Runner - Chạy test tự động và phát hiện bugs
 */

import { bugDetector } from './bug-detector.js';
import { bugFixPlanner } from './bug-fix-planner.js';

export class AutomatedTestRunner {
  constructor() {
    this.testResults = [];
    this.bugs = [];
    this.fixReport = null;
  }

  /**
   * Run all tests
   */
  async runTests() {
    console.log('🧪 Starting automated tests...');

    // Setup error monitoring
    bugDetector.setupErrorMonitoring();

    // Run bug detection
    const detectedBugs = bugDetector.detectBugs();
    this.bugs = detectedBugs;

    // Generate fix plans
    if (detectedBugs.length > 0) {
      this.fixReport = bugFixPlanner.generateFixReport(detectedBugs);
    }

    return {
      bugs: detectedBugs,
      fixReport: this.fixReport,
    };
  }

  /**
   * Run specific test suite
   */
  async runTestSuite(suiteName) {
    console.log(`🧪 Running test suite: ${suiteName}`);

    // This would integrate with Vitest
    // For now, return mock results
    return {
      suite: suiteName,
      passed: true,
      tests: [],
    };
  }

  /**
   * Generate test report
   */
  generateReport() {
    return {
      timestamp: new Date().toISOString(),
      bugs: this.bugs,
      fixReport: this.fixReport,
      summary: {
        totalBugs: this.bugs.length,
        highPriority: this.bugs.filter(b => b.severity === 'high').length,
        needsFix: this.bugs.length > 0,
      },
    };
  }

  /**
   * Export report to file
   */
  exportReport(format = 'json') {
    const report = this.generateReport();
    
    if (format === 'json') {
      return JSON.stringify(report, null, 2);
    } else if (format === 'markdown') {
      return this.generateMarkdownReport(report);
    }
  }

  /**
   * Generate markdown report
   */
  generateMarkdownReport(report) {
    let markdown = `# 🐛 Bug Report\n\n`;
    markdown += `**Generated:** ${report.timestamp}\n\n`;
    markdown += `## Summary\n\n`;
    markdown += `- Total Bugs: ${report.summary.totalBugs}\n`;
    markdown += `- High Priority: ${report.summary.highPriority}\n`;
    markdown += `- Needs Fix: ${report.summary.needsFix ? '✅ Yes' : '❌ No'}\n\n`;

    if (report.bugs.length > 0) {
      markdown += `## Detected Bugs\n\n`;
      report.bugs.forEach((bug, index) => {
        markdown += `### Bug ${index + 1}: ${bug.id}\n\n`;
        markdown += `- **Severity:** ${bug.severity}\n`;
        markdown += `- **Type:** ${bug.type}\n`;
        markdown += `- **Message:** ${bug.message}\n`;
        if (bug.component) {
          markdown += `- **Component:** ${bug.component}\n`;
        }
        if (bug.fix) {
          markdown += `- **Fix:** ${bug.fix}\n`;
        }
        markdown += `\n`;
      });
    }

    if (report.fixReport) {
      markdown += `## Fix Plan\n\n`;
      markdown += `**Estimated Time:** ${report.fixReport.estimatedTotalTime}\n\n`;
      
      report.fixReport.bugs.forEach((item, index) => {
        const { bug, plan } = item;
        markdown += `### Fix Plan for Bug ${index + 1}: ${bug.id}\n\n`;
        markdown += `**Priority:** ${plan.priority}\n`;
        markdown += `**Estimated Time:** ${plan.estimatedTime}\n\n`;
        markdown += `**Steps:**\n`;
        plan.steps.forEach(step => {
          markdown += `${step}\n`;
        });
        markdown += `\n`;
      });
    }

    return markdown;
  }
}

// Export singleton instance
export const testRunner = new AutomatedTestRunner();
