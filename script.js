// Mobile Menu Toggle
const mobileToggle = document.querySelector('.mobile-toggle');
const mobileMenu = document.querySelector('.mobile-menu');
const overlay = document.querySelector('.overlay');
const mobileClose = document.querySelector('.mobile-menu-close');
const mobileLinks = document.querySelectorAll('.mobile-menu a');

mobileToggle.addEventListener('click', () => {
    mobileMenu.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    mobileToggle.classList.add('active');
});

function closeMenu() {
    mobileMenu.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    mobileToggle.classList.remove('active');
}

mobileClose.addEventListener('click', closeMenu);
overlay.addEventListener('click', closeMenu);

mobileLinks.forEach(link => {
    link.addEventListener('click', closeMenu);
});

// Sticky Header
const header = document.querySelector('header');
window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// Scroll Animation
const fadeElements = document.querySelectorAll('.fade-in');

function checkFade() {
    fadeElements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;
        
        if (elementTop < window.innerHeight - elementVisible) {
            element.classList.add('visible');
        }
    });
}

window.addEventListener('scroll', checkFade);
window.addEventListener('load', checkFade);

// Smooth Scroll for Anchor Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            const headerHeight = document.querySelector('header').offsetHeight;
            const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Parallax Effect for Hero Section
window.addEventListener('scroll', function() {
    const scrollPosition = window.pageYOffset;
    const hero = document.querySelector('.hero');
    
    if (hero) {
        hero.style.backgroundPositionY = scrollPosition * 0.5 + 'px';
    }
});
