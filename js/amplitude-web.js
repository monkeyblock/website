/**
 * MonkeyBlock Website Analytics
 * Using Amplitude Browser SDK v2
 * Documentation: https://www.docs.developers.amplitude.com/data/sdks/browser-2/
 */

class MonkeyBlockWebTracker {
  constructor() {
    this.apiKey = 'ad0a670d36f60cd419802ccfb5252139';
    this.extensionId = 'ggccjkdgmlclpigflghjjkgeblgdgffe';
    this.initialized = false;
    this.amplitude = null;
    
    // Generate or retrieve IDs
    this.userId = this.getOrCreateUserId();
    this.deviceId = this.generateFingerprint();
    
    // Initialize tracking once SDK is available
    this.initializeWhenReady();
  }
  
  initializeWhenReady() {
    // Check if Amplitude SDK is already loaded
    if (typeof window.amplitude !== 'undefined' && window.amplitude.init) {
      console.log('[MB Tracker] Amplitude SDK detected, initializing...');
      this.initAmplitude();
    } else {
      console.log('[MB Tracker] Waiting for Amplitude SDK...');
      // Wait and retry
      setTimeout(() => this.initializeWhenReady(), 500);
    }
  }  
  getOrCreateUserId() {
    // Check storage for existing user ID
    let userId = localStorage.getItem('mb_user_id');
    
    if (!userId) {
      // Generate new user ID
      userId = `user_web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('mb_user_id', userId);
      console.log('[MB Tracker] Generated new user ID:', userId);
    } else {
      console.log('[MB Tracker] Retrieved existing user ID:', userId);
    }
    
    return userId;
  }
  
  generateFingerprint() {
    // Use unified fingerprint generator
    if (typeof FingerprintGenerator !== 'undefined') {
      return FingerprintGenerator.generate();
    }
    
    // Fallback to inline implementation if shared module not loaded
    console.warn('[MB Tracker] FingerprintGenerator not found, using fallback');
    const components = {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      languages: navigator.languages ? navigator.languages.join(',') : navigator.language,
      hardwareConcurrency: navigator.hardwareConcurrency || 4
    };
    
    const fingerprintString = JSON.stringify(components);
    let hash1 = 0, hash2 = 5381;
    
    for (let i = 0; i < fingerprintString.length; i++) {
      const char = fingerprintString.charCodeAt(i);
      hash1 = ((hash1 << 5) - hash1) + char;
      hash2 = ((hash2 << 5) + hash2) + char;
    }
    
    const fingerprint = `fp_${Math.abs(hash1).toString(36)}_${Math.abs(hash2).toString(36)}`;
    console.log('[MB Tracker] Generated fingerprint:', fingerprint);
    return fingerprint;
  }
  
  async initAmplitude() {
    if (this.initialized) return;
    
    try {
      // Use the default instance that was created by the snippet
      this.amplitude = window.amplitude.getInstance();
      
      // Initialize with configuration
      await this.amplitude.init(this.apiKey, this.userId, {
        deviceId: this.deviceId,
        serverUrl: 'https://api.eu.amplitude.com/2/httpapi',
        defaultTracking: {
          sessions: true,
          pageViews: true,
          formInteractions: false,
          fileDownloads: false
        },
        flushIntervalMillis: 1000,        flushQueueSize: 30,
        flushMaxRetries: 5,
        logLevel: window.location.hostname === 'localhost' ? 'Verbose' : 'None',
        minIdLength: 5,
        saveEvents: true,
        optOut: false,
        serverZone: 'EU',
        useBatch: true
      }).promise;
      
      console.log('[MB Tracker] ✅ Amplitude initialized successfully');
      this.initialized = true;
      
      // Set user properties
      this.amplitude.setUserProperties({
        source_platform: 'website',
        landing_fingerprint: this.deviceId,
        initial_landing: new Date().toISOString(),
        browser: navigator.userAgent,
        language: navigator.language,
        screen_resolution: `${screen.width}x${screen.height}`,
        viewport_size: `${window.innerWidth}x${window.innerHeight}`
      });
      
      // Track initial landing
      this.trackLandingVisit();
      this.setupEventListeners();
      this.storeInitialAttribution();
      
    } catch (error) {
      console.error('[MB Tracker] Failed to initialize Amplitude:', error);
      // Retry in a moment
      setTimeout(() => this.initializeWhenReady(), 1000);
    }
  }
  
  storeInitialAttribution() {
    // Store attribution data immediately on landing for later use
    const utm = this.getUTMParameters();
    const hasUTM = Object.values(utm).some(v => v && v !== 'direct' && v !== 'none' && v !== '');
    
    if (hasUTM || document.referrer) {
      const landingAttribution = {
        userId: this.userId,
        deviceId: this.deviceId,
        fingerprint: this.deviceId,
        utm: utm,
        referrer: document.referrer,
        landing_url: window.location.href,
        landing_time: new Date().toISOString(),
        timestamp: Date.now()
      };
      
      try {
        localStorage.setItem('mb_landing_attribution', JSON.stringify(landingAttribution));
        console.log('[MB Tracker] Landing attribution stored:', landingAttribution);
      } catch (error) {
        console.error('[MB Tracker] Failed to store landing attribution:', error);
      }
    }
  }
  
  trackLandingVisit() {
    if (!this.amplitude) {
      console.warn('[MB Tracker] Cannot track landing - Amplitude not initialized');
      return;
    }
    
    const utm = this.getUTMParameters();
    
    this.amplitude.track('Landing Page Visit', {
      ...utm,
      page_url: window.location.href,
      page_title: document.title,
      referrer: document.referrer,
      fingerprint: this.deviceId,
      timestamp: new Date().toISOString()
    });
    
    console.log('[MB Tracker] Landing visit tracked');
  }
  
  getUTMParameters() {
    const params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get('utm_source') || 'direct',
      utm_medium: params.get('utm_medium') || 'none',
      utm_campaign: params.get('utm_campaign') || 'none',
      utm_content: params.get('utm_content') || '',
      utm_term: params.get('utm_term') || '',
      gclid: params.get('gclid') || '',
      fbclid: params.get('fbclid') || ''
    };
  }
  
  setupEventListeners() {
    // Track install button clicks with capture phase for early execution
    document.querySelectorAll('[data-track="install"]').forEach(button => {
      // Use mousedown for immediate execution before navigation
      button.addEventListener('mousedown', (e) => {
        console.log('[MB Tracker] Install button mousedown detected');
        this.trackInstallClick(button);
      });
      
      // Also keep click as backup
      button.addEventListener('click', (e) => {
        console.log('[MB Tracker] Install button click detected');
        // Check if attribution was already stored
        if (!localStorage.getItem('mb_pre_install_attribution')) {
          this.trackInstallClick(button);
        }
      });
    });
    
    // Track scroll depth
    this.trackScrollDepth();
    
    // Track time on page
    this.trackTimeOnPage();
  }
  
  trackInstallClick(button) {
    if (!this.amplitude) {
      console.warn('[MB Tracker] Cannot track install click - Amplitude not initialized');
      return;
    }
    
    const buttonText = button.textContent || 'Unknown';
    const buttonLocation = button.dataset.location || 'unknown';
    
    // Prepare attribution data BEFORE redirect
    const attributionData = {
      userId: this.userId,
      deviceId: this.deviceId,
      fingerprint: this.deviceId, // Same as device ID
      utm: this.getUTMParameters(),
      referrer: document.referrer,
      landing_page: window.location.pathname,
      button_location: buttonLocation,
      timestamp: Date.now(),
      source_platform: 'website'
    };
    
    // Store attribution data in multiple places for redundancy
    try {
      // 1. LocalStorage (primary) - SYNCHRONOUS
      localStorage.setItem('mb_pre_install_attribution', JSON.stringify(attributionData));
      localStorage.setItem('mb_attribution_timestamp', Date.now().toString());
      
      // 2. Cookie backup (for cross-subdomain access) - SYNCHRONOUS
      const cookieData = btoa(JSON.stringify({
        uid: this.userId,
        did: this.deviceId,
        utm: attributionData.utm.utm_source // Simplified for cookie size
      }));
      document.cookie = `mb_attr=${cookieData}; max-age=2592000; domain=.monkey-block.com; path=/`;
      
      console.log('[MB Tracker] Attribution data stored successfully');
      
      // 3. Track the event (this can be async)
      if (this.amplitude) {
        this.amplitude.track('Install Intent', {
          ...attributionData,
          button_text: buttonText,
          page_section: this.getCurrentSection(),
          time_on_page: Math.round((Date.now() - this.pageLoadTime) / 1000),
          will_redirect_to: 'chrome_store'
        });
      }
      
    } catch (error) {
      console.error('[MB Tracker] Failed to store attribution:', error);
    }
    
    console.log('[MB Tracker] Install click processing complete');
  }
  
  trackScrollDepth() {
    this.maxScrollDepth = 0;
    let ticking = false;
    
    const updateScrollDepth = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) {
        ticking = false;
        return;
      }
      
      const scrolled = window.scrollY;
      const scrollDepth = Math.round((scrolled / scrollHeight) * 100);
      
      if (scrollDepth > this.maxScrollDepth) {
        this.maxScrollDepth = scrollDepth;
        
        // Track milestone scroll depths
        if ([25, 50, 75, 100].includes(scrollDepth) && this.amplitude) {
          this.amplitude.track('Scroll Depth Reached', {
            depth: scrollDepth,
            time_on_page: Math.round((Date.now() - this.pageLoadTime) / 1000)
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
    this.pageLoadTime = Date.now();
    
    // Track time milestones
    const milestones = [10, 30, 60, 120, 300]; // seconds
    milestones.forEach(seconds => {
      setTimeout(() => {
        if (document.visibilityState === 'visible' && this.amplitude) {
          this.amplitude.track('Time on Page Milestone', {
            seconds: seconds,
            scroll_depth: this.maxScrollDepth || 0
          });        }
      }, seconds * 1000);
    });
    
    // Track on page unload
    window.addEventListener('beforeunload', () => {
      if (this.amplitude) {
        const timeOnPage = Math.round((Date.now() - this.pageLoadTime) / 1000);
        this.amplitude.track('Page Exit', {
          time_on_page: timeOnPage,
          scroll_depth: this.maxScrollDepth || 0
        });
        // Force flush events before page unload
        this.amplitude.flush();
      }
    });
  }
  
  getCurrentSection() {
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
  
  // Public method for manual event tracking
  track(eventName, eventProperties) {
    if (this.amplitude) {
      this.amplitude.track(eventName, eventProperties);
      return true;
    }
    console.warn('[MB Tracker] Cannot track event - Amplitude not initialized');
    return false;
  }
  
  // Public method to get Amplitude instance
  getAmplitudeInstance() {
    return this.amplitude;
  }
  
  // Public method to check if initialized
  isReady() {
    return this.initialized && this.amplitude !== null;
  }
}

// Initialize tracker when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.mbTracker = new MonkeyBlockWebTracker();
  });
} else {
  window.mbTracker = new MonkeyBlockWebTracker();
}
