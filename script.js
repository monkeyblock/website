// Monkey Block Landing Page JavaScript

// =====================================================================================
// ANALYTICS & CONVERSION TRACKING
// =====================================================================================

// Track referrer sources for attribution
function trackReferrerSource() {
    const referrer = document.referrer;
    const urlParams = new URLSearchParams(window.location.search);
    
    // Detect traffic source
    let source = 'direct';
    let medium = 'none';
    let campaign = 'none';
    
    if (urlParams.get('utm_source')) {
        source = urlParams.get('utm_source');
        medium = urlParams.get('utm_medium') || 'unknown';
        campaign = urlParams.get('utm_campaign') || 'unknown';
    } else if (referrer) {
        if (referrer.includes('google.com')) {
            source = 'google';
            medium = 'organic';
        } else if (referrer.includes('reddit.com')) {
            source = 'reddit';
            medium = 'social';
        } else if (referrer.includes('twitter.com') || referrer.includes('x.com')) {
            source = 'twitter';
            medium = 'social';
        } else if (referrer.includes('facebook.com')) {
            source = 'facebook'; 
            medium = 'social';
        } else if (referrer.includes('youtube.com')) {
            source = 'youtube';
            medium = 'video';
        } else {
            source = 'referral';
            medium = 'referral';
        }
    }
    
    // Send page view with source attribution
    if (typeof gtag !== 'undefined') {
        gtag('event', 'page_view', {
            'source': source,
            'medium': medium,
            'campaign': campaign,
            'referrer': referrer,
            'page_title': document.title,
            'page_location': window.location.href
        });
        
        console.log('📊 Page view tracked:', { source, medium, campaign, referrer });
    }
    
    // Store source data for download attribution
    const sourceData = {
        source: source,
        medium: medium,
        campaign: campaign,
        referrer: referrer,
        landingTime: Date.now()
    };
    
    try {
        sessionStorage.setItem('monkey_block_source', JSON.stringify(sourceData));
    } catch (e) {
        console.warn('Could not store source data:', e);
    }
}

