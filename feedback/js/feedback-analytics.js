/**
 * Feedback Page Analytics
 * Uses unified MonkeyBlockAnalytics library
 */

(async function() {
  // Initialize analytics
  const analytics = new MonkeyBlockAnalytics({
    platform: 'feedback'
  });
  
  await analytics.initialize();
  
  // Parse URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  
  // Get user data from URL
  const urlData = {
    userId: urlParams.get('uid'),
    deviceId: urlParams.get('did'),
    extensionId: urlParams.get('ext_id'),
    version: urlParams.get('v'),
    installDate: urlParams.get('install_date'),
    isReinstall: urlParams.get('reinstall') === '1',
    reinstallCount: parseInt(urlParams.get('rc')) || 0
  };
  
  // Set user ID if provided
  if (urlData.userId) {
    await analytics.setUserId(urlData.userId);
  }
  
  // Track uninstall page view
  analytics.track('Uninstall Feedback Page Viewed', {
    has_user_id: !!urlData.userId,
    has_device_id: !!urlData.deviceId,
    extension_id: urlData.extensionId,
    version: urlData.version,
    install_date: urlData.installDate,
    is_reinstall: urlData.isReinstall,
    reinstall_count: urlData.reinstallCount
  });
  
  // Track feedback form interactions
  const feedbackForm = document.getElementById('feedback-form');
  if (feedbackForm) {
    // Track reason selection
    feedbackForm.addEventListener('change', (e) => {
      if (e.target.name === 'uninstall_reason') {
        analytics.track('Uninstall Reason Selected', {
          reason: e.target.value,
          reason_text: e.target.parentElement.textContent.trim()
        });
      }
    });
    
    // Track form submission
    feedbackForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const formData = new FormData(feedbackForm);
      const reason = formData.get('uninstall_reason');
      const feedback = formData.get('additional_feedback');
      
      analytics.track('Uninstall Feedback Submitted', {
        reason: reason,
        has_additional_feedback: !!feedback,
        feedback_length: feedback ? feedback.length : 0,
        time_on_page: Math.round((Date.now() - performance.timing.navigationStart) / 1000)
      });
      
      // Show thank you message
      const thankYouMessage = document.getElementById('thank-you-message');
      if (thankYouMessage) {
        feedbackForm.style.display = 'none';
        thankYouMessage.style.display = 'block';
      }
    });
  }
  
  // Track if user skips feedback
  const skipButton = document.querySelector('[data-action="skip-feedback"]');
  if (skipButton) {
    skipButton.addEventListener('click', () => {
      analytics.track('Uninstall Feedback Skipped', {
        time_on_page: Math.round((Date.now() - performance.timing.navigationStart) / 1000)
      });
    });
  }
  
  // Track page exit
  window.addEventListener('beforeunload', () => {
    analytics.track('Uninstall Feedback Page Exit', {
      time_on_page: Math.round((Date.now() - performance.timing.navigationStart) / 1000),
      feedback_submitted: !!document.getElementById('thank-you-message')?.style.display
    });
  });
  
  // Expose for debugging
  window.mbAnalytics = analytics;
  
})();
