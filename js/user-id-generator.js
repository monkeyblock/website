/**
 * Shared User ID and Fingerprint Generation
 * Ensures consistency across website and extension
 * Part of Phase 3: User ID Continuity
 */

class UserIdGenerator {
  /**
   * Generate a consistent user ID across platforms
   * @param {string} source - Source platform ('web', 'ext', 'feedback')
   * @param {string} fingerprint - Browser fingerprint for consistency
   * @returns {string} User ID in format: user_[source]_[timestamp]_[fingerprint]_[random]
   */
  static generateUserId(source = 'web', fingerprint = null) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    
    // Use fingerprint part if available for better consistency
    let fingerprintPart = random.substring(0, 8);
    if (fingerprint && fingerprint.startsWith('fp_')) {
      // Extract middle part of fingerprint for user ID
      fingerprintPart = fingerprint.substring(3, 11);
    }
    
    return `user_${source}_${timestamp}_${fingerprintPart}_${random}`;
  }

  /**
   * Parse user ID to extract metadata
   * @param {string} userId - User ID to parse
   * @returns {object} Parsed components or null if invalid
   */
  static parseUserId(userId) {
    if (!userId || !userId.startsWith('user_')) {
      return null;
    }
    
    const parts = userId.split('_');
    if (parts.length < 5) {
      return null;
    }
    
    return {
      source: parts[1],
      timestamp: parseInt(parts[2]),
      fingerprint: parts[3],
      random: parts[4],
      date: new Date(parseInt(parts[2]))
    };
  }

  /**
   * Check if user ID is from website
   * @param {string} userId - User ID to check
   * @returns {boolean}
   */
  static isWebsiteUserId(userId) {
    const parsed = this.parseUserId(userId);
    return parsed && parsed.source === 'web';
  }

  /**
   * Generate consistent fingerprint across platforms
   * Based on stable browser characteristics
   */
  static generateFingerprint() {
    try {
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
      
      // Create stable string from components
      const raw = Object.entries(components)
        .map(([key, value]) => `${key}:${value}`)
        .join('|');
      
      // Generate double hash for better uniqueness
      let hash1 = 0, hash2 = 0;
      for (let i = 0; i < raw.length; i++) {
        const char = raw.charCodeAt(i);
        hash1 = ((hash1 << 5) - hash1) + char;
        hash2 = ((hash2 << 3) - hash2) + char;
        hash1 = hash1 & hash1;
        hash2 = hash2 & hash2;
      }
      
      return 'fp_' + Math.abs(hash1).toString(36) + '_' + Math.abs(hash2).toString(36);
    } catch (error) {
      console.error('[UserIdGenerator] Fingerprint generation error:', error);
      // Fallback fingerprint
      return 'fp_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
    }
  }

  /**
   * Get or create user ID with persistence
   * @param {string} source - Source platform
   * @param {object} storage - Storage object (localStorage for web, chrome.storage for extension)
   * @returns {Promise<string>} User ID
   */
  static async getOrCreateUserId(source = 'web', storage = null) {
    try {
      // For website, use localStorage
      if (source === 'web' && typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('mb_amplitude_user_id');
        if (stored) {
          return stored;
        }
        
        const fingerprint = this.generateFingerprint();
        const userId = this.generateUserId('web', fingerprint);
        localStorage.setItem('mb_amplitude_user_id', userId);
        localStorage.setItem('mb_amplitude_device_id', fingerprint);
        return userId;
      }
      
      // For extension, use chrome.storage
      if (source === 'ext' && typeof chrome !== 'undefined' && chrome.storage) {
        return new Promise((resolve) => {
          chrome.storage.local.get(['mb_amplitude_user_id'], (data) => {
            if (data.mb_amplitude_user_id) {
              resolve(data.mb_amplitude_user_id);
            } else {
              const fingerprint = this.generateFingerprint();
              const userId = this.generateUserId('ext', fingerprint);
              chrome.storage.local.set({
                mb_amplitude_user_id: userId,
                mb_amplitude_device_id: fingerprint
              }, () => {
                resolve(userId);
              });
            }
          });
        });
      }
      
      // Fallback: Generate without persistence
      const fingerprint = this.generateFingerprint();
      return this.generateUserId(source, fingerprint);
      
    } catch (error) {
      console.error('[UserIdGenerator] Error getting/creating user ID:', error);
      const fingerprint = this.generateFingerprint();
      return this.generateUserId(source, fingerprint);
    }
  }
}

// Export for use in both environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UserIdGenerator;
}
