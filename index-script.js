<script>
// ========================================
// MOBILE MENU FUNKTIONALITÄT
// ========================================

const mobileToggle = document.querySelector(".mobile-toggle");
const mobileMenu = document.querySelector(".mobile-menu");
const overlay = document.querySelector(".overlay");
const mobileClose = document.querySelector(".mobile-menu-close");
const mobileLinks = document.querySelectorAll(".mobile-menu a");

function openMenu() {
  mobileMenu.classList.add("active");
  overlay.classList.add("active");
  document.body.style.overflow = "hidden";
  mobileToggle.classList.add("active");
  mobileToggle.setAttribute("aria-expanded", "true");
}

function closeMenu() {
  mobileMenu.classList.remove("active");
  overlay.classList.remove("active");
  document.body.style.overflow = "";
  mobileToggle.classList.remove("active");
  mobileToggle.setAttribute("aria-expanded", "false");
}

mobileToggle.addEventListener("click", () => {
  const isOpen = mobileMenu.classList.contains("active");
  isOpen ? closeMenu() : openMenu();
});

mobileClose.addEventListener("click", closeMenu);
overlay.addEventListener("click", closeMenu);

mobileLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    if (link.getAttribute("href").startsWith("#")) {
      closeMenu();
    }
  });
});

// Close menu on Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && mobileMenu.classList.contains("active")) {
    closeMenu();
  }
});

// ========================================
// NAVIGATION ELEMENTS EINFÜGEN
// ========================================

function insertNavigationElements() {
  const template = document.getElementById("navigation-template1");
  const contactBtn = document.getElementById("contactBtn");
  const contactStandard = document.getElementById("contactStandard");

  // Desktop Navigation
  const desktopNav = document.getElementById("pageElementsDesktop");
  if (template && desktopNav) {
    const clone = template.content.cloneNode(true);
    desktopNav.prepend(clone);
    const ul = desktopNav.querySelector("ul");
    if (ul && contactBtn) {
      ul.append(contactBtn.content.cloneNode(true));
    }
  }

  // Mobile Navigation
  if (template && mobileMenu) {
    const clone = template.content.cloneNode(true);
    mobileMenu.prepend(clone);
    const ul = mobileMenu.querySelector("ul");
    if (ul && contactStandard) {
      ul.append(contactStandard.content.cloneNode(true));
    }
  }

  // Footer Navigation
  const footerLinks = document.getElementById("footerLinksWithMenuElements");
  if (template && footerLinks) {
    const clone = template.content.cloneNode(true);
    footerLinks.append(clone);
    const ul = footerLinks.querySelector("ul");
    if (ul && contactStandard) {
      ul.append(contactStandard.content.cloneNode(true));
    }
  }
}

// ========================================
// MOBILE SUBMENUS SETUP
// ========================================

function setupMobileSubmenus() {
  const submenuParents = mobileMenu.querySelectorAll(".has-submenu > .submenu-toggle");
  submenuParents.forEach((toggle) => {
    toggle.addEventListener("click", function (e) {
      e.preventDefault();
      const li = this.closest(".has-submenu");
      const isOpen = li.classList.contains("open");
      
      // Close other open submenus
      mobileMenu.querySelectorAll(".has-submenu.open").forEach((item) => {
        if (item !== li) item.classList.remove("open");
      });
      
      li.classList.toggle("open");
      this.setAttribute("aria-expanded", String(!isOpen));
    });
  });
}

// ========================================
// HEADER SCROLL EFFEKT
// ========================================

const header = document.querySelector("header");
let lastScroll = 0;

window.addEventListener("scroll", () => {
  const currentScroll = window.pageYOffset;
  
  if (currentScroll > 100) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
  
  lastScroll = currentScroll;
});

// ========================================
// FADE-IN ANIMATION MIT INTERSECTION OBSERVER
// ========================================

const fadeElements = document.querySelectorAll(".fade-in");

const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px"
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
    }
  });
}, observerOptions);

fadeElements.forEach((element) => {
  observer.observe(element);
});

// ========================================
// DOM CONTENT LOADED - INITIALISIERUNG
// ========================================

document.addEventListener("DOMContentLoaded", function () {
  const heroVideo = document.querySelector(".hero-video");
  
  // Hero Video Fallback
  if (heroVideo) {
    heroVideo.addEventListener("error", function () {
      const heroSection = document.querySelector(".hero");
      const videoContainer = document.querySelector(".hero-video-container");
      
      if (heroSection && videoContainer) {
        heroSection.style.backgroundImage =
          'linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url("images/Bild2.jpeg")';
        heroSection.style.backgroundSize = "cover";
        heroSection.style.backgroundPosition = "center";
        videoContainer.style.display = "none";
      }
    });
  }

  // Initialize navigation
  insertNavigationElements();
  setupMobileSubmenus();
});

// ========================================
// SMOOTH SCROLL FÜR ANKER-LINKS
// ========================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener("click", function (e) {
    const href = this.getAttribute("href");
    if (href !== "#" && href !== "") {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        const headerHeight = header.offsetHeight;
        const targetPosition = target.offsetTop - headerHeight;
        window.scrollTo({
          top: targetPosition,
          behavior: "smooth"
        });
      }
    }
  });
});
</script>
