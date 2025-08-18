/**
 * Debug Helper for Attribution Testing
 * Add this to any page to debug attribution storage
 */

window.MonkeyBlockDebug = {
  checkAttribution() {
    console.group('🐵 MonkeyBlock Attribution Check');
    
    // Check if mbTracker exists
    if (window.mbTracker) {
      console.log('✅ mbTracker found');
      console.log('User ID:', window.mbTracker.userId);
      console.log('Device ID:', window.mbTracker.deviceId);
      console.log('Initialized:', window.mbTracker.initialized);
    } else {
      console.log('❌ mbTracker NOT found');
    }
    
    // Check localStorage
    const preInstall = localStorage.getItem('mb_pre_install_attribution');
    const landing = localStorage.getItem('mb_landing_attribution');
    
    console.log('\n📦 LocalStorage:');
    console.log('Pre-Install Attribution:', preInstall ? JSON.parse(preInstall) : 'NOT FOUND');
    console.log('Landing Attribution:', landing ? JSON.parse(landing) : 'NOT FOUND');
    
    // Check cookies
    const cookies = document.cookie.split(';').find(c => c.includes('mb_attr'));
    console.log('\n🍪 Cookie:', cookies || 'NOT FOUND');
    
    console.groupEnd();
  },
  
  testFingerprint() {
    console.group('🔍 Fingerprint Test');
    
    if (typeof FingerprintGenerator !== 'undefined') {
      const fp1 = FingerprintGenerator.generate();
      const fp2 = FingerprintGenerator.generate();
      console.log('First:', fp1);
      console.log('Second:', fp2);
      console.log('Consistent:', fp1 === fp2 ? '✅' : '❌');
      console.log('Components:', FingerprintGenerator.getComponents());
    } else {
      console.log('❌ FingerprintGenerator not found');
    }
    
    console.groupEnd();
  },
  
  manualTrackInstall() {
    console.log('🚀 Manually triggering install tracking...');
    
    if (window.mbTracker && window.mbTracker.trackInstallClick) {
      // Find first install button
      const button = document.querySelector('[data-track="install"]');
      if (button) {
        window.mbTracker.trackInstallClick(button);
        console.log('✅ trackInstallClick called');
      } else {
        console.log('❌ No install button found');
      }
    } else {
      console.log('❌ mbTracker.trackInstallClick not available');
    }
  },
  
  forceStoreAttribution() {
    const fingerprint = typeof FingerprintGenerator !== 'undefined' 
      ? FingerprintGenerator.generate() 
      : 'debug-fp-' + Date.now();
      
    const userId = `user_web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const attributionData = {
      userId: userId,
      deviceId: fingerprint,
      fingerprint: fingerprint,
      utm: {
        utm_source: 'debug-test',
        utm_medium: 'manual',
        utm_campaign: 'attribution-debug'
      },
      referrer: document.referrer,
      landing_page: window.location.pathname,
      button_location: 'debug-force',
      timestamp: Date.now(),
      source_platform: 'website'
    };
    
    localStorage.setItem('mb_pre_install_attribution', JSON.stringify(attributionData));
    console.log('✅ Attribution force-stored:', attributionData);
  }
};

// Auto-log on load
console.log('🐵 MonkeyBlock Debug Helper loaded! Available commands:');
console.log('- MonkeyBlockDebug.checkAttribution()');
console.log('- MonkeyBlockDebug.testFingerprint()');
console.log('- MonkeyBlockDebug.manualTrackInstall()');
console.log('- MonkeyBlockDebug.forceStoreAttribution()');
