/**
 * MonkeyBlock Website Analytics - Migrated Version
 * Uses the unified MonkeyBlockAnalytics library
 */

// Wait for DOM and analytics library to be ready
(async function() {
  // Initialize analytics
  const analytics = new MonkeyBlockAnalytics({
    platform: 'website'
  });
  
  await analytics.initialize();
  
  // Store initial attribution on landing
  const storeInitialAttribution = () => {
    const attribution = {
      utm: getUTMParameters(),
      referrer: document.referrer,
      landing_page: window.location.pathname,
      landing_time: Date.now(),
      source_platform: 'website'
    };
    
    localStorage.setItem('mb_landing_attribution', JSON.stringify(attribution));
    analytics.setAttribution(attribution);
  };
  
  // Get UTM parameters from URL
  function getUTMParameters() {
    const params = new URLSearchParams(window.location.search);
    const utm = {};
    
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(param => {
      const value = params.get(param);
      if (value) utm[param] = value;
    });
    
    return Object.keys(utm).length > 0 ? utm : null;
  }
  
  // Track page view
  analytics.track('Page Viewed', {
    page_title: document.title,
    page_url: window.location.href,
    page_path: window.location.pathname
  });
  
  // Store attribution on first visit
  if (!localStorage.getItem('mb_landing_attribution')) {
    storeInitialAttribution();
  }
  
  // Track install button clicks
  const trackInstallClick = (button) => {
    const buttonLocation = button.dataset.location || 'unknown';
    
    // Prepare attribution data for handoff
    const attributionData = {
      userId: analytics.userId,
      deviceId: analytics.deviceId,
      fingerprint: analytics.deviceId,
      utm: getUTMParameters(),
      referrer: document.referrer,
      landing_page: window.location.pathname,
      button_location: buttonLocation,
      timestamp: Date.now(),
      source_platform: 'website'
    };
    
    // Store for extension pickup
    localStorage.setItem('mb_pre_install_attribution', JSON.stringify(attributionData));
    
    // Cookie backup
    const cookieData = btoa(JSON.stringify({
      uid: analytics.userId,
      did: analytics.deviceId,
      utm: attributionData.utm?.utm_source
    }));
    document.cookie = `mb_attr=${cookieData}; max-age=2592000; domain=.monkey-block.com; path=/`;
    
    // Track event
    analytics.track('Install Intent', {
      button_location: buttonLocation,
      button_text: button.textContent || 'Unknown',
      time_on_page: Math.round((Date.now() - performance.timing.navigationStart) / 1000)
    });
  };
  
  // Set up install button tracking
  const setupInstallButtons = () => {
    // Track mousedown for early attribution storage
    document.addEventListener('mousedown', (e) => {
      const button = e.target.closest('.install-button, [data-install-button]');
      if (button && e.button === 0) {
        trackInstallClick(button);
      }
    });
    
    // Track actual clicks
    document.addEventListener('click', (e) => {
      const button = e.target.closest('.install-button, [data-install-button]');
      if (button) {
        // Attribution already stored on mousedown
        // Just log for debugging
        console.log('[MB Analytics] Install button clicked');
      }
    });
  };
  
  // Track scroll depth
  let maxScrollDepth = 0;
  const trackScrollDepth = () => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollHeight <= 0) return;
    
    const scrolled = window.scrollY;
    const scrollDepth = Math.round((scrolled / scrollHeight) * 100);
    
    if (scrollDepth > maxScrollDepth) {
      maxScrollDepth = scrollDepth;
      
      // Track milestone depths
      if ([25, 50, 75, 100].includes(scrollDepth)) {
        analytics.track('Scroll Depth Reached', {
          depth: scrollDepth,
          time_on_page: Math.round((Date.now() - performance.timing.navigationStart) / 1000)
        });
      }
    }
  };
  
  // Set up scroll tracking
  let scrollTimer;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(trackScrollDepth, 100);
  });
  
  // Track page exit
  window.addEventListener('beforeunload', () => {
    analytics.track('Page Exit', {
      time_on_page: Math.round((Date.now() - performance.timing.navigationStart) / 1000),
      scroll_depth: maxScrollDepth
    });
  });
  
  // Initialize everything
  setupInstallButtons();
  
  // Expose analytics instance globally for debugging
  window.mbAnalytics = analytics;
  
})();
