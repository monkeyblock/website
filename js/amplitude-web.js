/**
 * MonkeyBlock Website Tracking
 * Handles attribution tracking and user ID generation for cross-platform analytics
 */

class MonkeyBlockWebTracker {
  constructor() {
    this.apiKey = 'ad0a670d36f60cd419802ccfb5252139';
    this.serverUrl = 'https://api.eu.amplitude.com';
    this.extensionId = 'ggccjkdgmlclpigflghjjkgeblgdgffe'; // MonkeyBlock Chrome Extension ID
    
    // Generate or retrieve IDs
    this.userId = this.getOrCreateUserId();
    this.deviceId = this.generateFingerprint();
    this.sessionId = this.generateSessionId();
    
    // Wait for Amplitude SDK to be fully loaded
    this.waitForAmplitude();
  }
  
  waitForAmplitude() {
    let attempts = 0;
    const checkAmplitude = () => {
      attempts++;
      if (typeof amplitude !== 'undefined' && amplitude.init) {
        console.log('[MB Tracker] Amplitude SDK detected after', attempts, 'attempts');
        // Initialize tracking
        this.initAmplitude();
        setTimeout(() => {
          this.trackLandingVisit();
          this.setupEventListeners();
        }, 500); // Small delay to ensure initialization
      } else if (attempts < 50) { // Try for 5 seconds
        setTimeout(checkAmplitude, 100);
      } else {
        console.error('[MB Tracker] Amplitude SDK failed to load after 5 seconds');
      }
    };
    checkAmplitude();
  }
  
