/**
 * MonkeyBlock Unified Analytics Library
 * Shared analytics implementation for all platforms
 * 
 * Platforms:
 * - Website (monkey-block.com)
 * - Extension (Chrome Extension) 
 * - Welcome Page
 * - Feedback Page
 */

class MonkeyBlockAnalytics {
  constructor(config) {
    // Platform configuration
    this.platform = config.platform; // 'website', 'extension', 'welcome', 'feedback'
    this.apiKey = 'ad0a670d36f60cd419802ccfb5252139';
    this.apiEndpoint = 'https://api.eu.amplitude.com/2/httpapi';
    
    // User identifiers
    this.userId = null;
    this.deviceId = null;
    this.sessionId = null;
    
    // Attribution data
    this.attribution = null;
    
    // State
    this.initialized = false;
    this.eventQueue = [];
    
    // Platform-specific storage
    this.storage = this.getStorageForPlatform();
  }
  
  /**
   * Initialize analytics with existing or new identifiers
   */
  async initialize() {
    try {
      console.log(`[MB Analytics] Initializing for platform: ${this.platform}`);
      
      // Generate or retrieve identifiers
      this.deviceId = await this.getOrCreateDeviceId();
      this.userId = await this.getOrCreateUserId();
      this.sessionId = this.generateSessionId();
      
      // Load attribution data
      this.attribution = await this.loadAttribution();
      
      // Set user properties
      await this.updateUserProperties();
      
      // Process queued events
      await this.processEventQueue();
      
      this.initialized = true;
      console.log('[MB Analytics] Initialization complete:', {
        platform: this.platform,
        userId: this.userId,
        deviceId: this.deviceId
      });
      
    } catch (error) {
      console.error('[MB Analytics] Initialization error:', error);
    }
  }
  
  /**
   * Get storage adapter based on platform
   */
  getStorageForPlatform() {
    switch (this.platform) {
      case 'extension':
        return {
          get: (keys) => chrome.storage.local.get(keys),
          set: (data) => chrome.storage.local.set(data),
          remove: (keys) => chrome.storage.local.remove(keys)
        };
      default: // website, welcome, feedback
        return {
          get: async (keys) => {
            const result = {};
            for (const key of (Array.isArray(keys) ? keys : [keys])) {
              const value = localStorage.getItem(key);
              if (value) {
                try {
                  result[key] = JSON.parse(value);
                } catch {
                  result[key] = value;
                }
              }
            }
            return result;
          },
          set: async (data) => {
            for (const [key, value] of Object.entries(data)) {
              localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
            }
          },
          remove: async (keys) => {
            for (const key of (Array.isArray(keys) ? keys : [keys])) {
              localStorage.removeItem(key);
            }
          }
        };
    }
  }
  
  /**
   * Generate consistent fingerprint across all platforms
   */
  generateFingerprint() {
    try {
      // Use FingerprintGenerator if available
      if (typeof FingerprintGenerator !== 'undefined') {
        return FingerprintGenerator.generate();
      }
      
      // Otherwise use inline implementation
      // IMPORTANT: Must match EXACTLY with extension's fingerprint generation!
      const components = {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        platform: navigator.platform,
        languages: navigator.languages ? navigator.languages.join(',') : navigator.language,
        hardwareConcurrency: navigator.hardwareConcurrency || 4,
        cookieEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack || 'unspecified',
        maxTouchPoints: navigator.maxTouchPoints || 0,
        vendor: navigator.vendor,
        vendorSub: navigator.vendorSub || '',
        productSub: navigator.productSub || '20030107',
        webdriver: navigator.webdriver || false
      };
      
      // Sort keys to ensure consistent order (CRITICAL for matching!)
      const sortedComponents = {};
      Object.keys(components).sort().forEach(key => {
        sortedComponents[key] = components[key];
      });
      
      const fingerprintString = JSON.stringify(sortedComponents);
      let hash1 = 0, hash2 = 5381;
      
      for (let i = 0; i < fingerprintString.length; i++) {
        const char = fingerprintString.charCodeAt(i);
        hash1 = ((hash1 << 5) - hash1) + char;
        hash2 = ((hash2 << 5) + hash2) + char;
        hash1 = hash1 & hash1;
        hash2 = hash2 & hash2;
      }
      
      return `fp_${Math.abs(hash1).toString(36)}_${Math.abs(hash2).toString(36)}`;
    } catch (error) {
      console.error('[MB Analytics] Fingerprint generation error:', error);
      return `fp_fallback_${Date.now().toString(36)}`;
    }
  }
  
  /**
   * Get or create device ID
   */
  async getOrCreateDeviceId() {
    const storageKey = 'mb_amplitude_device_id';
    const { [storageKey]: storedId } = await this.storage.get(storageKey);
    
    if (storedId) {
      console.log('[MB Analytics] Retrieved existing device ID:', storedId);
      return storedId;
    }
    
    const deviceId = this.generateFingerprint();
    await this.storage.set({ [storageKey]: deviceId });
    console.log('[MB Analytics] Generated new device ID:', deviceId);
    return deviceId;
  }
  
