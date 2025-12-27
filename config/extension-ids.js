/**
 * Extension ID Configuration
 * Automatically switches between development (unpacked) and production (Web Store) IDs
 */

// Development ID (changes with each unpacked load)
// This is YOUR current unpacked extension ID - update this when it changes
const DEV_EXTENSION_ID = 'amnljlfpocdlfajlcjogdldipecheekm';

// Production ID (fixed, from Chrome Web Store)
const PROD_EXTENSION_ID = 'ggccjkdgmlclpigflghjjkgeblgdgffe';

/**
 * Detect if we're running in development or production
 * Method: Try to access a dev-only resource to determine environment
 */
function isDevEnvironment() {
  // In production (packed extension), the ID is fixed
  // In development (unpacked), the ID changes
  // We can detect this by checking if we're in a packed extension

  // Method 1: Check if running from unpacked extension
  // Unpacked extensions have 'Temp' in their path
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest) {
    const manifest = chrome.runtime.getManifest();
    // Unpacked extensions don't have update_url
    return !manifest.update_url;
  }

  // Method 2: Check current extension ID
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
    // If current ID matches dev ID, we're in dev
    return chrome.runtime.id === DEV_EXTENSION_ID;
  }

  // Default to production for safety
  return false;
}

/**
 * Get the correct extension ID based on environment
 */
function getExtensionId() {
  return isDevEnvironment() ? DEV_EXTENSION_ID : PROD_EXTENSION_ID;
}

/**
 * Get auth callback URL for current environment
 */
function getAuthCallbackUrl() {
  const extensionId = getExtensionId();
  return `chrome-extension://${extensionId}/auth-callback.html`;
}

/**
 * Get dashboard URL for current environment
 */
function getDashboardUrl() {
  const extensionId = getExtensionId();
  return `chrome-extension://${extensionId}/dashboard.html`;
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.ExtensionConfig = {
    EXTENSION_ID: getExtensionId(),
    AUTH_CALLBACK_URL: getAuthCallbackUrl(),
    DASHBOARD_URL: getDashboardUrl(),
    IS_DEV: isDevEnvironment(),
    DEV_EXTENSION_ID,
    PROD_EXTENSION_ID
  };
}

// For CommonJS/Node environments (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getExtensionId,
    getAuthCallbackUrl,
    getDashboardUrl,
    isDevEnvironment,
    DEV_EXTENSION_ID,
    PROD_EXTENSION_ID
  };
}
