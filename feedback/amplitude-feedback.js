/*
 * Monkey Block - Amplitude Analytics for Feedback Page
 * Copyright (c) 2025
 * All rights reserved.
 */

// Amplitude Analytics class for feedback page
class AmplitudeFeedback {
  constructor() {
    this.apiKey = 'ad0a670d36f60cd419802ccfb5252139';
    this.apiEndpoint = 'https://api.eu.amplitude.com/2/httpapi';
    this.userId = null;
    this.deviceId = null;
    
    // Enhanced Session Management
    this.sessionTimeout = 30 * 60 * 1000; // 30 minutes (Amplitude standard)
    this.lastEventTime = Date.now();
    this.sessionId = Date.now();
    this.eventCount = 0;
    
    this.installDate = null;
    this.installDateSource = null;
    this.daysUsed = null;
    this.selectedReason = null;
  }

  async init() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      
      // CRITICAL: Get User ID and Device ID from URL parameters FIRST
      const urlUserId = urlParams.get('uid');
      const urlDeviceId = urlParams.get('did');
      
      if (urlUserId) {
        this.userId = urlUserId;
        console.log('[Amplitude Feedback] Using user ID from URL:', this.userId);
      }
      
      if (urlDeviceId) {
        this.deviceId = urlDeviceId;
        console.log('[Amplitude Feedback] Using device ID from URL:', this.deviceId);
      }
      
      // Priority 1: URL Parameter for install date
      let installDateParam = urlParams.get('install_date');
      if (installDateParam) {
        this.installDate = new Date(installDateParam);
        this.installDateSource = 'url_parameter';
      }
      
      // Priority 2: Extension Message for install date (if still installed)
      if (!this.installDate) {
        const extensionData = await this.getDataFromExtension();
        if (extensionData?.installDate) {
          this.installDate = new Date(extensionData.installDate);
          this.installDateSource = 'extension_message';
        }
      }
      
      // Priority 3: User ID Timestamp for install date (if format user_*_TIMESTAMP_*)
      if (!this.installDate && urlUserId) {
        const match = urlUserId.match(/user_[^_]+_(\d{13})/);
        if (match) {
          const timestamp = parseInt(match[1]);
          if (!isNaN(timestamp) && timestamp > 1600000000000) { // After Sept 2020
            this.installDate = new Date(timestamp);
            this.installDateSource = 'user_id_timestamp';
          }
        }
      }
      
