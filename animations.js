/**
 * Monkey Block Landing Page Animations
 * Modern, performant animations with Intersection Observer
 */

(function() {
    'use strict';

    // ============================================
    // INITIALIZATION
    // ============================================
    
    document.addEventListener('DOMContentLoaded', function() {
        initializeAnimations();
        initializeNavigation();
        initializeScrollAnimations();
        initializeStarAnimation();
        initializeVideoEnhancements();
    });

    // ============================================
    // 1. HERO SECTION ANIMATIONS
    // ============================================
    
    function initializeStarAnimation() {
        // Replace static stars with animated ones
        const starsElement = document.querySelector('.rating-badge .stars');
        if (starsElement) {
            const stars = starsElement.textContent;
            starsElement.innerHTML = '';
            starsElement.className = 'stars-animated';
            
            for (let i = 0; i < stars.length; i++) {
                const span = document.createElement('span');
                span.textContent = stars[i];
                starsElement.appendChild(span);
            }
        }
    }
    // ============================================
    // 2. NAVIGATION ENHANCEMENTS
    // ============================================
    
    function initializeNavigation() {
        const nav = document.querySelector('nav');
        const navLinks = document.querySelectorAll('.nav-links a');
        
        // Sticky nav scroll effect
        let scrolled = false;
        window.addEventListener('scroll', function() {
            const shouldBeScrolled = window.scrollY > 20;
            
            if (shouldBeScrolled !== scrolled) {
                scrolled = shouldBeScrolled;
                if (scrolled) {
                    nav.classList.add('scrolled');
                } else {
                    nav.classList.remove('scrolled');
                }
            }
            
            // Update active section
            updateActiveSection();
        });
        
        // Active section highlighting
        function updateActiveSection() {
            const sections = document.querySelectorAll('section[id], section[data-section]');
            let currentSection = '';
            
            sections.forEach(section => {
                const rect = section.getBoundingClientRect();
                if (rect.top <= 100 && rect.bottom >= 100) {
                    currentSection = section.id || section.dataset.section;
                }
            });
            
            navLinks.forEach(link => {
                const href = link.getAttribute('href');
                if (href && href.startsWith('#')) {
                    const sectionId = href.substring(1);
                    if (sectionId === currentSection) {
                        link.classList.add('active');
                    } else {
                        link.classList.remove('active');
                    }
                }
            });
        }
        
        // Smooth scroll for nav links
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (href && href.startsWith('#')) {
                    e.preventDefault();
                    const target = document.querySelector(href);
                    if (target) {
                        const offset = nav.offsetHeight + 20;
                        const targetPosition = target.offsetTop - offset;
                        
                        window.scrollTo({
                            top: targetPosition,
                            behavior: 'smooth'
                        });
                    }
                }
            });
        });
    }

    // ============================================
    // 3. SCROLL ANIMATIONS WITH INTERSECTION OBSERVER
    // ============================================
    
    function initializeScrollAnimations() {
        // Create observer for scroll animations
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };
        
        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Add animation class
                    entry.target.classList.add('visible');
                    
                    // For review cards, add animate-in class
                    if (entry.target.classList.contains('review-card')) {
                        entry.target.classList.add('animate-in');
                    }
                    
                    // Remove will-change after animation
                    setTimeout(() => {
                        entry.target.classList.add('animate-done');
                    }, 1000);
                    
                    // Stop observing after animation
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);
        
        // Observe review cards
        document.querySelectorAll('.review-card').forEach(card => {
            observer.observe(card);
        });
        
        // Observe sections
        document.querySelectorAll('section').forEach(section => {
            section.classList.add('section-animate');
            observer.observe(section);
        });
        
        // Observe any element with fade-in-scroll class
        document.querySelectorAll('.fade-in-scroll').forEach(element => {
            observer.observe(element);
        });
    }

    // ============================================
    // 4. VIDEO ENHANCEMENTS
    // ============================================
    
    function initializeVideoEnhancements() {
        const videoContainer = document.querySelector('.video-container');
        if (!videoContainer) return;
        
        // Add loading state
        videoContainer.classList.add('loading');
        
        // Check if Wistia player is loaded
        const checkWistia = setInterval(function() {
            const wistiaPlayer = videoContainer.querySelector('wistia-player');
            if (wistiaPlayer) {
                clearInterval(checkWistia);
                videoContainer.classList.remove('loading');
                
                // Add play button overlay handling
                videoContainer.addEventListener('click', function() {
                    // Play button will be handled by Wistia
                });
            }
        }, 100);
        
        // Timeout fallback
        setTimeout(function() {
            clearInterval(checkWistia);
            videoContainer.classList.remove('loading');
        }, 5000);
    }
    
    // ============================================
    // 5. GENERAL ANIMATIONS
    // ============================================
    
    function initializeAnimations() {
        // Add animation classes to elements on load
        const heroContent = document.querySelector('.hero-content');
        if (heroContent) {
            heroContent.style.opacity = '1';
        }
        
        // Initialize ticker enhancements
        initializeTickerEnhancements();
    }
    
    function initializeTickerEnhancements() {
        const ticker = document.querySelector('.logo-ticker');
        if (!ticker) return;
        
        // Ticker already has CSS animations, just ensure smooth behavior
        const tickerContent = ticker.querySelector('.ticker-content');
        if (tickerContent) {
            // Clone items for seamless loop if needed
            const items = tickerContent.children;
            if (items.length < 20) { // Only if not already duplicated
                const clones = [];
                for (let i = 0; i < items.length; i++) {
                    if (!items[i].classList.contains('cloned')) {
                        const clone = items[i].cloneNode(true);
                        clone.classList.add('cloned');
                        clones.push(clone);
                    }
                }
                clones.forEach(clone => tickerContent.appendChild(clone));
            }
        }
    }
    
    // ============================================
    // 6. PERFORMANCE MONITORING
    // ============================================
    
    // Monitor animation performance
    if (window.requestIdleCallback) {
        window.requestIdleCallback(function() {
            // Remove will-change from elements after initial animations
            setTimeout(function() {
                document.querySelectorAll('.animate-done').forEach(el => {
                    el.style.willChange = 'auto';
                });
            }, 2000);
        });
    }
    
})();