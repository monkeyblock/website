/**
 * MonkeyBlock Website Tracking - FIXED VERSION
 * Handles attribution tracking and user ID generation for cross-platform analytics
 */

class MonkeyBlockWebTracker {
  constructor() {
    this.apiKey = 'ad0a670d36f60cd419802ccfb5252139';
    // Try both server URLs
    this.serverUrl = 'https://api2.amplitude.com/2/httpapi'; // Standard US endpoint
    this.serverUrlEU = 'https://api.eu.amplitude.com/2/httpapi'; // EU endpoint
    this.extensionId = 'ggccjkdgmlclpigflghjjkgeblgdgffe';
    
    // Add debugging
    this.debug = true; // Enable verbose logging
    
    // Generate or retrieve IDs
    this.userId = this.getOrCreateUserId();
    this.deviceId = this.generateFingerprint();
    this.sessionId = Date.now();
    
    this.log('Initializing MonkeyBlock Tracker', {
      userId: this.userId,
      deviceId: this.deviceId,
      sessionId: this.sessionId
    });
    
    // Wait for Amplitude to be ready
    this.waitForAmplitude();
  }
  
  log(...args) {
    if (this.debug) {
      console.log('[MB Tracker]', ...args);
    }
  }
  
  waitForAmplitude() {
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds
    
    const checkAmplitude = () => {
      attempts++;
      
      if (typeof amplitude !== 'undefined' && amplitude.init) {
        this.log('✅ Amplitude SDK found after', attempts, 'attempts');
        this.initAmplitude();
        this.trackLandingVisit();
        this.setupEventListeners();
      } else if (attempts < maxAttempts) {
        this.log('⏳ Waiting for Amplitude SDK... attempt', attempts);
        setTimeout(checkAmplitude, 100);
      } else {
        console.error('[MB Tracker] ❌ Amplitude SDK failed to load after 5 seconds');
        this.fallbackTracking();
      }
    };
    
    checkAmplitude();
  }
  
  fallbackTracking() {
    // Send events directly via HTTP API if SDK fails
    this.log('Using fallback HTTP API tracking');
    
    const event = {
      api_key: this.apiKey,
      events: [{
        user_id: this.userId,
        device_id: this.deviceId,
        session_id: this.sessionId,
        event_type: 'Landing Page Visit - Fallback',
        time: Date.now(),
        event_properties: {
          page_url: window.location.href,
          referrer: document.referrer,
          fallback_mode: true
        }
      }]
    };
    
    // Try both endpoints
    this.sendToEndpoint(this.serverUrl, event);
    this.sendToEndpoint(this.serverUrlEU, event);
  }
  
  sendToEndpoint(url, data) {
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    })
    .then(response => {
      if (response.ok) {
        this.log('✅ Fallback event sent to', url);
      } else {
        this.log('❌ Fallback failed for', url, response.status);
      }
    })
    .catch(error => {
      this.log('❌ Fallback error for', url, error);
    });
  }