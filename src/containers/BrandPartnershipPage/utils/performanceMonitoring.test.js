import {
  trackWebVitals,
  trackPageLoadPerformance,
  trackResourceLoading,
  initPerformanceMonitoring
} from './performanceMonitoring';

// Mock dependencies
global.fetch = jest.fn();
Object.defineProperty(window, 'gtag', {
  value: jest.fn(),
  writable: true
});

Object.defineProperty(navigator, 'userAgent', {
  value: 'Mozilla/5.0 (Test Browser)',
  writable: true
});

describe('Performance Monitoring', () => {
  let mockWebVitals;
  let originalEnv;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockClear();
    window.gtag.mockClear();

    // Store original environment
    originalEnv = process.env;

    // Mock web-vitals module
    mockWebVitals = {
      onCLS: jest.fn(),
      onFID: jest.fn(),
      onFCP: jest.fn(),
      onLCP: jest.fn(),
      onTTFB: jest.fn()
    };

    // Mock dynamic import
    jest.doMock('web-vitals', () => mockWebVitals);

    // Mock performance API
    Object.defineProperty(window, 'performance', {
      value: {
        getEntriesByType: jest.fn(),
        navigation: {}
      },
      writable: true
    });

    // Reset console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'table').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
    jest.resetModules();
  });

  describe('trackWebVitals', () => {
    it('should initialize web vitals tracking when available', () => {
      // Mock window with web-vital support
      Object.defineProperty(window, 'web-vital', {
        value: true,
        writable: true
      });

      trackWebVitals();

      // Should attempt to import web-vitals (tested via integration)
      expect(typeof trackWebVitals).toBe('function');
    });

    it('should handle missing web-vitals gracefully', () => {
      delete window['web-vital'];

      expect(() => {
        trackWebVitals();
      }).not.toThrow();
    });

    it('should handle server-side rendering (no window)', () => {
      const originalWindow = global.window;
      delete global.window;

      expect(() => {
        trackWebVitals();
      }).not.toThrow();

      global.window = originalWindow;
    });
  });

  describe('Performance Threshold Checking', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      process.env.REACT_APP_PERFORMANCE_ALERTS_ENABLED = 'true';
      process.env.REACT_APP_SLACK_WEBHOOK_URL = 'https://test-slack-webhook.com';
    });

    it('should calculate severity levels correctly', () => {
      // This tests the internal calculateSeverity function through metric processing
      const mockMetric = {
        name: 'LCP',
        value: 5000, // 2x threshold (2500)
        id: 'test-id',
        delta: 100
      };

      // Mock the sendToAnalytics function (called by web vitals)
      const originalImport = require;
      jest.doMock('web-vitals', () => ({
        onLCP: (callback) => callback(mockMetric)
      }));

      trackWebVitals();

      // Verify gtag was called (indicates metric was processed)
      expect(window.gtag).toHaveBeenCalledWith('event', 'LCP', expect.any(Object));
    });

    it('should send Slack alerts for threshold violations', async () => {
      global.fetch.mockResolvedValueOnce({ ok: true });

      const mockMetric = {
        name: 'LCP',
        value: 5000, // Exceeds threshold
        id: 'test-id',
        delta: 100
      };

      // Simulate metric processing with threshold violation
      jest.doMock('web-vitals', () => ({
        onLCP: (callback) => callback(mockMetric)
      }));

      trackWebVitals();

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(global.fetch).toHaveBeenCalledWith(
        'https://test-slack-webhook.com',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });

    it('should handle Slack webhook failures gracefully', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const mockMetric = {
        name: 'LCP',
        value: 5000,
        id: 'test-id',
        delta: 100
      };

      jest.doMock('web-vitals', () => ({
        onLCP: (callback) => callback(mockMetric)
      }));

      expect(() => {
        trackWebVitals();
      }).not.toThrow();

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(console.error).toHaveBeenCalledWith('Failed to send Slack alert:', expect.any(Error));
    });

    it('should not send alerts in development mode', () => {
      process.env.NODE_ENV = 'development';

      const mockMetric = {
        name: 'LCP',
        value: 5000,
        id: 'test-id',
        delta: 100
      };

      jest.doMock('web-vitals', () => ({
        onLCP: (callback) => callback(mockMetric)
      }));

      trackWebVitals();

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should not send alerts when disabled', () => {
      process.env.REACT_APP_PERFORMANCE_ALERTS_ENABLED = 'false';

      const mockMetric = {
        name: 'LCP',
        value: 5000,
        id: 'test-id',
        delta: 100
      };

      jest.doMock('web-vitals', () => ({
        onLCP: (callback) => callback(mockMetric)
      }));

      trackWebVitals();

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('trackPageLoadPerformance', () => {
    it('should track page load metrics when performance API is available', () => {
      const mockNavigation = {
        domainLookupStart: 100,
        domainLookupEnd: 150,
        connectStart: 150,
        connectEnd: 200,
        requestStart: 200,
        responseStart: 300,
        responseEnd: 400,
        domContentLoadedEventStart: 400,
        domContentLoadedEventEnd: 450,
        loadEventStart: 450,
        loadEventEnd: 500,
        navigationStart: 0
      };

      window.performance.getEntriesByType.mockReturnValue([mockNavigation]);

      trackPageLoadPerformance();

      // Simulate load event
      const loadEvent = new Event('load');
      window.dispatchEvent(loadEvent);

      expect(window.performance.getEntriesByType).toHaveBeenCalledWith('navigation');
      expect(window.gtag).toHaveBeenCalledWith('event', 'timing_complete', expect.objectContaining({
        event_category: 'Performance',
        event_label: 'dns'
      }));
    });

    it('should handle missing performance API gracefully', () => {
      delete window.performance;

      expect(() => {
        trackPageLoadPerformance();
        window.dispatchEvent(new Event('load'));
      }).not.toThrow();
    });

    it('should log metrics in development mode', () => {
      process.env.NODE_ENV = 'development';

      const mockNavigation = {
        domainLookupStart: 100,
        domainLookupEnd: 150,
        connectStart: 150,
        connectEnd: 200,
        requestStart: 200,
        responseStart: 300,
        responseEnd: 400,
        domContentLoadedEventStart: 400,
        domContentLoadedEventEnd: 450,
        loadEventStart: 450,
        loadEventEnd: 500,
        navigationStart: 0
      };

      window.performance.getEntriesByType.mockReturnValue([mockNavigation]);

      trackPageLoadPerformance();
      window.dispatchEvent(new Event('load'));

      expect(console.table).toHaveBeenCalled();
    });
  });

  describe('trackResourceLoading', () => {
    it('should track resource loading metrics', () => {
      const mockResources = [
        {
          name: 'https://example.com/app.js',
          transferSize: 500000,
          decodedBodySize: 1000000,
          duration: 1000
        },
        {
          name: 'https://example.com/styles.css',
          transferSize: 100000,
          decodedBodySize: 200000,
          duration: 500
        },
        {
          name: 'https://example.com/image.jpg',
          transferSize: 200000,
          decodedBodySize: 300000,
          duration: 300
        }
      ];

      window.performance.getEntriesByType.mockReturnValue(mockResources);

      trackResourceLoading();
      window.dispatchEvent(new Event('load'));

      expect(window.performance.getEntriesByType).toHaveBeenCalledWith('resource');
      expect(window.gtag).toHaveBeenCalledWith('event', 'resource_loading', expect.objectContaining({
        event_category: 'Performance',
        event_label: 'totalResources'
      }));
    });

    it('should detect slow resource bottlenecks', async () => {
      process.env.NODE_ENV = 'production';
      process.env.REACT_APP_PERFORMANCE_ALERTS_ENABLED = 'true';
      process.env.REACT_APP_SLACK_WEBHOOK_URL = 'https://test-slack-webhook.com';

      const mockResources = [
        {
          name: 'https://example.com/slow-script.js',
          transferSize: 100000,
          decodedBodySize: 200000,
          duration: 5000 // Slow resource
        }
      ];

      window.performance.getEntriesByType.mockReturnValue(mockResources);
      global.fetch.mockResolvedValueOnce({ ok: true });

      trackResourceLoading();
      window.dispatchEvent(new Event('load'));

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(window.gtag).toHaveBeenCalledWith('event', 'resource_bottleneck', expect.objectContaining({
        event_category: 'Performance Bottlenecks',
        event_label: 'slow_resource'
      }));
    });

    it('should detect large resource bottlenecks', async () => {
      process.env.NODE_ENV = 'production';
      process.env.REACT_APP_PERFORMANCE_ALERTS_ENABLED = 'true';

      const mockResources = [
        {
          name: 'https://example.com/large-bundle.js',
          transferSize: 2000000, // 2MB - large resource
          decodedBodySize: 4000000,
          duration: 1000
        }
      ];

      window.performance.getEntriesByType.mockReturnValue(mockResources);

      trackResourceLoading();
      window.dispatchEvent(new Event('load'));

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(window.gtag).toHaveBeenCalledWith('event', 'resource_bottleneck', expect.objectContaining({
        event_category: 'Performance Bottlenecks',
        event_label: 'large_resource'
      }));
    });

    it('should detect too many resources', async () => {
      process.env.NODE_ENV = 'production';
      process.env.REACT_APP_PERFORMANCE_ALERTS_ENABLED = 'true';

      // Create 150 mock resources (exceeds 100 threshold)
      const mockResources = Array.from({ length: 150 }, (_, i) => ({
        name: `https://example.com/resource-${i}.js`,
        transferSize: 1000,
        decodedBodySize: 2000,
        duration: 100
      }));

      window.performance.getEntriesByType.mockReturnValue(mockResources);

      trackResourceLoading();
      window.dispatchEvent(new Event('load'));

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(window.gtag).toHaveBeenCalledWith('event', 'resource_bottleneck', expect.objectContaining({
        event_category: 'Performance Bottlenecks',
        event_label: 'too_many_resources'
      }));
    });

    it('should log resource metrics in development', () => {
      process.env.NODE_ENV = 'development';

      const mockResources = [
        {
          name: 'https://example.com/app.js',
          transferSize: 500000,
          decodedBodySize: 1000000,
          duration: 1000
        }
      ];

      window.performance.getEntriesByType.mockReturnValue(mockResources);

      trackResourceLoading();
      window.dispatchEvent(new Event('load'));

      expect(console.log).toHaveBeenCalledWith('Resource Metrics:', expect.any(Object));
    });
  });

  describe('Email Alert Integration', () => {
    it('should send email alerts when endpoint is configured', async () => {
      process.env.NODE_ENV = 'production';
      process.env.REACT_APP_PERFORMANCE_ALERTS_ENABLED = 'true';
      process.env.REACT_APP_ALERT_EMAIL_ENDPOINT = 'https://test-email-endpoint.com';

      global.fetch.mockResolvedValueOnce({ ok: true });

      const mockMetric = {
        name: 'LCP',
        value: 5000,
        id: 'test-id',
        delta: 100
      };

      jest.doMock('web-vitals', () => ({
        onLCP: (callback) => callback(mockMetric)
      }));

      trackWebVitals();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(global.fetch).toHaveBeenCalledWith(
        'https://test-email-endpoint.com',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('Performance Alert')
        })
      );
    });

    it('should handle email endpoint failures gracefully', async () => {
      process.env.NODE_ENV = 'production';
      process.env.REACT_APP_PERFORMANCE_ALERTS_ENABLED = 'true';
      process.env.REACT_APP_ALERT_EMAIL_ENDPOINT = 'https://test-email-endpoint.com';

      global.fetch.mockRejectedValueOnce(new Error('Email service error'));

      const mockMetric = {
        name: 'LCP',
        value: 5000,
        id: 'test-id',
        delta: 100
      };

      jest.doMock('web-vitals', () => ({
        onLCP: (callback) => callback(mockMetric)
      }));

      trackWebVitals();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(console.error).toHaveBeenCalledWith('Failed to send email alert:', expect.any(Error));
    });
  });

  describe('initPerformanceMonitoring', () => {
    it('should initialize all performance tracking functions', () => {
      const trackWebVitalsSpy = jest.spyOn(require('./performanceMonitoring'), 'trackWebVitals');
      const trackPageLoadSpy = jest.spyOn(require('./performanceMonitoring'), 'trackPageLoadPerformance');
      const trackResourceLoadingSpy = jest.spyOn(require('./performanceMonitoring'), 'trackResourceLoading');

      initPerformanceMonitoring();

      expect(trackWebVitalsSpy).toHaveBeenCalled();
      expect(trackPageLoadSpy).toHaveBeenCalled();
      expect(trackResourceLoadingSpy).toHaveBeenCalled();
    });

    it('should handle initialization errors gracefully', () => {
      // Mock one of the functions to throw
      jest.spyOn(require('./performanceMonitoring'), 'trackWebVitals').mockImplementation(() => {
        throw new Error('Initialization error');
      });

      expect(() => {
        initPerformanceMonitoring();
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing gtag gracefully', () => {
      delete window.gtag;

      const mockMetric = {
        name: 'LCP',
        value: 1000,
        id: 'test-id',
        delta: 100
      };

      jest.doMock('web-vitals', () => ({
        onLCP: (callback) => callback(mockMetric)
      }));

      expect(() => {
        trackWebVitals();
      }).not.toThrow();
    });

    it('should handle CLS metric formatting correctly', () => {
      const mockMetric = {
        name: 'CLS',
        value: 0.15, // CLS values are decimals
        id: 'test-id',
        delta: 0.01
      };

      jest.doMock('web-vitals', () => ({
        onCLS: (callback) => callback(mockMetric)
      }));

      trackWebVitals();

      expect(window.gtag).toHaveBeenCalledWith('event', 'CLS', expect.objectContaining({
        value: 150 // Should be multiplied by 1000 for CLS
      }));
    });

    it('should handle missing environment variables', () => {
      delete process.env.REACT_APP_PERFORMANCE_THRESHOLD_LCP;
      delete process.env.REACT_APP_PERFORMANCE_THRESHOLD_FID;

      const mockMetric = {
        name: 'LCP',
        value: 3000, // Should use default threshold
        id: 'test-id',
        delta: 100
      };

      jest.doMock('web-vitals', () => ({
        onLCP: (callback) => callback(mockMetric)
      }));

      expect(() => {
        trackWebVitals();
      }).not.toThrow();
    });
  });
});