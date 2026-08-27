import { getEntrySource } from '../util/analytics/entrySource';
import { getOrCreateSessionId } from '../util/sentimentCapture';

export class LoggingAnalyticsHandler {
  trackPageView(url) {
    console.log('Analytics page view:', url); // eslint-disable-line no-console
  }
}

// Google Analytics 4 (GA4) using gtag.js script, which is included in util/includeScripts.js
export class GoogleAnalyticsHandler {
  trackPageView(canonicalPath, previousPath) {
    // GA4 property. Manually send page_view events
    // https://developers.google.com/analytics/devguides/collection/gtagjs/single-page-applications
    // Note 1: You should turn "Enhanced measurement" off.
    //         It attaches own listeners to elements and that breaks in-app navigation.
    // Note 2: If previousPath is null (just after page load), gtag script sends page_view event automatically.
    //         Only in-app navigation needs to be sent manually from SPA. That first, automatic
    //         page_view still carries entry_source — it's set at the gtag('config', ...) call
    //         in util/includeScripts.js, since config-level params apply to every subsequent
    //         auto-collected event too.
    // Note 3: Timeout is needed because gtag script picks up <title>,
    //         and location change event happens before initial rendering.
    if (previousPath && window.gtag) {
      window.setTimeout(() => {
        window.gtag('event', 'page_view', {
          page_path: canonicalPath,
          entry_source: getEntrySource(),
          // GA4 reserves `session_id`/`ga_session_id` — see brandClickout.js — so the app's
          // own session id (shared with sentiment capture + brand_clickout) rides under this
          // unambiguously non-reserved key instead, for entry_source grouping in GA4 reports.
          mela_session_id: getOrCreateSessionId(),
        });
      }, 300);
    }
  }
}