// Track Chrome Web Store download clicks
function trackDownloadClick(buttonElement, buttonLocation) {
    // Generate unique session ID
    const timestamp = Date.now();
    const sessionId = `web_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Get source attribution from session
    let sourceData = { source: 'direct', medium: 'none', campaign: 'none' };
    try {
        const storedData = sessionStorage.getItem('monkey_block_source');
        if (storedData) {
            sourceData = JSON.parse(storedData);
        }
    } catch (e) {
        console.warn('Could not retrieve source data:', e);
    }
    
    console.log('🎯 Download button clicked:', buttonLocation, 'Session:', sessionId);
    
    // Send download event with full attribution
    if (typeof gtag !== 'undefined') {
        gtag('event', 'chrome_store_click', {
            'event_category': 'Extension',
            'event_label': buttonLocation,
            'session_id': sessionId,
            'button_location': buttonLocation,
            'source': sourceData.source,
            'medium': sourceData.medium,
            'campaign': sourceData.campaign,
            'referrer': sourceData.referrer,
            'time_on_page': Date.now() - (sourceData.landingTime || Date.now()),
            'value': 1
        });
        
        console.log('✅ Download analytics sent with attribution');
    }
    
    // Store session for extension pickup
    try {
        localStorage.setItem('monkey_block_download_session', sessionId);
        
        // Also store extended attribution data
        const extendedSession = {
            sessionId: sessionId,
            buttonLocation: buttonLocation,
            timestamp: new Date().toISOString(),
            source: sourceData.source,
            medium: sourceData.medium,
            campaign: sourceData.campaign,
            referrer: sourceData.referrer,
            userAgent: navigator.userAgent,
            timeOnPage: Date.now() - (sourceData.landingTime || Date.now())
        };
        
        localStorage.setItem('monkey_block_attribution', JSON.stringify(extendedSession));
        console.log('✅ Attribution data stored for extension pickup');
    } catch (e) {
        console.error('❌ Failed to store session data:', e);
    }
}

// Initialize analytics on page load
document.addEventListener('DOMContentLoaded', function() {
    // Track initial page view with referrer attribution
    trackReferrerSource();
    
    // Add click tracking to all Chrome Web Store links
    const downloadButtons = document.querySelectorAll('a[href*="chromewebstore.google.com"], a[href*="chrome.google.com/webstore"]');
    
    downloadButtons.forEach((button, index) => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Determine button location
            let buttonLocation = 'unknown';
            if (button.closest('nav')) {
                buttonLocation = 'navigation';
            } else if (button.closest('.hero')) {
                buttonLocation = button.classList.contains('cta-primary') ? 'hero_primary' : 'hero_secondary';
            } else if (button.closest('.features')) {
                buttonLocation = 'features_section';
            } else if (button.closest('.benefits')) {
                buttonLocation = 'benefits_section';
            } else {
                buttonLocation = `button_${index + 1}`;
            }
            
            // Track the click
            trackDownloadClick(button, buttonLocation);
            
            // Small delay to ensure analytics is sent, then navigate
            setTimeout(() => {
                window.open(button.href, '_blank');
            }, 150);
        });
    });
    
    console.log('✅ Analytics tracking initialized for', downloadButtons.length, 'download buttons');
});

// Track scroll engagement
let maxScrollTracked = 0;
window.addEventListener('scroll', function() {
    const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
    
    if (scrollPercent >= 25 && maxScrollTracked < 25) {
        maxScrollTracked = 25;
        gtag('event', 'scroll_depth', {
            'event_category': 'Engagement',
            'event_label': '25%',
            'value': 25
        });
    } else if (scrollPercent >= 50 && maxScrollTracked < 50) {
        maxScrollTracked = 50;
        gtag('event', 'scroll_depth', {
            'event_category': 'Engagement',
            'event_label': '50%',
            'value': 50
        });
    } else if (scrollPercent >= 75 && maxScrollTracked < 75) {
        maxScrollTracked = 75;
        gtag('event', 'scroll_depth', {
            'event_category': 'Engagement',
            'event_label': '75%',
            'value': 75
        });
    } else if (scrollPercent >= 100 && maxScrollTracked < 100) {
        maxScrollTracked = 100;
        gtag('event', 'scroll_depth', {
            'event_category': 'Engagement',
            'event_label': '100%',
            'value': 100
        });
    }
});

// =====================================================================================
// EXISTING TIMER ANIMATION CODE
// =====================================================================================

// Set current year
document.getElementById('year').textContent = new Date().getFullYear();

// Animate timer
const timerDisplay = document.querySelector('.timer-display');
const progressBar = document.querySelector('.timer-progress-bar');
const focusTimer = document.getElementById('demo-timer');

let totalSeconds = 942; // 15:42
let currentSeconds = totalSeconds;

setInterval(() => {
    currentSeconds--;
    
    const minutes = Math.floor(currentSeconds / 60);
    const seconds = currentSeconds % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    const percentage = (currentSeconds / totalSeconds) * 100;
    progressBar.style.width = percentage + '%';
    
    // Change timer color based on time left
    focusTimer.classList.remove('green', 'yellow', 'red');
    if (percentage > 60) {
        focusTimer.style.background = 'rgba(164, 195, 178, 0.9)';
        progressBar.style.background = '#7fb693';
    } else if (percentage > 20) {
        focusTimer.style.background = 'rgba(229, 201, 166, 0.9)';
        progressBar.style.background = '#daa863';
    } else {
        focusTimer.style.background = 'rgba(217, 161, 154, 0.9)';
        progressBar.style.background = '#c78680';
    }
    
    if (currentSeconds <= 0) {
        currentSeconds = totalSeconds;
    }
}, 1000);

// Smooth scroll with offset for sticky nav
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            // Get the height of the navigation bar
            const navHeight = document.querySelector('nav').offsetHeight;
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight - 20; // 20px extra padding
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});