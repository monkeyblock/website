/**
 * Enhanced Amplitude Web Tracker with Attribution Persistence
 * This update adds proper attribution tracking that persists across the user journey
 */

// Add this to the MonkeyBlockWebTracker class after initAmplitude()

async enhanceAttributionTracking() {
  // Initialize attribution persistence
  this.attribution = new AttributionPersistence();
  
  // Store fingerprint for cross-platform matching
  this.attribution.storeFingerprint(this.deviceId);
  
  // Get and store UTM parameters
  const utm = this.getUTMParameters();
  const hasUTM = Object.values(utm).some(v => v && v !== 'direct' && v !== 'none');
  
  if (hasUTM || document.referrer) {
    this.attribution.storeAttribution({
      ...utm,
      initial_referrer: document.referrer,
      source_platform: 'website',
      user_id: this.userId,
      device_id: this.deviceId
    });
  }
  
  // Set initial user properties with attribution
  const userProps = {
    source_platform: 'website',
    landing_fingerprint: this.deviceId,
    initial_landing: new Date().toISOString(),
    browser: navigator.userAgent,
    language: navigator.language,
    screen_resolution: `${screen.width}x${screen.height}`,
    viewport_size: `${window.innerWidth}x${window.innerHeight}`,
    ...utm // Include UTM parameters in user properties
  };
  
  // Use proper identify endpoint for user properties
  await this.setUserProperties(userProps);
}

// Add this method to properly set user properties
async setUserProperties(properties) {
  if (!this.amplitude) return;
  
  try {
    // Method 1: Use amplitude.identify() if available
    if (this.amplitude.identify) {
      const identify = new amplitude.Identify();
      Object.entries(properties).forEach(([key, value]) => {
        identify.set(key, value);
      });
      await this.amplitude.identify(identify).promise;
    } else {
      // Method 2: Fallback to direct API call
      const params = new URLSearchParams();
      params.append('api_key', this.apiKey);
      params.append('identification', JSON.stringify([{
        user_id: this.userId,
        device_id: this.deviceId,
        user_properties: properties
      }]));
      
      await fetch('https://api.eu.amplitude.com/identify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });
    }
    
    console.log('[MB Tracker] User properties set:', properties);
  } catch (error) {
    console.error('[MB Tracker] Failed to set user properties:', error);
  }
}

// Update the initAmplitude method to call enhanceAttributionTracking
// Add this line after the existing setUserProperties call:
// await this.enhanceAttributionTracking();