  /**
   * Get or create user ID
   */
  async getOrCreateUserId() {
    const storageKey = 'mb_user_id';
    const { [storageKey]: storedId } = await this.storage.get(storageKey);
    
    if (storedId) {
      console.log('[MB Analytics] Retrieved existing user ID:', storedId);
      return storedId;
    }
    
    // Generate new user ID with platform prefix
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const fingerprintPart = this.deviceId ? this.deviceId.substring(3, 11) : random.substring(0, 8);
    const userId = `user_${this.platform}_${timestamp}_${fingerprintPart}_${random}`;
    
    await this.storage.set({ [storageKey]: userId });
    console.log('[MB Analytics] Generated new user ID:', userId);
    return userId;
  }
  
  /**
   * Generate session ID
   */
  generateSessionId() {
    return Date.now() - (Date.now() % (30 * 60 * 1000)); // 30-minute sessions
  }
  
  /**
   * Load attribution data based on platform
   */
  async loadAttribution() {
    switch (this.platform) {
      case 'extension':
        // Try multiple sources
        const { websiteAttribution, mb_landing_attribution } = await this.storage.get([
          'websiteAttribution',
          'mb_landing_attribution'
        ]);
        return websiteAttribution || mb_landing_attribution || null;
        
      case 'welcome':
        // Parse from URL first
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('utm_source')) {
          return {
            utm: {
              utm_source: urlParams.get('utm_source'),
              utm_medium: urlParams.get('utm_medium'),
              utm_campaign: urlParams.get('utm_campaign'),
              utm_content: urlParams.get('utm_content'),
              utm_term: urlParams.get('utm_term')
            },
            referrer: urlParams.get('ref')
          };
        }
        // Fall through to default
        
      default:
        // Try localStorage
        const stored = localStorage.getItem('mb_landing_attribution');
        return stored ? JSON.parse(stored) : null;
    }
  }
  
  /**
   * Update user properties in Amplitude
   */
  async updateUserProperties() {
    const properties = {
      platform: this.platform,
      device_id: this.deviceId,
      fingerprint: this.deviceId
    };
    
    // Add attribution if available
    if (this.attribution) {
      if (this.attribution.utm) {
        Object.assign(properties, this.attribution.utm);
      }
      if (this.attribution.referrer) {
        properties.initial_referrer = this.attribution.referrer;
      }
      if (this.attribution.landing_page) {
        properties.initial_landing_page = this.attribution.landing_page;
      }
    }
    
    // Platform-specific properties
    switch (this.platform) {
      case 'extension':
        properties.extension_version = chrome.runtime.getManifest().version;
        properties.extension_id = chrome.runtime.id;
        break;
      case 'website':
        properties.page_path = window.location.pathname;
        break;
    }
    
    // Send user properties event
    await this.sendEvent('$identify', properties);
  }
  
  /**
   * Track an event
   */
  async track(eventName, properties = {}) {
    if (!this.initialized) {
      console.log('[MB Analytics] Queueing event (not initialized):', eventName);
      this.eventQueue.push({ eventName, properties, timestamp: Date.now() });
      return;
    }
    
    await this.sendEvent(eventName, properties);
  }
  
  /**
   * Send event to Amplitude
   */
  async sendEvent(eventName, properties = {}) {
    try {
      const event = {
        user_id: this.userId,
        device_id: this.deviceId,
        session_id: this.sessionId,
        event_type: eventName,
        time: Date.now(),
        platform: this.platform,
        event_properties: {
          ...properties,
          platform: this.platform
        },
        user_properties: eventName === '$identify' ? properties : undefined
      };
      
      const payload = {
        api_key: this.apiKey,
        events: [event]
      };
      
      // In extension, use fetch API
      if (this.platform === 'extension') {
        const response = await fetch(this.apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } else {
        // On website, use Beacon API for reliability
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon(this.apiEndpoint, blob);
      }
      
      console.log(`[MB Analytics] Event sent: ${eventName}`);
    } catch (error) {
      console.error('[MB Analytics] Error sending event:', error);
    }
  }
  
  /**
   * Process queued events
   */
  async processEventQueue() {
    if (this.eventQueue.length === 0) return;
    
    console.log(`[MB Analytics] Processing ${this.eventQueue.length} queued events`);
    
    for (const { eventName, properties } of this.eventQueue) {
      await this.sendEvent(eventName, properties);
    }
    
    this.eventQueue = [];
  }
  
  /**
   * Set user ID (for cross-platform continuity)
   */
  async setUserId(userId) {
    if (userId && userId !== this.userId) {
      this.userId = userId;
      await this.storage.set({ mb_user_id: userId });
      console.log('[MB Analytics] User ID updated:', userId);
    }
  }
  
  /**
   * Set attribution data
   */
  async setAttribution(attribution) {
    this.attribution = attribution;
    await this.updateUserProperties();
  }
  
  /**
   * Get platform-specific properties
   */
  getPlatformProperties() {
    const props = {
      platform: this.platform,
      timestamp: Date.now()
    };
    
    switch (this.platform) {
      case 'extension':
        props.version = chrome.runtime.getManifest().version;
        break;
      case 'website':
      case 'welcome':
      case 'feedback':
        props.page_url = window.location.href;
        props.page_path = window.location.pathname;
        props.referrer = document.referrer;
        break;
    }
    
    return props;
  }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MonkeyBlockAnalytics;
} else if (typeof window !== 'undefined') {
  window.MonkeyBlockAnalytics = MonkeyBlockAnalytics;
}
