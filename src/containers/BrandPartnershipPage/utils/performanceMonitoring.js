/**
 * Performance monitoring utilities for the Brand Partnership page
 */

// Web Vitals tracking
export const trackWebVitals = () => {
  if (typeof window === 'undefined') return;

  // Track Core Web Vitals
  if ('web-vital' in window) {
    import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
      onCLS(sendToAnalytics);
      onFID(sendToAnalytics);
      onFCP(sendToAnalytics);
      onLCP(sendToAnalytics);
      onTTFB(sendToAnalytics);
    });
  }
};

// Performance thresholds (can be configured via environment variables)
const PERFORMANCE_THRESHOLDS = {
  LCP: Number(process.env.REACT_APP_PERFORMANCE_THRESHOLD_LCP) || 2500, // milliseconds
  FID: Number(process.env.REACT_APP_PERFORMANCE_THRESHOLD_FID) || 100,  // milliseconds
  CLS: Number(process.env.REACT_APP_PERFORMANCE_THRESHOLD_CLS) || 0.1,  // score
  FCP: Number(process.env.REACT_APP_PERFORMANCE_THRESHOLD_FCP) || 1800, // milliseconds
  TTFB: Number(process.env.REACT_APP_PERFORMANCE_THRESHOLD_TTFB) || 800 // milliseconds
};

// Send performance metrics to analytics and check for alerts
const sendToAnalytics = (metric) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      custom_map: {
        metric_id: metric.id,
        metric_value: metric.value,
        metric_delta: metric.delta
      }
    });
  }

  // Check for performance threshold violations and send alerts
  checkPerformanceThreshold(metric);

  // Also log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Web Vital:', metric);
  }
};

// Check if metric exceeds threshold and send alert
const checkPerformanceThreshold = (metric) => {
  const threshold = PERFORMANCE_THRESHOLDS[metric.name];
  if (!threshold) return;

  const isViolation = metric.value > threshold;

  if (isViolation) {
    const alertData = {
      metric: metric.name,
      value: metric.value,
      threshold: threshold,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      severity: calculateSeverity(metric.name, metric.value, threshold)
    };

    // Send alert to configured endpoints
    sendPerformanceAlert(alertData);
  }
};

// Calculate alert severity based on how much threshold is exceeded
const calculateSeverity = (metricName, value, threshold) => {
  const ratio = value / threshold;
  if (ratio > 2) return 'critical';
  if (ratio > 1.5) return 'high';
  if (ratio > 1.2) return 'medium';
  return 'low';
};

