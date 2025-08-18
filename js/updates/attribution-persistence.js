/**
 * Attribution Persistence Module
 * Stores UTM parameters and other attribution data for cross-platform tracking
 */

class AttributionPersistence {
  constructor() {
    this.storageKey = 'mb_attribution';
    this.fingerprintKey = 'mb_fingerprint';
    this.landingDataKey = 'mb_landing_data';
  }

  // Store attribution data when user lands on website
  storeAttribution(data) {
    const attribution = {
      ...data,
      timestamp: Date.now(),
      fingerprint: this.getFingerprint()
    };
    
    // Store in localStorage for 30 days
    localStorage.setItem(this.storageKey, JSON.stringify(attribution));
    
    // Also store landing data separately
    const landingData = {
      landing_time: new Date().toISOString(),
      landing_url: window.location.href,
      referrer: document.referrer,
      ...data
    };
    localStorage.setItem(this.landingDataKey, JSON.stringify(landingData));
    
    console.log('[Attribution] Stored attribution data:', attribution);
  }

  // Get stored attribution for extension
  getStoredAttribution() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return null;
      
      const data = JSON.parse(stored);
      
      // Check if data is older than 30 days
      const age = Date.now() - data.timestamp;
      if (age > 30 * 24 * 60 * 60 * 1000) {
        localStorage.removeItem(this.storageKey);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('[Attribution] Error getting stored attribution:', error);
      return null;
    }
  }

  // Store fingerprint separately for matching
  storeFingerprint(fingerprint) {
    localStorage.setItem(this.fingerprintKey, fingerprint);
  }

  getFingerprint() {
    return localStorage.getItem(this.fingerprintKey);
  }

  // Clear old attribution data
  clearAttribution() {
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.landingDataKey);
  }
}

// Export for use
window.AttributionPersistence = AttributionPersistence;
