/**
 * Welcome Page Analytics
 * Uses unified MonkeyBlockAnalytics library
 */

(async function() {
  // Initialize analytics
  const analytics = new MonkeyBlockAnalytics({
    platform: 'welcome'
  });
  
  await analytics.initialize();
  
  // Parse URL parameters for attribution
  const urlParams = new URLSearchParams(window.location.search);
  
  // Check if we have attribution from URL
  const urlAttribution = {
    userId: urlParams.get('uid'),
    deviceId: urlParams.get('did') || urlParams.get('fp'),
    utm: {
      utm_source: urlParams.get('utm_source'),
      utm_medium: urlParams.get('utm_medium'),
      utm_campaign: urlParams.get('utm_campaign'),
      utm_content: urlParams.get('utm_content'),
      utm_term: urlParams.get('utm_term')
    },
    referrer: urlParams.get('ref'),
    fromExtension: urlParams.get('ext') === '1'
  };
  
  // Clean up empty UTM values
  Object.keys(urlAttribution.utm).forEach(key => {
    if (!urlAttribution.utm[key]) delete urlAttribution.utm[key];
  });
  
  // Set user ID if provided
  if (urlAttribution.userId) {
    await analytics.setUserId(urlAttribution.userId);
  }
  
  // Set attribution if we have UTM data
  if (Object.keys(urlAttribution.utm).length > 0 || urlAttribution.referrer) {
    await analytics.setAttribution({
      utm: urlAttribution.utm,
      referrer: urlAttribution.referrer
    });
  }
  
  // Track welcome page view
  analytics.track('Welcome Page Viewed', {
    from_extension: urlAttribution.fromExtension,
    has_attribution: Object.keys(urlAttribution.utm).length > 0,
    extension_id: urlParams.get('ext_id'),
    version: urlParams.get('v')
  });
  
  // Track tutorial interactions
  document.addEventListener('click', (e) => {
    // Track tutorial step clicks
    if (e.target.matches('[data-tutorial-step]')) {
      analytics.track('Tutorial Step Clicked', {
        step: e.target.dataset.tutorialStep,
        step_text: e.target.textContent
      });
    }
    
    // Track "Get Started" button
    if (e.target.matches('[data-action="get-started"]')) {
      analytics.track('Welcome Get Started Clicked', {
        time_on_page: Math.round((Date.now() - performance.timing.navigationStart) / 1000)
      });
    }
  });
  
  // Track time on welcome page
  window.addEventListener('beforeunload', () => {
    analytics.track('Welcome Page Exit', {
      time_on_page: Math.round((Date.now() - performance.timing.navigationStart) / 1000)
    });
  });
  
  // Expose for debugging
  window.mbAnalytics = analytics;
  
})();
