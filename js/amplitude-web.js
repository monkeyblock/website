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
    // Browser fingerprinting for device ID
    const components = {
      screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      cores: navigator.hardwareConcurrency || 'unknown',
      memory: navigator.deviceMemory || 'unknown',
      pixelRatio: window.devicePixelRatio || 1
    };
    
    // Simple hash function
    const rawString = JSON.stringify(components);    let hash = 0;
    for (let i = 0; i < rawString.length; i++) {
      const char = rawString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    const fingerprint = `fp_${Math.abs(hash).toString(36)}`;
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
      
    } catch (error) {
      console.error('[MB Tracker] Failed to initialize Amplitude:', error);      // Retry in a moment
      setTimeout(() => this.initializeWhenReady(), 1000);
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
      utm_medium: params.get('utm_medium') || 'none',      utm_campaign: params.get('utm_campaign') || 'none',
      utm_content: params.get('utm_content') || '',
      utm_term: params.get('utm_term') || '',
      gclid: params.get('gclid') || '',
      fbclid: params.get('fbclid') || ''
    };
  }
  
  setupEventListeners() {
    // Track install button clicks
    document.querySelectorAll('[data-track="install"]').forEach(button => {
      button.addEventListener('click', () => {
        this.trackInstallClick(button);
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
    
    const buttonText = button.textContent || 'Unknown';    const buttonLocation = button.dataset.location || 'unknown';
    
    this.amplitude.track('Install Button Clicked', {
      button_text: buttonText,
      button_location: buttonLocation,
      page_section: this.getCurrentSection(),
      time_on_page: Math.round((Date.now() - this.pageLoadTime) / 1000)
    });
    
    console.log('[MB Tracker] Install click tracked:', buttonLocation);
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
        
        // Track milestone scroll depths        if ([25, 50, 75, 100].includes(scrollDepth) && this.amplitude) {
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