// Send performance alerts to configured endpoints
const sendPerformanceAlert = async (alertData) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const alertsEnabled = process.env.REACT_APP_PERFORMANCE_ALERTS_ENABLED === 'true';

  if (!isProduction || !alertsEnabled) return;

  // Send to Slack if webhook URL is configured
  const slackWebhook = process.env.REACT_APP_SLACK_WEBHOOK_URL;
  if (slackWebhook) {
    try {
      await fetch(slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 Performance Alert - ${alertData.severity.toUpperCase()}`,
          attachments: [{
            color: alertData.severity === 'critical' ? 'danger' : 'warning',
            fields: [
              { title: 'Metric', value: alertData.metric, short: true },
              { title: 'Value', value: `${alertData.value}ms`, short: true },
              { title: 'Threshold', value: `${alertData.threshold}ms`, short: true },
              { title: 'URL', value: alertData.url, short: false },
              { title: 'Time', value: alertData.timestamp, short: true }
            ]
          }]
        })
      });
    } catch (error) {
      console.error('Failed to send Slack alert:', error);
    }
  }

  // Send to email service if endpoint is configured
  const emailEndpoint = process.env.REACT_APP_ALERT_EMAIL_ENDPOINT;
  if (emailEndpoint) {
    try {
      await fetch(emailEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: `Performance Alert: ${alertData.metric} exceeded threshold`,
          severity: alertData.severity,
          data: alertData
        })
      });
    } catch (error) {
      console.error('Failed to send email alert:', error);
    }
  }

  // Send to Google Analytics as a custom event for tracking
  if (window.gtag) {
    window.gtag('event', 'performance_threshold_violation', {
      event_category: 'Performance Alerts',
      event_label: alertData.metric,
      value: Math.round(alertData.value),
      custom_map: {
        severity: alertData.severity,
        threshold: alertData.threshold
      }
    });
  }
};

// Track page load performance
export const trackPageLoadPerformance = () => {
  if (typeof window === 'undefined') return;

  window.addEventListener('load', () => {
    // Use Performance API to get detailed timing information
    if ('performance' in window && typeof performance.getEntriesByType === 'function') {
      const navigation = performance.getEntriesByType('navigation')[0];

      if (navigation) {
        const metrics = {
          dns: navigation.domainLookupEnd - navigation.domainLookupStart,
          tcp: navigation.connectEnd - navigation.connectStart,
          ttfb: navigation.responseStart - navigation.requestStart,
          download: navigation.responseEnd - navigation.responseStart,
          dom: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          load: navigation.loadEventEnd - navigation.loadEventStart,
          total: navigation.loadEventEnd - navigation.navigationStart
        };

        // Send to analytics
        if (window.gtag) {
          Object.entries(metrics).forEach(([key, value]) => {
            window.gtag('event', 'timing_complete', {
              event_category: 'Performance',
              event_label: key,
              value: Math.round(value)
            });
          });
        }

        // Log in development
        if (process.env.NODE_ENV === 'development') {
          console.table(metrics);
        }
      }
    }
  });
};

// Track bundle size and resource loading with bottleneck detection
export const trackResourceLoading = () => {
  if (typeof window === 'undefined') return;

  window.addEventListener('load', () => {
    if ('performance' in window && typeof performance.getEntriesByType === 'function') {
      const resources = performance.getEntriesByType('resource');

      const resourceMetrics = {
        totalResources: resources.length,
        jsResources: resources.filter(r => r.name.includes('.js')).length,
        cssResources: resources.filter(r => r.name.includes('.css')).length,
        imageResources: resources.filter(r =>
          r.name.includes('.jpg') ||
          r.name.includes('.png') ||
          r.name.includes('.webp') ||
          r.name.includes('.svg')
        ).length,
        totalTransferSize: resources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
        totalDecodedSize: resources.reduce((sum, r) => sum + (r.decodedBodySize || 0), 0)
      };

      // Detect resource loading bottlenecks
      detectResourceBottlenecks(resources);

      // Send resource metrics to analytics
      if (window.gtag) {
        Object.entries(resourceMetrics).forEach(([key, value]) => {
          window.gtag('event', 'resource_loading', {
            event_category: 'Performance',
            event_label: key,
            value: typeof value === 'number' ? Math.round(value) : value
          });
        });
      }

      // Log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Resource Metrics:', resourceMetrics);
      }
    }
  });
};

// Detect resource loading bottlenecks
const detectResourceBottlenecks = (resources) => {
  const RESOURCE_THRESHOLDS = {
    slowResource: 3000, // milliseconds
    largeResource: 1000000, // bytes (1MB)
    tooManyResources: 100
  };

  // Find slow-loading resources
  const slowResources = resources.filter(r => r.duration > RESOURCE_THRESHOLDS.slowResource);

  // Find large resources
  const largeResources = resources.filter(r =>
    (r.transferSize || 0) > RESOURCE_THRESHOLDS.largeResource
  );

  // Check total resource count
  const tooManyResources = resources.length > RESOURCE_THRESHOLDS.tooManyResources;

  // Send alerts for bottlenecks
  if (slowResources.length > 0) {
    slowResources.forEach(resource => {
      sendResourceAlert({
        type: 'slow_resource',
        resourceUrl: resource.name,
        duration: resource.duration,
        threshold: RESOURCE_THRESHOLDS.slowResource,
        severity: resource.duration > 5000 ? 'critical' : 'high'
      });
    });
  }

  if (largeResources.length > 0) {
    largeResources.forEach(resource => {
      sendResourceAlert({
        type: 'large_resource',
        resourceUrl: resource.name,
        size: resource.transferSize,
        threshold: RESOURCE_THRESHOLDS.largeResource,
        severity: resource.transferSize > 2000000 ? 'critical' : 'medium'
      });
    });
  }

  if (tooManyResources) {
    sendResourceAlert({
      type: 'too_many_resources',
      resourceCount: resources.length,
      threshold: RESOURCE_THRESHOLDS.tooManyResources,
      severity: 'medium'
    });
  }
};

// Send resource-specific alerts
const sendResourceAlert = async (alertData) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const alertsEnabled = process.env.REACT_APP_PERFORMANCE_ALERTS_ENABLED === 'true';

  if (!isProduction || !alertsEnabled) return;

  const fullAlertData = {
    ...alertData,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent
  };

  // Send to Slack
  const slackWebhook = process.env.REACT_APP_SLACK_WEBHOOK_URL;
  if (slackWebhook) {
    const message = formatResourceAlertForSlack(fullAlertData);
    try {
      await fetch(slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });
    } catch (error) {
      console.error('Failed to send resource alert to Slack:', error);
    }
  }

  // Track in analytics
  if (window.gtag) {
    window.gtag('event', 'resource_bottleneck', {
      event_category: 'Performance Bottlenecks',
      event_label: alertData.type,
      value: alertData.duration || alertData.size || alertData.resourceCount,
      custom_map: {
        severity: alertData.severity,
        resource_url: alertData.resourceUrl
      }
    });
  }
};

// Format resource alert for Slack
const formatResourceAlertForSlack = (alertData) => {
  const { type, severity, resourceUrl, duration, size, resourceCount, threshold } = alertData;

  let title, fields;

  switch (type) {
    case 'slow_resource':
      title = `🐌 Slow Resource Loading - ${severity.toUpperCase()}`;
      fields = [
        { title: 'Resource', value: resourceUrl, short: false },
        { title: 'Load Time', value: `${Math.round(duration)}ms`, short: true },
        { title: 'Threshold', value: `${threshold}ms`, short: true }
      ];
      break;
    case 'large_resource':
      title = `📦 Large Resource Detected - ${severity.toUpperCase()}`;
      fields = [
        { title: 'Resource', value: resourceUrl, short: false },
        { title: 'Size', value: `${Math.round(size / 1024)}KB`, short: true },
        { title: 'Threshold', value: `${Math.round(threshold / 1024)}KB`, short: true }
      ];
      break;
    case 'too_many_resources':
      title = `🔢 Too Many Resources - ${severity.toUpperCase()}`;
      fields = [
        { title: 'Resource Count', value: resourceCount.toString(), short: true },
        { title: 'Threshold', value: threshold.toString(), short: true }
      ];
      break;
    default:
      title = `⚠️ Resource Issue - ${severity.toUpperCase()}`;
      fields = [];
  }

  return {
    text: title,
    attachments: [{
      color: severity === 'critical' ? 'danger' : 'warning',
      fields: [
        ...fields,
        { title: 'URL', value: alertData.url, short: false },
        { title: 'Time', value: alertData.timestamp, short: true }
      ]
    }]
  };
};

// Initialize all performance tracking
export const initPerformanceMonitoring = () => {
  trackWebVitals();
  trackPageLoadPerformance();
  trackResourceLoading();
};