  getOrCreateUserId() {
    // Check multiple storage locations for resilience
    let userId = localStorage.getItem('mb_user_id') ||
                 sessionStorage.getItem('mb_user_id') ||
                 this.getCookie('mb_user_id');
    
    if (!userId) {
      // Generate new User ID with 'web' prefix for source identification
      userId = `user_web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store in multiple locations
      this.persistUserId(userId);
      
      console.log('[MB Tracker] Generated new user ID:', userId);
    } else {
      console.log('[MB Tracker] Retrieved existing user ID:', userId);
    }
    
    return userId;
  }
  
  persistUserId(userId) {
    // localStorage - survives browser restart
    try {
      localStorage.setItem('mb_user_id', userId);
    } catch (e) {
      console.warn('[MB Tracker] Could not save to localStorage:', e);
    }
    
    // sessionStorage - survives page reload
    try {
      sessionStorage.setItem('mb_user_id', userId);
    } catch (e) {
      console.warn('[MB Tracker] Could not save to sessionStorage:', e);
    }
    
    // Cookie - cross-subdomain if needed
    this.setCookie('mb_user_id', userId, 365);
  }
  
  generateFingerprint() {
    // Same logic as extension for consistency
    const components = {
      screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      cores: navigator.hardwareConcurrency || 'unknown',
      memory: navigator.deviceMemory || 'unknown',
      pixelRatio: window.devicePixelRatio || 1,
      plugins: navigator.plugins.length,
      doNotTrack: navigator.doNotTrack || 'unknown'
    };
    
    // Generate hash from components
    const raw = JSON.stringify(components);
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    const fingerprint = `fp_${Math.abs(hash).toString(36)}`;
    console.log('[MB Tracker] Generated fingerprint:', fingerprint);
    return fingerprint;
  }
  
  generateSessionId() {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  getUTMParameters() {
    const params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get('utm_source') || 'direct',
      utm_medium: params.get('utm_medium') || 'none',
      utm_campaign: params.get('utm_campaign') || 'none',
      utm_content: params.get('utm_content') || '',
      utm_term: params.get('utm_term') || '',
      // Also capture click IDs for better attribution
      gclid: params.get('gclid') || '',
      fbclid: params.get('fbclid') || '',
      ttclid: params.get('ttclid') || ''
    };
  }
  
  initAmplitude() {
    // Check if Amplitude SDK is loaded
    if (typeof amplitude === 'undefined') {
      console.error('[MB Tracker] Amplitude SDK not loaded! Retrying in 1 second...');
      setTimeout(() => this.initAmplitude(), 1000);
      return;
    }
    
    // Initialize Amplitude with our IDs  
    try {
      amplitude.init(this.apiKey, this.userId, {
        serverUrl: this.serverUrl,
        deviceId: this.deviceId,
        sessionId: this.sessionId,
        includeReferrer: true,
        includeUtm: true,
        includeFbclid: true,
        includeGclid: true,
        trackingOptions: {
          ipAddress: true,
          language: true,
          platform: true
        },
        logLevel: 'VERBOSE' // Add verbose logging for debugging
      });
      
      // Set user properties
      amplitude.setUserProperties({
        source_platform: 'website',
        landing_fingerprint: this.deviceId,
        initial_landing: new Date().toISOString(),
        page_language: document.documentElement.lang || 'en'
      });
      
      console.log('[MB Tracker] ✅ Amplitude initialized successfully with User ID:', this.userId);
      
      // Test event to confirm it's working
      amplitude.logEvent('Amplitude Test Event', {
        test: true,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('[MB Tracker] Failed to initialize Amplitude:', error);
    }
  }
  
  trackLandingVisit() {
    const utm = this.getUTMParameters();
    
    // Use logEvent instead of track (older SDK compatibility)
    const eventName = 'Landing Page Visit';
    const eventProps = {
      ...utm,
      page_url: window.location.href,
      page_title: document.title,
      referrer: document.referrer,
      fingerprint: this.deviceId,
      user_id_generated: this.userId.includes('_web_'),
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      screen_width: screen.width,
      screen_height: screen.height,
      timestamp: new Date().toISOString()
    };
    
    // Try both methods for compatibility
    if (amplitude.logEvent) {
      amplitude.logEvent(eventName, eventProps);
      console.log('[MB Tracker] ✅ Landing visit tracked with logEvent');
    } else if (amplitude.logEvent) {
      amplitude.logEvent(eventName, eventProps);
      console.log('[MB Tracker] ✅ Landing visit tracked with track');
    } else {
      console.error('[MB Tracker] ❌ No tracking method available');
    }
    
    // Store attribution data for later retrieval
    this.storeAttributionData(utm);
    
    console.log('[MB Tracker] Landing visit tracked with UTM:', utm);
  }
  
  storeAttributionData(utm) {
    const attributionData = {
      ...utm,
      landing_time: Date.now(),
      user_id: this.userId,
      device_id: this.deviceId,
      fingerprint: this.deviceId,
      referrer: document.referrer,
      landing_page: window.location.pathname
    };
    
    // Store in multiple locations
    try {
      localStorage.setItem('mb_attribution', JSON.stringify(attributionData));
      sessionStorage.setItem('mb_attribution', JSON.stringify(attributionData));
    } catch (e) {
      console.warn('[MB Tracker] Could not store attribution:', e);
    }
    
    // Store fingerprint mapping for recovery
    try {
      localStorage.setItem(`fp_${this.deviceId}`, JSON.stringify({
        user_id: this.userId,
        utm: utm,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.warn('[MB Tracker] Could not store fingerprint mapping:', e);
    }
  }
  
  setupEventListeners() {
    // Track install button clicks
    document.querySelectorAll('[data-track="install"]').forEach(button => {
      button.addEventListener('click', (e) => {
        // Don't prevent default - let the link work normally
        this.handleInstallClick(button);
      });
    });
    
    // Track scroll depth
    this.trackScrollDepth();
    
    // Track time on page
    this.trackTimeOnPage();
    
    // Track page visibility changes
    this.trackPageVisibility();
  }
  
  handleInstallClick(button) {
    const utm = this.getUTMParameters();
    const buttonText = button.textContent || button.innerText || 'Unknown';
    const buttonLocation = button.dataset.location || 'unknown';
    
    // Calculate time on page
    const timeOnPage = Math.round((Date.now() - performance.timing.navigationStart) / 1000);
    
    // Track click event
    amplitude.logEvent('Install Button Clicked', {
      ...utm,
      button_text: buttonText,
      button_location: buttonLocation,
      time_on_page: timeOnPage,
      scroll_depth: this.maxScrollDepth || 0,
      page_section: this.getCurrentSection(),
      timestamp: new Date().toISOString()
    });
    
    // Mark install intent
    try {
      localStorage.setItem('mb_install_intent', JSON.stringify({
        timestamp: Date.now(),
        user_id: this.userId,
        utm: utm,
        button_location: buttonLocation
      }));
    } catch (e) {
      console.warn('[MB Tracker] Could not store install intent:', e);
    }
    
    console.log('[MB Tracker] Install click tracked:', buttonLocation);
  }
  
  buildChromeStoreUrl(utm) {
    let url = `https://chrome.google.com/webstore/detail/${this.extensionId}`;
    
    // Add GA UTM parameters for Chrome Store Analytics
    const params = new URLSearchParams({
      utm_source: utm.utm_source || 'website',
      utm_medium: utm.utm_medium || 'referral',
      utm_campaign: utm.utm_campaign || 'install'
    });
    
    // Only add non-empty UTM parameters
    if (utm.utm_content) params.append('utm_content', utm.utm_content);
    if (utm.utm_term) params.append('utm_term', utm.utm_term);
    
    return `${url}?${params.toString()}`;
  }
  
  trackScrollDepth() {
    this.maxScrollDepth = 0;
    let ticking = false;
    
    const updateScrollDepth = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = window.scrollY;
      const scrollDepth = Math.round((scrolled / scrollHeight) * 100);
      
      if (scrollDepth > this.maxScrollDepth) {
        this.maxScrollDepth = scrollDepth;
        
        // Track milestone scroll depths
        if ([25, 50, 75, 90, 100].includes(scrollDepth)) {
          amplitude.logEvent('Scroll Depth Reached', {
            depth: scrollDepth,
            timestamp: new Date().toISOString()
          });
        }
      }
      
      ticking = false;
    };
    
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDepth);
        ticking = true;
      }
    });
  }
  
  trackTimeOnPage() {
    const startTime = Date.now();
    
    // Track time milestones
    const milestones = [10, 30, 60, 120, 300]; // seconds
    milestones.forEach(seconds => {
      setTimeout(() => {
        if (document.visibilityState === 'visible') {
          amplitude.logEvent('Time on Page Milestone', {
            seconds: seconds,
            timestamp: new Date().toISOString()
          });
        }
      }, seconds * 1000);
    });
    
    // Track on page unload
    window.addEventListener('beforeunload', () => {
      const timeOnPage = Math.round((Date.now() - startTime) / 1000);
      amplitude.logEvent('Page Exit', {
        time_on_page: timeOnPage,
        scroll_depth: this.maxScrollDepth || 0,
        timestamp: new Date().toISOString()
      });
    });
  }
  
  trackPageVisibility() {
    let hiddenTime = 0;
    let lastHiddenTimestamp = null;
    
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        lastHiddenTimestamp = Date.now();
      } else if (lastHiddenTimestamp) {
        hiddenTime += Date.now() - lastHiddenTimestamp;
        lastHiddenTimestamp = null;
        
        amplitude.logEvent('Page Visibility Changed', {
          state: 'visible',
          total_hidden_time: Math.round(hiddenTime / 1000),
          timestamp: new Date().toISOString()
        });
      }
    });
  }
  
  getCurrentSection() {
    // Try to determine which section of the page the user is viewing
    const sections = document.querySelectorAll('[data-section]');
    const scrollPosition = window.scrollY + window.innerHeight / 2;
    
    for (let section of sections) {
      const rect = section.getBoundingClientRect();
      const absoluteTop = rect.top + window.scrollY;
      const absoluteBottom = absoluteTop + rect.height;
      
      if (scrollPosition >= absoluteTop && scrollPosition <= absoluteBottom) {
        return section.dataset.section;
      }
    }
    
    return 'unknown';
  }
  
  // Utility functions
  setCookie(name, value, days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  }
  
  getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.mbTracker = new MonkeyBlockWebTracker();
  });
} else {
  // DOM already loaded
  window.mbTracker = new MonkeyBlockWebTracker();
}
