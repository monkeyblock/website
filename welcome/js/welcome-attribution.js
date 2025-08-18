/**
 * Welcome Page Attribution Bridge
 * Retrieves attribution data from website and passes to extension
 * Part of Phase 2: Cross-Platform Tracking
 */

class WelcomeAttributionBridge {
  constructor() {
    this.extensionId = this.getExtensionId();
    this.attribution = null;
    this.recoveryMethod = null;
  }

  getExtensionId() {
    // Get from URL parameter (passed by extension)
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('ext_id') || chrome?.runtime?.id || null;
  }

  async initializeAttribution() {
    try {
      console.log('[Welcome Attribution] Initializing attribution recovery...');
      
      // Recover attribution from multiple sources
      this.attribution = await this.recoverAttribution();
      
      if (this.attribution) {
        console.log('[Welcome Attribution] Attribution recovered via:', this.recoveryMethod);
        console.log('[Welcome Attribution] Attribution data:', this.attribution);
        
        // Send to extension if we're in extension context
        if (this.isExtensionContext()) {
          await this.sendToExtension(this.attribution);
        }
        
        // Track attribution recovery success
        if (window.mbAnalytics && window.mbAnalytics.track) {
          window.mbAnalytics.track('Attribution Recovered', {
            recovery_method: this.recoveryMethod,
            has_utm: !!this.attribution.utm,
            has_referrer: !!this.attribution.referrer,
            source: 'welcome_page'
          });
        }
      } else {
        console.log('[Welcome Attribution] No attribution data found');
      }
      
    } catch (error) {
      console.error('[Welcome Attribution] Error during initialization:', error);
    }
  }

  async recoverAttribution() {
    // Priority 1: URL Parameters (from extension) - ENHANCED
    const urlParams = new URLSearchParams(window.location.search);
    
    // Build complete attribution from URL parameters
    const urlAttribution = {
      userId: urlParams.get('uid'),
      deviceId: urlParams.get('did') || urlParams.get('fp'),
      fingerprint: urlParams.get('did') || urlParams.get('fp'),
      extensionId: urlParams.get('ext_id'),
      version: urlParams.get('v'),
      utm: {
        utm_source: urlParams.get('utm_source'),
        utm_medium: urlParams.get('utm_medium'),
        utm_campaign: urlParams.get('utm_campaign'),
        utm_content: urlParams.get('utm_content'),
        utm_term: urlParams.get('utm_term')
      },
      referrer: urlParams.get('ref'),
      fromExtension: urlParams.get('ext') === '1'
    };
    
    // Remove empty UTM values
    Object.keys(urlAttribution.utm).forEach(key => {
      if (!urlAttribution.utm[key]) delete urlAttribution.utm[key];
    });
    
    // If we have essential data from URL, use it
    if (urlAttribution.userId && urlAttribution.deviceId) {
      this.recoveryMethod = 'url_parameters_complete';
      console.log('[Welcome Attribution] Full attribution from URL parameters');
      return urlAttribution;
    }
    
    // If we only have partial URL data, continue to other sources
    if (urlAttribution.extensionId || urlAttribution.deviceId) {
      console.log('[Welcome Attribution] Partial URL data found, checking other sources...');
    }
    
    // Priority 2: localStorage (same domain)
    try {
      const storedPre = localStorage.getItem('mb_pre_install_attribution');
      const storedLanding = localStorage.getItem('mb_landing_attribution');
      
      if (storedPre) {
        const attribution = JSON.parse(storedPre);
        this.recoveryMethod = 'localStorage_pre_install';
        return attribution;
      }
      
      if (storedLanding) {
        const attribution = JSON.parse(storedLanding);
        this.recoveryMethod = 'localStorage_landing';
        return attribution;
      }
    } catch (error) {
      console.error('[Welcome Attribution] localStorage error:', error);
    }
    
    // Priority 3: Cookie (cross-subdomain)
    const cookieAttribution = this.getCookieAttribution();
    if (cookieAttribution) {
      this.recoveryMethod = 'cookie';
      return cookieAttribution;
    }
    
    // Priority 4: Extension Message (if still has data)
    if (this.isExtensionContext()) {
      const extensionAttribution = await this.getFromExtension();
      if (extensionAttribution) {
        this.recoveryMethod = 'extension_message';
        return extensionAttribution;
      }
    }
    
    return null;
  }

  getCookieAttribution() {
    try {
      const cookies = document.cookie.split(';');
      const mbAttr = cookies.find(c => c.trim().startsWith('mb_attr='));
      
      if (mbAttr) {
        const value = mbAttr.split('=')[1];
        const decoded = JSON.parse(atob(value));
        return decoded;
      }
    } catch (error) {
      console.error('[Welcome Attribution] Cookie parsing error:', error);
    }
    return null;
  }

  async getFromExtension() {
    if (!chrome?.runtime?.sendMessage) return null;
    
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { action: 'getAttributionData' },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error('[Welcome Attribution] Extension error:', chrome.runtime.lastError);
            resolve(null);
          } else {
            resolve(response);
          }
        }
      );
      
      // Timeout after 1 second
      setTimeout(() => resolve(null), 1000);
    });
  }

  async sendToExtension(attribution) {
    if (!chrome?.runtime?.sendMessage) {
      console.log('[Welcome Attribution] Not in extension context, cannot send to background');
      return;
    }
    
    try {
      chrome.runtime.sendMessage({
        action: 'setWebsiteAttribution',
        data: {
          ...attribution,
          recovery_method: this.recoveryMethod,
          recovered_at: new Date().toISOString()
        }
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('[Welcome Attribution] Failed to send to extension:', chrome.runtime.lastError);
        } else {
          console.log('[Welcome Attribution] Successfully sent to extension:', response);
        }
      });
    } catch (error) {
      console.error('[Welcome Attribution] Error sending to extension:', error);
    }
  }

  isExtensionContext() {
    // Check if we're running in extension context
    return !!(window.chrome && chrome.runtime && chrome.runtime.id);
  }

  // Track welcome page events with attribution context
  trackWelcomeEvent(eventName, properties = {}) {
    if (window.mbAnalytics && window.mbAnalytics.track) {
      window.mbAnalytics.track(eventName, {
        ...properties,
        source: 'welcome_page',
        has_attribution: !!this.attribution,
        recovery_method: this.recoveryMethod
      });
    }
  }
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    window.welcomeAttribution = new WelcomeAttributionBridge();
    await window.welcomeAttribution.initializeAttribution();
  });
} else {
  // DOM already loaded
  window.welcomeAttribution = new WelcomeAttributionBridge();
  window.welcomeAttribution.initializeAttribution();
}
