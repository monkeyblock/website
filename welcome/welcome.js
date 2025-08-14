/**
 * Welcome Page Script
 * Handles attribution data sync with the extension
 */

class WelcomePage {
  constructor() {
    this.extensionId = 'ggccjkdgmlclpigflghjjkgeblgdgffe'; // MonkeyBlock Extension ID
    this.apiKey = 'ad0a670d36f60cd419802ccfb5252139';
    this.serverUrl = 'https://api.eu.amplitude.com';
    this.initAmplitude();
    this.initPage();
  }
  
  initAmplitude() {
    // Initialize Amplitude if available
    if (typeof amplitude !== 'undefined') {
      // Get or create user ID
      const userId = localStorage.getItem('mb_user_id') || 
                     `user_welcome_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      if (!localStorage.getItem('mb_user_id')) {
        localStorage.setItem('mb_user_id', userId);
      }
      
      amplitude.init(this.apiKey, userId, {
        serverUrl: this.serverUrl,
        includeReferrer: true,
        includeUtm: true
      });
      
      console.log('[Welcome] Amplitude initialized with user:', userId);
    } else {
      console.warn('[Welcome] Amplitude SDK not available');
    }
  }
  
  getExtensionId() {
    // Try to get extension ID from URL or use default
    const params = new URLSearchParams(window.location.search);
    return params.get('ext_id') || this.extensionId;
  }
  
  initPage() {
    const params = new URLSearchParams(window.location.search);
    const isFromExtension = params.get('ext') === '1';
    const fingerprint = params.get('fp');
    
    console.log('[Welcome] Page loaded', { isFromExtension, fingerprint });
    
    // Always update dashboard link with correct extension ID
    this.updateDashboardLink();
    
    if (isFromExtension && fingerprint) {
      // Page was opened by the extension for attribution
      this.sendAttributionData(fingerprint);
    }
    
    // Always show welcome content
    this.showWelcomeContent();
    this.trackPageView();
  }
  
  sendAttributionData(fingerprint) {
    try {
      // Get stored attribution data from website tracking
      const attribution = JSON.parse(localStorage.getItem('mb_attribution') || '{}');
      const userId = localStorage.getItem('mb_user_id');
      const installIntent = JSON.parse(localStorage.getItem('mb_install_intent') || '{}');
      
      // Check fingerprint mapping
      const fpData = JSON.parse(localStorage.getItem(`fp_${fingerprint}`) || '{}');
      
      // Check if install was recent (within 30 minutes)
      const isRecent = installIntent.timestamp && 
                       (Date.now() - installIntent.timestamp < 30 * 60 * 1000);
      
      console.log('[Welcome] Attribution data found:', {
        hasUserId: !!userId,
        hasAttribution: Object.keys(attribution).length > 0,
        isRecent,
        fingerprintMatch: fpData.user_id === userId
      });
      
      if (userId && (fpData.user_id === userId || isRecent)) {
        // Build attribution payload
        const payload = {
          type: 'attribution_data',
          userId: userId,
          deviceId: fingerprint,
          utm_source: attribution.utm_source,
          utm_medium: attribution.utm_medium,
          utm_campaign: attribution.utm_campaign,
          utm_content: attribution.utm_content,
          utm_term: attribution.utm_term,
          installIntentTime: installIntent.timestamp,
          referrer: attribution.referrer,
          landingPage: attribution.landing_page
        };
        
        // Send to extension via chrome.runtime.sendMessage
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage(this.extensionId, payload, (response) => {
            if (chrome.runtime.lastError) {
              console.error('[Welcome] Failed to send to extension:', chrome.runtime.lastError);
              // Try alternative method
              this.sendViaPostMessage(payload);
            } else {
              console.log('[Welcome] Attribution sent successfully:', response);
              this.showSyncSuccess();
            }
          });
        } else {
          // Fallback to postMessage
          this.sendViaPostMessage(payload);
        }
        
        // Track successful attribution sync in Amplitude
        if (typeof amplitude !== 'undefined') {
          amplitude.track('Attribution Synced', {
            method: 'welcome_page',
            fingerprint_match: fpData.user_id === userId,
            time_since_intent: isRecent ? Date.now() - installIntent.timestamp : null
          });
        }
      } else {
        console.log('[Welcome] No matching attribution data found');
      }
      
    } catch (error) {
      console.error('[Welcome] Error sending attribution data:', error);
    }
  }
  
  sendViaPostMessage(payload) {
    // Alternative method using postMessage
    try {
      // Store data temporarily for the extension to retrieve
      sessionStorage.setItem('mb_extension_attribution', JSON.stringify(payload));
      
      // Notify via custom event
      window.dispatchEvent(new CustomEvent('mb_attribution_ready', {
        detail: payload
      }));
      
      console.log('[Welcome] Attribution data stored for retrieval');
    } catch (error) {
      console.error('[Welcome] Failed to store attribution:', error);
    }
  }
  
  showSyncSuccess() {
    // Show visual feedback that sync was successful
    const syncDiv = document.getElementById('attribution-sync');
    if (syncDiv) {
      syncDiv.style.display = 'block';
      syncDiv.innerHTML = '<div style="position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 15px 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); animation: slideIn 0.3s ease;">✓ Analytics synced successfully</div>';
      
      setTimeout(() => {
        syncDiv.style.display = 'none';
      }, 3000);
    }
  }
  
  updateDashboardLink() {
    // Update dashboard link to use the correct extension ID
    const dashboardLink = document.getElementById('open-dashboard');
    if (dashboardLink) {
      const extensionId = this.getExtensionId();
      dashboardLink.href = `chrome-extension://${extensionId}/dashboard.html?source=welcome`;
      console.log('[Welcome] Dashboard link updated with extension ID:', extensionId);
    }
  }
  
  showWelcomeContent() {
    // Add any dynamic content or interactions here
    const features = document.querySelectorAll('.feature');
    features.forEach((feature, index) => {
      feature.style.animationDelay = (0.6 + index * 0.1) + 's';
    });
    
    // Add click tracking for dashboard button
    const dashboardBtn = document.getElementById('open-dashboard');
    if (dashboardBtn) {
      dashboardBtn.addEventListener('click', () => {
        this.trackEvent('Dashboard Button Clicked', {
          source: 'welcome_page'
        });
      });
    }
  }
  
  trackPageView() {
    // Track welcome page view
    this.trackEvent('Welcome Page Viewed', {
      from_extension: new URLSearchParams(window.location.search).get('ext') === '1',
      has_fingerprint: !!new URLSearchParams(window.location.search).get('fp')
    });
  }
  
  trackEvent(eventName, properties = {}) {
    // Track events if Amplitude is available
    if (typeof amplitude !== 'undefined') {
      amplitude.track(eventName, {
        ...properties,
        timestamp: new Date().toISOString()
      });
    }
    
    console.log('[Welcome] Event tracked:', eventName, properties);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.welcomePage = new WelcomePage();
  });
} else {
  window.welcomePage = new WelcomePage();
}
