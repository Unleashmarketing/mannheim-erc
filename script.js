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

function insertNavigationElements() {
    const template = document.getElementById('navigation-template1');
    const contactBtn = document.getElementById('contactBtn');
    const contactStandard = document.getElementById('contactStandard');
    const targetElement1 = document.getElementById('pageElementsDesktop');
    if (template && targetElement1) {
        targetElement1.prepend(template.content.cloneNode(true));
        const ul = targetElement1.getElementsByTagName('ul');
        ul[0].append(contactBtn.content.cloneNode(true));
    }
    const targetElement2 = document.getElementById("mobileMenu");
    if (template && targetElement2) {
        targetElement2.append(template.content.cloneNode(true));
        const ul = targetElement2.getElementsByTagName('ul');
        ul[0].append(contactStandard.content.cloneNode(true));
    }
    const targetElement3 = document.getElementById("footerLinksWithMenuElements");
    if (template && targetElement3) {
        targetElement3.append(template.content.cloneNode(true));
        const ul = targetElement3.getElementsByTagName('ul');
        ul[0].append(contactStandard.content.cloneNode(true));
    }
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

// Video Background für Hero Section (falls Video nicht lädt, Fallback auf Bild)
document.addEventListener('DOMContentLoaded', function() {
    const heroVideo = document.querySelector('.hero-video');
    if (heroVideo) {
        heroVideo.addEventListener('error', function() {
            const heroSection = document.querySelector('.hero');
            heroSection.style.backgroundImage = 'linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url("images/Bild2.jpeg")';
            heroSection.style.backgroundSize = 'cover';
            heroSection.style.backgroundPosition = 'center';
        });
    }
});

document.addEventListener('DOMContentLoaded', insertNavigationElements);