// Monkey Block Landing Page JavaScript

// Set current year
document.getElementById('year').textContent = new Date().getFullYear();

// Analytics Helper Functions
function trackEvent(eventName, properties = {}) {
    // Umami Analytics
    if (typeof umami !== 'undefined') {
        umami.track(eventName, properties);
    }
    
    // Clicky Analytics
    if (typeof clicky !== 'undefined') {
        clicky.goal(eventName);
    }
    
    // Plausible Analytics - using custom event goals
    if (typeof plausible !== 'undefined') {
        plausible(eventName, { props: properties });
    }
}

// Track page views for sections (for single-page navigation)
function trackSectionView(sectionName) {
    trackEvent('section-view', { section: sectionName });
}

// Track Install Button Clicks
document.querySelectorAll('a[href*="chromewebstore.google.com"]').forEach(link => {
    link.addEventListener('click', function(e) {
        const buttonLocation = this.classList.contains('install-btn') ? 'navigation' : 
                             this.classList.contains('cta-primary') ? 'hero-primary' :
                             this.classList.contains('cta-button') ? 'bottom-cta' : 'other';
        
        trackEvent('install-button-click', { 
            location: buttonLocation,
            text: this.textContent.trim()
        });
    });
});

// Track FAQ Interactions
document.querySelectorAll('.faq-item').forEach((item, index) => {
    item.addEventListener('toggle', function() {
        if (this.open) {
            trackEvent('faq-opened', { 
                question: this.querySelector('summary').textContent,
                index: index + 1
            });
        }
    });
});

// Track navigation clicks
document.querySelectorAll('.nav-links a:not(.install-btn)').forEach(link => {
    link.addEventListener('click', function() {
        const section = this.getAttribute('href').replace('#', '');
        trackEvent('nav-click', { section: section });
    });
});

// Track CTA button clicks
document.querySelector('.cta-secondary').addEventListener('click', function() {
    trackEvent('see-how-it-works-click');
});

// Track timer preview interactions
let timerInteracted = false;
document.getElementById('demo-timer').addEventListener('mouseover', function() {
    if (!timerInteracted) {
        timerInteracted = true;
        trackEvent('timer-preview-hover');
    }
});

// Track scroll depth
let scrollDepths = [25, 50, 75, 90];
let reachedDepths = [];

window.addEventListener('scroll', function() {
    const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
    
    scrollDepths.forEach(depth => {
        if (scrollPercent >= depth && !reachedDepths.includes(depth)) {
            reachedDepths.push(depth);
            trackEvent('scroll-depth', { depth: depth + '%' });
        }
    });
});

// Track time on page
let startTime = Date.now();
let timeTracked = false;

window.addEventListener('beforeunload', function() {
    if (!timeTracked) {
        const timeOnPage = Math.round((Date.now() - startTime) / 1000);
        trackEvent('time-on-page', { seconds: timeOnPage });
        timeTracked = true;
    }
});

// Also track after 30 seconds
setTimeout(() => {
    if (!timeTracked) {
        trackEvent('engaged-user', { milestone: '30-seconds' });
    }
}, 30000);

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

// Track if user comes from Chrome Web Store
if (document.referrer.includes('chrome.google.com/webstore')) {
    trackEvent('visitor-from-chrome-store');
}

// Track page performance
window.addEventListener('load', function() {
    // Wait for everything to load
    setTimeout(() => {
        if (window.performance && window.performance.timing) {
            const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
            trackEvent('page-load-time', { milliseconds: loadTime });
        }
    }, 0);
});