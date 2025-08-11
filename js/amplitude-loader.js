/**
 * Simplified Amplitude SDK Loader for MonkeyBlock
 * This ensures Amplitude SDK loads correctly without integrity issues
 */

(function() {
  // Check if already loaded
  if (window.amplitude && window.amplitude.getInstance) {
    console.log('[Amplitude Loader] SDK already loaded');
    return;
  }

  // Create script element for Amplitude SDK
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.async = true;
  script.src = 'https://cdn.amplitude.com/libs/analytics-browser-2.3.5-min.js.gz';
  
  script.onload = function() {
    console.log('[Amplitude Loader] SDK loaded successfully');
    
    // Initialize once loaded
    if (window.mbTracker && !window.mbTracker.initialized) {
      window.mbTracker.initAmplitude();
    }
  };
  
  script.onerror = function() {
    console.error('[Amplitude Loader] Failed to load SDK');
    
    // Try fallback URL without gzip
    const fallbackScript = document.createElement('script');
    fallbackScript.type = 'text/javascript';
    fallbackScript.async = true;
    fallbackScript.src = 'https://cdn.amplitude.com/libs/analytics-browser-2.3.5-min.js';
    
    fallbackScript.onload = function() {
      console.log('[Amplitude Loader] Fallback SDK loaded successfully');
      if (window.mbTracker && !window.mbTracker.initialized) {
        window.mbTracker.initAmplitude();
      }
    };
    
    fallbackScript.onerror = function() {
      console.error('[Amplitude Loader] All SDK loading attempts failed');
    };
    
    document.head.appendChild(fallbackScript);
  };
  
  // Insert script into page
  document.head.appendChild(script);
})();
