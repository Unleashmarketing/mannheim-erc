// Verbesserte Videowiedergabe-Logik
document.addEventListener('DOMContentLoaded', function() {
    const heroVideo = document.querySelector('.hero-video');
    const heroSection = document.querySelector('.hero');
    const videoContainer = document.querySelector('.hero-video-container');
    
    // Funktion, um zum Fallback-Bild zu wechseln
    function switchToFallbackImage() {
        console.log('Wechsle zu Fallback-Bild');
        heroSection.style.backgroundImage = 'linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url("images/Bild2.jpeg")';
        heroSection.style.backgroundSize = 'cover';
        heroSection.style.backgroundPosition = 'center';
        
        // Video-Container ausblenden
        if (videoContainer) {
            videoContainer.style.display = 'none';
        }
    }

    // Videobehandlung
    if (heroVideo) {
        // 1. Prüfen auf generelle Fehler
        heroVideo.addEventListener('error', function(e) {
            console.error('Video-Fehler:', e);
            switchToFallbackImage();
        });

        // 2. Prüfen der einzelnen Quellen
        const sources = heroVideo.querySelectorAll('source');
        let sourcesWithError = 0;
        
        sources.forEach(source => {
            source.addEventListener('error', function(e) {
                console.error('Video-Quelle fehlgeschlagen:', source.src);
                sourcesWithError++;
                
                // Wenn alle Quellen fehlschlagen, zum Fallback wechseln
                if (sourcesWithError >= sources.length) {
                    switchToFallbackImage();
                }
            });
        });

        // 3. Timeout für Video-Laden (5 Sekunden)
        let videoLoaded = false;
        
        heroVideo.addEventListener('canplay', function() {
            videoLoaded = true;
            console.log('Video kann abgespielt werden');
        });

        // Timeout für Video-Laden
        setTimeout(function() {
            if (!videoLoaded) {
                console.warn('Video konnte nicht innerhalb von 5 Sekunden geladen werden');
                switchToFallbackImage();
            }
        }, 5000);
    }

    // Mobile Menu Toggle und andere bestehende Skripts
    const mobileToggle = document.querySelector('.mobile-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    const overlay = document.querySelector('.overlay');
    const mobileClose = document.querySelector('.mobile-menu-close');
    const mobileLinks = document.querySelectorAll('.mobile-menu a');

    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            mobileMenu.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            mobileToggle.classList.add('active');
        });
    }

    function closeMenu() {
        mobileMenu.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
        mobileToggle.classList.remove('active');
    }

    if (mobileClose) mobileClose.addEventListener('click', closeMenu);
    if (overlay) overlay.addEventListener('click', closeMenu);

    if (mobileLinks.length > 0) {
        mobileLinks.forEach(link => {
            link.addEventListener('click', closeMenu);
        });
    }

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
    checkFade(); // Initial ausführen

    // Smooth Scroll für Anchor-Links
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
});
