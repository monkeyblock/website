/**
 * Extension Background Script Attribution Handler
 * Add this to background-unified.js to handle attribution from website
 */

// Add this to the message handler in background-unified.js
if (request.action === 'setWebsiteAttribution') {
  try {
    const attribution = request.data;
    
    // Store attribution data
    await chrome.storage.local.set({
      websiteAttribution: attribution,
      attributionTimestamp: Date.now()
    });
    
    // Merge with existing user properties
    const currentProps = amplitudeAnalytics.userProperties || {};
    const mergedProps = {
      ...currentProps,
      ...attribution,
      attribution_source: 'website',
      attribution_received: new Date().toISOString()
    };
    
    // Update Amplitude user properties
    await amplitudeAnalytics.setUserProperties(mergedProps);
    
    console.log('[Background] Website attribution received and stored:', attribution);
    sendResponse({ success: true });
  } catch (error) {
    console.error('[Background] Failed to process website attribution:', error);
    sendResponse({ success: false, error: error.message });
  }
  return true; // Will respond asynchronously
}

// Add method to retrieve attribution when needed
async function getStoredAttribution() {
  try {
    const data = await chrome.storage.local.get(['websiteAttribution', 'attributionTimestamp']);
    
    if (data.websiteAttribution) {
      // Check if attribution is still fresh (30 days)
      const age = Date.now() - (data.attributionTimestamp || 0);
      if (age < 30 * 24 * 60 * 60 * 1000) {
        return data.websiteAttribution;
      }
    }
    
    return null;
  } catch (error) {
    console.error('[Background] Error getting stored attribution:', error);
    return null;
  }
}

// Update the Extension Installed event to include attribution
async function trackInstallWithAttribution() {
  const attribution = await getStoredAttribution();
  
  await amplitudeAnalytics.track('Extension Installed', {
    version: chrome.runtime.getManifest().version,
    source: 'chrome_store',
    attribution_found: !!attribution,
    ...attribution, // Include all attribution data
    timestamp: new Date().toISOString()
  });
  
  // Set user properties with attribution
  if (attribution) {
    await amplitudeAnalytics.setUserProperties({
      initial_utm_source: attribution.utm_source,
      initial_utm_medium: attribution.utm_medium,
      initial_utm_campaign: attribution.utm_campaign,
      initial_referrer: attribution.initial_referrer,
      website_landing_time: attribution.landing_time
    });
  }
}
