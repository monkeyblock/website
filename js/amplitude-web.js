/**
 * MonkeyBlock Website Analytics
 * Simplified tracking using modern Amplitude SDK
 */

class MonkeyBlockWebTracker {
  constructor() {
    this.apiKey = 'ad0a670d36f60cd419802ccfb5252139';
    this.serverUrl = 'https://api.eu.amplitude.com';
    this.extensionId = 'ggccjkdgmlclpigflghjjkgeblgdgffe';
    this.initialized = false;
    
    // Generate or retrieve IDs
    this.userId = this.getOrCreateUserId();
    this.deviceId = this.generateFingerprint();
    
    // Initialize tracking once SDK is available
    this.initializeWhenReady();
  }
  
  initializeWhenReady() {
    // Check if Amplitude SDK is already loaded
    if (window.amplitude && window.amplitude.track) {
      this.initAmplitude();
    } else {
      // Wait and retry
      setTimeout(() => this.initializeWhenReady(), 500);
    }
  }
  
  getOrCreateUserId() {    // Check storage for existing user ID
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
    
    // Simple hash function    const raw = JSON.stringify(components);
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
  
  initAmplitude() {
    if (this.initialized) return;
    
    try {
      // Use modern Amplitude SDK initialization
      window.amplitude.init(this.apiKey, {
        userId: this.userId,
        deviceId: this.deviceId,
        serverUrl: this.serverUrl,
        defaultTracking: {
          sessions: true,
          pageViews: true,
          formInteractions: true,
          fileDownloads: false
        }
      });
            
      // Set user properties
      window.amplitude.setUserProperties({
        source_platform: 'website',
        landing_fingerprint: this.deviceId,
        initial_landing: new Date().toISOString()
      });
      
      this.initialized = true;
      console.log('[MB Tracker] ✅ Amplitude initialized successfully');
      
      // Track initial landing
      this.trackLandingVisit();
      this.setupEventListeners();
      
    } catch (error) {
      console.error('[MB Tracker] Failed to initialize Amplitude:', error);
    }
  }
  
  trackLandingVisit() {
    const utm = this.getUTMParameters();
    
    window.amplitude.track('Landing Page Visit', {
      ...utm,
      page_url: window.location.href,
      page_title: document.title,
      referrer: document.referrer,
      fingerprint: this.deviceId
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
      utm_term: params.get('utm_term') || ''
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
  }
  
  trackInstallClick(button) {
    const buttonText = button.textContent || 'Unknown';    const buttonLocation = button.dataset.location || 'unknown';
    
    window.amplitude.track('Install Button Clicked', {
      button_text: buttonText,
      button_location: buttonLocation,
      page_section: this.getCurrentSection()
    });
    
    console.log('[MB Tracker] Install click tracked:', buttonLocation);
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
        if ([25, 50, 75, 100].includes(scrollDepth)) {
          window.amplitude.track('Scroll Depth Reached', {
            depth: scrollDepth
          });
        }      }
      
      ticking = false;
    };
    
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDepth);
        ticking = true;
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
}

// Initialize tracker when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.mbTracker = new MonkeyBlockWebTracker();
  });
} else {
  window.mbTracker = new MonkeyBlockWebTracker();
}
