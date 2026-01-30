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

    // Chỉ chạy detection trong browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      // Trong Node.js environment, return empty bugs array
      return bugs;
    }

    // Bug 1: Check for undefined variables (chỉ trong browser)
    try {
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
    } catch (e) {
      // Ignore errors in Node.js environment
    }

    // Bug 2: Check for localStorage errors
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.getItem('test');
      }
    } catch (e) {
      bugs.push({
        id: 'BUG_002',
        severity: 'medium',
        type: 'localStorage_error',
        message: 'localStorage not available',
        fix: 'Add localStorage fallback',
      });
    }

    // Bug 3: Check for missing error handlers (chỉ trong browser)
    try {
      if (typeof document !== 'undefined') {
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
      }
    } catch (e) {
      // Ignore errors in Node.js environment
    }

    return bugs;
  }

  /**
   * Monitor runtime errors
   */
  setupErrorMonitoring() {
    // Chỉ setup trong browser environment
    if (typeof window === 'undefined') {
      return;
    }

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
    const bugReport = {
      ...bug,
      timestamp: new Date().toISOString(),
    };

    // Chỉ thêm browser-specific info nếu có
    if (typeof navigator !== 'undefined') {
      bugReport.userAgent = navigator.userAgent;
    }
    if (typeof window !== 'undefined' && window.location) {
      bugReport.url = window.location.href;
    }

    this.detectedBugs.push(bugReport);

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
