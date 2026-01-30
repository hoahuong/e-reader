/**
 * Bug Fix Planner - Tự động lên kế hoạch fix bugs
 */

export class BugFixPlanner {
  constructor() {
    this.fixPlans = new Map();
    this.setupFixStrategies();
  }

  setupFixStrategies() {
    // Strategy for undefined variable bugs
    this.fixPlans.set('undefined_variable', {
      priority: 'high',
      estimatedTime: '15-30 minutes',
      steps: [
        '1. Identify missing prop in component',
        '2. Add prop to component signature',
        '3. Pass prop from parent component',
        '4. Add default value if needed',
        '5. Test fix with unit tests',
      ],
      autoFix: (bug) => {
        return {
          type: 'add_prop',
          component: bug.component,
          prop: bug.message.match(/is not defined/)?.[0]?.replace(' is not defined', ''),
          defaultValue: 'null',
        };
      },
    });

    // Strategy for localStorage errors
    this.fixPlans.set('localStorage_error', {
      priority: 'medium',
      estimatedTime: '10-20 minutes',
      steps: [
        '1. Add try-catch around localStorage calls',
        '2. Implement fallback mechanism',
        '3. Use in-memory storage as backup',
        '4. Test in private/incognito mode',
      ],
      autoFix: (bug) => {
        return {
          type: 'add_fallback',
          storage: 'localStorage',
          fallback: 'memory',
        };
      },
    });

    // Strategy for missing error handlers
    this.fixPlans.set('missing_error_handler', {
      priority: 'low',
      estimatedTime: '5-15 minutes',
      steps: [
        '1. Add error boundary component',
        '2. Add error UI elements',
        '3. Add error logging',
        '4. Test error scenarios',
      ],
      autoFix: (bug) => {
        return {
          type: 'add_error_handler',
          location: 'global',
        };
      },
    });

    // Strategy for runtime errors
    this.fixPlans.set('runtime_error', {
      priority: 'high',
      estimatedTime: '30-60 minutes',
      steps: [
        '1. Analyze error stack trace',
        '2. Identify root cause',
        '3. Add error handling',
        '4. Add user-friendly error message',
        '5. Test fix',
      ],
      autoFix: (bug) => {
        return {
          type: 'add_error_boundary',
          component: bug.filename,
        };
      },
    });
  }

  /**
   * Generate fix plan for a bug
   */
  generateFixPlan(bug) {
    const strategy = this.fixPlans.get(bug.type);
    
    if (!strategy) {
      return {
        priority: 'medium',
        estimatedTime: 'unknown',
        steps: [
          '1. Analyze bug',
          '2. Identify root cause',
          '3. Implement fix',
          '4. Test fix',
        ],
        autoFix: null,
      };
    }

    return {
      ...strategy,
      bugId: bug.id,
      bugMessage: bug.message,
      autoFix: strategy.autoFix ? strategy.autoFix(bug) : null,
    };
  }

  /**
   * Generate fix plan for multiple bugs
   */
  generateFixPlans(bugs) {
    return bugs.map(bug => ({
      bug,
      plan: this.generateFixPlan(bug),
    }));
  }

  /**
   * Prioritize bugs by severity
   */
  prioritizeBugs(bugs) {
    const severityOrder = { high: 3, medium: 2, low: 1 };
    
    return bugs.sort((a, b) => {
      const aSeverity = severityOrder[a.severity] || 0;
      const bSeverity = severityOrder[b.severity] || 0;
      return bSeverity - aSeverity;
    });
  }

  /**
   * Generate fix report
   */
  generateFixReport(bugs) {
    const prioritizedBugs = this.prioritizeBugs(bugs);
    const fixPlans = this.generateFixPlans(prioritizedBugs);

    return {
      summary: {
        totalBugs: bugs.length,
        highPriority: bugs.filter(b => b.severity === 'high').length,
        mediumPriority: bugs.filter(b => b.severity === 'medium').length,
        lowPriority: bugs.filter(b => b.severity === 'low').length,
      },
      bugs: fixPlans,
      estimatedTotalTime: this.calculateTotalTime(fixPlans),
    };
  }

  /**
   * Calculate total estimated time
   */
  calculateTotalTime(fixPlans) {
    // Simple calculation - in real scenario would parse time strings
    return `${fixPlans.length * 20}-${fixPlans.length * 40} minutes`;
  }
}

// Export singleton instance
export const bugFixPlanner = new BugFixPlanner();
