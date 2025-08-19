/**
 * Stable Fingerprint Generator
 * Unified fingerprinting algorithm for all MonkeyBlock platforms
 * 
 * This module ensures consistent device identification across:
 * - Website (monkey-block.com)
 * - Chrome Extension
 * - Welcome Page
 * - Feedback Page
 */

class FingerprintGenerator {
  /**
   * Generate a stable fingerprint based on browser characteristics
   * Uses only stable components that don't change with browser updates
   * 
   * @returns {string} Fingerprint in format: fp_hash1_hash2
   */
  static generate() {
    try {
      // Collect stable browser components
      // MUST MATCH EXACTLY with extension's background-unified.js!
      const components = {
        // Timezone is very stable and unique enough for grouping
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        
        // Language settings rarely change (single value only for consistency)
        language: navigator.language,
        
        // Platform is stable (e.g., "Win32", "MacIntel")
        platform: navigator.platform,
        
        // Additional navigator.languages for consistency with extension
        languages: navigator.languages ? navigator.languages.join(',') : navigator.language,
        
        // Hardware concurrency (CPU cores) is stable
        hardwareConcurrency: navigator.hardwareConcurrency || 4,
        
        // Cookie settings
        cookieEnabled: navigator.cookieEnabled,
        
        // Do Not Track setting
        doNotTrack: navigator.doNotTrack || 'unspecified',
        
        // Touch support
        maxTouchPoints: navigator.maxTouchPoints || 0,
        
        // Browser vendor info
        vendor: navigator.vendor,
        vendorSub: navigator.vendorSub || '',
        productSub: navigator.productSub || '20030107',
        
        // WebDriver detection
        webdriver: navigator.webdriver || false
      };
      
      // Sort keys to ensure consistent order - CRITICAL!
      const sortedComponents = {};
      Object.keys(components).sort().forEach(key => {
        sortedComponents[key] = components[key];
      });

      // Convert to stable string
      const fingerprintString = JSON.stringify(sortedComponents);
      
      // Generate two hashes for better distribution
      // MUST match extension's implementation exactly!
      let hash1 = 0, hash2 = 5381;
      
      for (let i = 0; i < fingerprintString.length; i++) {
        const char = fingerprintString.charCodeAt(i);
        hash1 = ((hash1 << 5) - hash1) + char;
        hash2 = ((hash2 << 5) + hash2) + char;
        hash1 = hash1 & hash1; // Convert to 32-bit integer
        hash2 = hash2 & hash2;
      }
      
      // Format: fp_hash1_hash2
      return `fp_${Math.abs(hash1).toString(36)}_${Math.abs(hash2).toString(36)}`;
      
    } catch (error) {
      console.error('[Fingerprint] Generation error:', error);
      // Fallback fingerprint
      return `fp_fallback_${Date.now().toString(36)}`;
    }
  }

  /**
   * Generate a hash from a string using a seed
   * @private
   */
  static generateHash(str, seed = 0) {
    let hash = seed;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Convert to base36 for shorter string
    return Math.abs(hash).toString(36);
  }

  /**
   * Validate a fingerprint format
   * @param {string} fingerprint - The fingerprint to validate
   * @returns {boolean} True if valid format
   */
  static isValid(fingerprint) {
    if (!fingerprint || typeof fingerprint !== 'string') return false;
    
    // Check format: fp_hash1_hash2
    const pattern = /^fp_[a-z0-9]+_[a-z0-9]+$/;
    return pattern.test(fingerprint);
  }

  /**
   * Get fingerprint components for debugging
   * @returns {object} The components used for fingerprinting
   */
  static getComponents() {
    return {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      hardwareConcurrency: navigator.hardwareConcurrency || 4
    };
  }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  // Node.js / CommonJS
  module.exports = FingerprintGenerator;
} else if (typeof window !== 'undefined') {
  // Browser
  window.FingerprintGenerator = FingerprintGenerator;
}
