// Monkey Block Landing Page JavaScript

// Set current year
document.getElementById('year').textContent = new Date().getFullYear();

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Track install button clicks
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for reddit tracking to initialize
    setTimeout(function() {
        // Find all install buttons
        const installButtons = document.querySelectorAll(
            '.install-btn, .cta-primary, .cta-button, a[href*="chromewebstore.google.com"]'
        );
        
        installButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                // Track with Reddit Pixel
                if (window.redditTracking && window.redditTracking.trackInstallClick) {
                    window.redditTracking.trackInstallClick();
                    console.log('[Reddit] Install button click tracked');
                }
                
                // Also track in Amplitude if available
                if (window.mbAnalytics && window.mbAnalytics.track) {
                    const location = this.dataset.location || 
                                   this.dataset.track || 
                                   'unknown';
                    window.mbAnalytics.track('Install Button Clicked', {
                        button_location: location,
                        button_text: this.textContent.trim(),
                        timestamp: new Date().toISOString()
                    });
                }
                
                // Don't prevent default - let the link work normally
            });
        });
        
        console.log('[Tracking] Install button tracking initialized for', installButtons.length, 'buttons');
    }, 500);
});