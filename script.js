// Monkey Block Landing Page JavaScript

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