      // Priority 4: Fallback to conservative estimate (7 days ago)
      if (!this.installDate) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        this.installDate = sevenDaysAgo;
        this.installDateSource = 'fallback_estimate';
      }
      
      // Calculate days used
      const now = new Date();
      this.daysUsed = Math.max(0, Math.floor((now - this.installDate) / (1000 * 60 * 60 * 24)));
      
      // Calculate more precise time metrics for quick uninstalls
      const timeDiff = now - this.installDate;
      this.minutesSinceInstall = Math.max(0, Math.floor(timeDiff / (1000 * 60)));
      this.hoursSinceInstall = Math.max(0, Math.floor(timeDiff / (1000 * 60 * 60)));
      this.timeSinceInstallMs = Math.max(0, timeDiff); // Raw milliseconds for precise tracking
      
      // Create a human-readable time since install string
      this.timeSinceInstallFormatted = this.formatTimeSinceInstall(timeDiff);
      
      console.log(`[Amplitude Feedback] Time since install: ${this.minutesSinceInstall} minutes (${this.hoursSinceInstall} hours, ${this.daysUsed} days)`);

      // Only try extension if we still need IDs
      if (!this.userId || !this.deviceId) {
        const extensionData = await this.getDataFromExtension();
        if (extensionData) {
          this.userId = this.userId || extensionData.userId;
          this.deviceId = this.deviceId || extensionData.deviceId;
          console.log('[Amplitude Feedback] Got missing IDs from extension');
        }
      }
      
      // IMPORTANT: Only generate new IDs as absolute last resort
      // This should almost never happen if extension properly passes IDs
      if (!this.userId) {
        // Use uninstall prefix to distinguish from regular users
        const fingerprint = await this.generateSimpleFingerprint();
        const timestamp = Date.now();
        this.userId = `uninstall_user_${fingerprint}_${timestamp}`;
        console.warn('[Amplitude Feedback] WARNING: Had to generate new user ID - extension did not pass ID!');
        console.log('[Amplitude Feedback] Generated fallback user ID:', this.userId);
      }

      if (!this.deviceId) {
        const fingerprint = await this.generateSimpleFingerprint();
        this.deviceId = fingerprint;
        console.warn('[Amplitude Feedback] WARNING: Had to generate new device ID - extension did not pass ID!');
        console.log('[Amplitude Feedback] Generated fallback device ID:', this.deviceId);
      }

      console.log('[Amplitude Feedback] Initialization complete:', {
        userId: this.userId,
        deviceId: this.deviceId,
        installDate: this.installDate.toISOString(),
        source: this.installDateSource,
        daysUsed: this.daysUsed
      });

    } catch (error) {
      console.error('[Amplitude Feedback] Init error:', error);
      // Emergency fallback - should never happen
      this.installDate = new Date();
      this.daysUsed = 0;
      this.installDateSource = 'error_fallback';
      this.userId = `error_user_${Date.now()}`;
      this.deviceId = `error_device_${Date.now()}`;
    }
  }

  async getDataFromExtension() {
    try {
      // Try to communicate with extension if it's still installed
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        // Get extension ID from URL parameter or use production ID
        const urlParams = new URLSearchParams(window.location.search);
        const extensionId = urlParams.get('ext_id') || 'ggccjkdgmlclpigflghjjkgeblgdgffe';
        
        // Only try if we have a valid extension ID
        if (extensionId && extensionId !== 'YOUR_EXTENSION_ID_HERE') {
        return new Promise((resolve) => {
          chrome.runtime.sendMessage(extensionId, 
            { action: 'getAmplitudeData' }, 
            (response) => {
              if (chrome.runtime.lastError) {
                console.log('[Amplitude Feedback] Extension not responding:', chrome.runtime.lastError);
                resolve(null);
                return;
              }
              
              if (response && response.userId) {
                this.userId = response.userId;
                this.deviceId = response.deviceId || this.deviceId;
                console.log('[Amplitude Feedback] Got user data from extension:', response);
              }
              resolve(response);
            }
          );
          
          // Timeout after 1 second
          setTimeout(() => resolve(null), 1000);
        });
        } else {
          console.log('[Amplitude Feedback] Extension ID not available or invalid');
          return null;
        }
      }
    } catch (error) {
      console.log('[Amplitude Feedback] Could not get data from extension:', error);
    }
    return null;
  }
  
  // Format time since install for human readability
  formatTimeSinceInstall(milliseconds) {
    const minutes = Math.floor(milliseconds / (1000 * 60));
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else if (hours < 24) {
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 
        ? `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`
        : `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      const remainingHours = hours % 24;
      return remainingHours > 0
        ? `${days} day${days !== 1 ? 's' : ''} ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`
        : `${days} day${days !== 1 ? 's' : ''}`;
    }
  }

  async generateSimpleFingerprint() {
    try {
      // Use unified fingerprint algorithm - MUST match extension's fingerprint
      // IMPORTANT: No navigator.languages array - causes inconsistency!
      const components = {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,  // Single value, not array
        platform: navigator.platform,
        hardwareConcurrency: navigator.hardwareConcurrency || 4
        // NO navigator.languages - different between contexts
      };
      
      const fingerprintString = JSON.stringify(components);
      
      // Generate two hashes for better distribution
      let hash1 = 0, hash2 = 5381;
      
      for (let i = 0; i < fingerprintString.length; i++) {
        const char = fingerprintString.charCodeAt(i);
        hash1 = ((hash1 << 5) - hash1) + char;
        hash2 = ((hash2 << 5) + hash2) + char;
      }
      
      return `fp_${Math.abs(hash1).toString(36)}_${Math.abs(hash2).toString(36)}`;
    } catch (error) {
      console.error('[Amplitude Feedback] Fingerprint error:', error);
      return `fp_fallback_${Date.now().toString(36)}`;
    }
  }

  // Dynamic Session Management
  getCurrentSessionId() {
    const now = Date.now();
    
    // New session if timeout exceeded
    if (now - this.lastEventTime > this.sessionTimeout) {
      this.sessionId = now;
      this.eventCount = 0;
      console.log('[Amplitude Feedback] New session started:', this.sessionId);
    }
    
    this.lastEventTime = now;
    return this.sessionId;
  }

  async track(eventType, eventProperties = {}) {
    try {
      this.eventCount++;
      
      // Add enhanced properties to all events
      const enhancedProperties = {
        ...eventProperties,
        feedback_page: true,
        install_date: this.installDate ? this.installDate.toISOString() : null,
        install_date_source: this.installDateSource,
        days_used: this.daysUsed,
        // Add more precise time metrics for quick uninstalls
        time_since_install_minutes: this.minutesSinceInstall,
        time_since_install_hours: this.hoursSinceInstall,
        time_since_install_ms: this.timeSinceInstallMs,
        time_since_install_formatted: this.timeSinceInstallFormatted,
        uninstall_date: new Date().toISOString(),
        extension_version: new URLSearchParams(window.location.search).get('v') || 'unknown',
        event_index: this.eventCount,  // Event index in session
        session_duration: Date.now() - this.sessionId  // Session duration in ms
      };

      const event = {
        user_id: this.userId,
        device_id: this.deviceId,
        session_id: this.getCurrentSessionId(),  // Dynamic session management
        event_type: eventType,
        event_properties: enhancedProperties,
        time: Date.now(),
        ip: '$remote'  // Amplitude uses client IP for automatic geo-location
      };

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*'
        },
        body: JSON.stringify({
          api_key: this.apiKey,
          events: [event]
        })
      });

      if (!response.ok) {
        console.error('[Amplitude Feedback] Failed to track event:', response.status);
      } else {
        console.log('[Amplitude Feedback] Event tracked:', eventType, enhancedProperties);
      }

    } catch (error) {
      console.error('[Amplitude Feedback] Error tracking event:', error);
    }
  }

  // Track uninstall with comprehensive data
  async trackUninstall(reason, details = {}) {
    // Store reason for use in setStandardUserProperties
    this.selectedReason = reason;
    
    const uninstallProperties = {
      uninstall_reason: reason,
      uninstall_reason_details: details,
      days_until_uninstall: this.daysUsed,
      ...details
    };

    // Main uninstall event
    await this.track('Extension Uninstalled', uninstallProperties);

    // Set comprehensive standard user properties for churn analysis
    await this.setStandardUserProperties();
  }

  async setUserProperties(properties) {
    try {
      const identifyPayload = {
        user_id: this.userId,
        device_id: this.deviceId,
        user_properties: properties
      };

      const params = new URLSearchParams();
      params.append('api_key', this.apiKey);
      params.append('identification', JSON.stringify([identifyPayload]));

      const identifyEndpoint = 'https://api.eu.amplitude.com/identify';

      await fetch(identifyEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': '*/*'
        },
        body: params.toString()
      });

      console.log('[Amplitude Feedback] User properties set:', properties);
    } catch (error) {
      console.error('[Amplitude Feedback] Error setting user properties:', error);
    }
  }

  // Set comprehensive standard user properties for uninstall tracking
  async setStandardUserProperties() {
    const properties = {
      // System Properties (normally collected by SDK)
      platform: navigator.platform,
      language: navigator.language,
      os_name: this.detectOS(),
      os_version: this.getOSVersion(),
      device_type: this.getDeviceType(),
      library: 'web/feedback-page',
      
      // Browser Info
      browser_name: this.getBrowserName(),
      browser_version: this.getBrowserVersion(),
      
      // Screen Properties
      screen_width: window.screen.width,
      screen_height: window.screen.height,
      
      // Churn Properties
      churned: true,
      churn_date: new Date().toISOString(),
      churn_reason: this.selectedReason,
      lifetime_days: this.daysUsed || 0
    };
    
    await this.setUserProperties(properties);
    console.log('[Amplitude Feedback] Standard user properties set:', properties);
  }

  // Helper Methods for System Detection
  detectOS() {
    const userAgent = navigator.userAgent;
    if (userAgent.indexOf('Win') !== -1) return 'Windows';
    if (userAgent.indexOf('Mac') !== -1) return 'macOS';
    if (userAgent.indexOf('Linux') !== -1) return 'Linux';
    if (userAgent.indexOf('Android') !== -1) return 'Android';
    if (userAgent.indexOf('like Mac') !== -1) return 'iOS';
    return 'Unknown';
  }

  getOSVersion() {
    try {
      const match = navigator.userAgent.match(/(?:Windows NT|Mac OS X|Android|iOS)[\s\/]?([\d._]+)/);
      return match ? match[1].replace(/_/g, '.') : 'Unknown';
    } catch (error) {
      return 'Unknown';
    }
  }

  getDeviceType() {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/mobile|android|iphone/i.test(userAgent)) return 'Mobile';
    if (/tablet|ipad/i.test(userAgent)) return 'Tablet';
    return 'Desktop';
  }

  getBrowserName() {
    const userAgent = navigator.userAgent;
    if (userAgent.indexOf('Chrome') !== -1) return 'Chrome';
    if (userAgent.indexOf('Firefox') !== -1) return 'Firefox';
    if (userAgent.indexOf('Safari') !== -1) return 'Safari';
    if (userAgent.indexOf('Edge') !== -1) return 'Edge';
    return 'Unknown';
  }

  getBrowserVersion() {
    try {
      const match = navigator.userAgent.match(/(?:Chrome|Firefox|Safari|Edge)[\s\/]([\d.]+)/);
      return match ? match[1] : 'Unknown';
    } catch (error) {
      return 'Unknown';
    }
  }
}

// Export for use in feedback page
window.AmplitudeFeedback = AmplitudeFeedback;
