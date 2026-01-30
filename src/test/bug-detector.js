/**
 * Bug Detector - Tự động phát hiện và báo cáo bugs
 */

export class BugDetector {
  constructor() {
    this.detectedBugs = [];
    this.listeners = [];
  }

  /**
   * Detect common bugs
   */
  detectBugs() {
    const bugs = [];

    // Bug 1: Check for undefined variables
    if (typeof uploadDriveFolderId === 'undefined' && window.location.pathname.includes('/')) {
      bugs.push({
        id: 'BUG_001',
        severity: 'high',
        type: 'undefined_variable',
        message: 'uploadDriveFolderId is not defined',
        component: 'LanguageRoutes',
        fix: 'Add uploadDriveFolderId to component props',
      });
    }

    // Bug 2: Check for localStorage errors
    try {
      localStorage.getItem('test');
    } catch (e) {
      bugs.push({
        id: 'BUG_002',
        severity: 'medium',
        type: 'localStorage_error',
        message: 'localStorage not available',
        fix: 'Add localStorage fallback',
      });
    }

    // Bug 3: Check for missing error handlers
    const errorHandlers = document.querySelectorAll('[role="alert"]');
    if (errorHandlers.length === 0) {
      bugs.push({
        id: 'BUG_003',
        severity: 'low',
        type: 'missing_error_handler',
        message: 'No error handlers found',
        fix: 'Add error handling UI',
      });
    }

    return bugs;
  }

  /**
   * Monitor runtime errors
   */
  setupErrorMonitoring() {
    window.addEventListener('error', (event) => {
      this.reportBug({
        id: `RUNTIME_${Date.now()}`,
        severity: 'high',
        type: 'runtime_error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.reportBug({
        id: `PROMISE_${Date.now()}`,
        severity: 'high',
        type: 'unhandled_promise',
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack,
      });
    });
  }

  /**
   * Report bug
   */
  reportBug(bug) {
    this.detectedBugs.push({
      ...bug,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    });

    // Notify listeners
    this.listeners.forEach(listener => listener(bug));

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('🐛 Bug detected:', bug);
    }
  }

  /**
   * Get detected bugs
   */
  getBugs() {
    return this.detectedBugs;
  }

  /**
   * Clear bugs
   */
  clearBugs() {
    this.detectedBugs = [];
  }

  /**
   * Add bug listener
   */
  onBugDetected(callback) {
    this.listeners.push(callback);
  }
}

// Export singleton instance
export const bugDetector = new BugDetector();
