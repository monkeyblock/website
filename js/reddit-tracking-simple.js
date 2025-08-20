/**
 * Reddit Tracking Module - Simplified Version
 * Only uses Reddit Pixel (no Worker needed)
 */

class RedditTracking {
  constructor() {
    // Get or create user ID for attribution
    this.userId = this.getUserId();
    
    // Check if pixel is loaded
    this.checkPixelStatus();
  }
  
  getUserId() {
    let userId = localStorage.getItem('mb_user_id');
    if (!userId) {
      userId = `user_web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('mb_user_id', userId);
    }
    return userId;
  }
  
  checkPixelStatus() {
    // Check after page load if Reddit Pixel is available
    setTimeout(() => {
      if (window.rdt && window.rdt.sendEvent) {
        console.log('[Reddit] Pixel loaded successfully ✅');
      } else {
        console.warn('[Reddit] Pixel not loaded - might be blocked');
      }
    }, 1000);
  }
  
  /**
   * Track event via Reddit Pixel
   */
  track(eventName, value = 1, metadata = {}) {
    // Only track if pixel is available
    if (!window.rdt) {
      console.warn(`[Reddit] Cannot track "${eventName}" - pixel not loaded`);
      return;
    }
    
    try {
      if (eventName === 'PageVisit') {
        // Standard PageVisit event
        rdt('track', 'PageVisit');
      } else {
        // Custom events
        rdt('track', 'Custom', {
          customEventName: eventName,
          value: value,
          currency: 'USD',
          ...metadata
        });
      }
      
      console.log(`[Reddit] Event tracked: ${eventName} (value: ${value})`);
      
    } catch (error) {
      console.error('[Reddit] Tracking failed:', error);
    }
  }
  
  /**
   * Helper method for common events
   */
  trackPageView() {
    // Only track Landing_Page_View for landing page (no redundant PageVisit)
    this.track('Landing_Page_View');
  }
  
  trackInstallClick() {
    this.track('Install_Button_Click');
  }
  
  trackFeatureActivation(featureName) {
    this.track(`Feature_${featureName}_Enabled`);
  }
}

// Initialize tracking when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.redditTracking = new RedditTracking();
  });
} else {
  window.redditTracking = new RedditTracking();
}
