/**
 * Varol Nakliyat - Main JavaScript
 */
(function () {
  "use strict";

  const SITE = {
    phone: "0552 200 20 18",
    phoneRaw: "+905522002018",
    whatsapp: "905522002018",
    email: "info@varolnakliyat.com",
    domain: "https://varolnakliyat.com",
    mapsUrl: "https://maps.app.goo.gl/7VKdnZBWZqM7VThV8",
    mapsEmbed:
      "https://maps.google.com/maps?q=40.9325051,29.2094264&hl=tr&z=17&output=embed",
    latitude: 40.9325051,
    longitude: 29.2094264,
    locations: [
      {
        id: "kartal",
        label: "Kartal",
        address: "Uğurmumcu Mah. Kartal / İstanbul",
        mapsUrl: "https://maps.app.goo.gl/7VKdnZBWZqM7VThV8",
        mapsEmbed:
          "https://maps.google.com/maps?q=40.9325051,29.2094264&hl=tr&z=17&output=embed",
        latitude: 40.9325051,
        longitude: 29.2094264,
      },
    ],
  };

  const getLocation = (id) => SITE.locations.find((loc) => loc.id === id) || SITE.locations[0];

  SITE.address = SITE.locations[0].address;

  window.VAROL_SITE = SITE;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const header = document.querySelector(".site-header");
  const heroBrand = document.querySelector(".hero-brand");

  if (header) {
    if (heroBrand) {
      const syncHomeHeader = ([entry]) => {
        const pastHero = !entry.isIntersecting;
        header.classList.toggle("scrolled", pastHero);
        header.classList.toggle("logo-visible", pastHero);
        header.classList.toggle("header-dark", pastHero);
      };

      new IntersectionObserver(syncHomeHeader, {
        threshold: 0,
        rootMargin: "-1px 0px 0px 0px",
      }).observe(heroBrand);
    } else {
      header.classList.add("scrolled", "header-dark");
      const onScroll = () => {
        header.classList.toggle("scrolled", window.scrollY > 50 || !heroBrand);
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }
  }

  const menuToggle = document.querySelector(".menu-toggle");
  const mobileNav = document.querySelector(".mobile-nav");
  if (menuToggle && mobileNav) {
    menuToggle.addEventListener("click", () => {
      const isOpen = mobileNav.classList.toggle("open");
      document.body.style.overflow = isOpen ? "hidden" : "";
      menuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    mobileNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        mobileNav.classList.remove("open");
        document.body.style.overflow = "";
        menuToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  document.querySelectorAll(".faq-question").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".faq-item");
      const isOpen = item.classList.contains("open");
      document.querySelectorAll(".faq-item.open").forEach((el) => el.classList.remove("open"));
      if (!isOpen) item.classList.add("open");
    });
  });

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible", "is-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -32px 0px" }
  );

  document.querySelectorAll(".fade-up, .reveal, .reveal-stagger").forEach((el) => {
    revealObserver.observe(el);
  });

  if (!prefersReducedMotion) {
    document.querySelectorAll("[data-reveal]").forEach((el, i) => {
      if (el.classList.contains("reveal")) {
        el.style.transitionDelay = `${i * 80}ms`;
      }
    });
  }

  const currentPath = window.location.pathname.replace(/\/$/, "") || "/";
  document.querySelectorAll(".nav-desktop a, .mobile-nav a").forEach((link) => {
    const href = link.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("tel:") || href.startsWith("mailto:")) return;
    const linkPath = new URL(href, window.location.origin).pathname.replace(/\/$/, "") || "/";
    if (linkPath === currentPath || (currentPath.includes(linkPath) && linkPath !== "/")) {
      link.classList.add("active");
    }
  });

  const waFloat = document.querySelector(".whatsapp-float");
  if (waFloat) {
    const msg = encodeURIComponent("Merhaba, Varol Nakliyat hizmetleri hakkında bilgi almak istiyorum.");
    waFloat.querySelector(".whatsapp-btn")?.setAttribute(
      "href",
      `https://wa.me/${SITE.whatsapp}?text=${msg}`
    );
    waFloat.querySelector(".phone-float")?.setAttribute("href", `tel:${SITE.phoneRaw}`);
  }

  document.querySelectorAll("[data-phone]").forEach((el) => {
    const suffix = el.dataset.phoneSuffix || "";
    if (el.tagName === "A" && el.querySelector("[data-phone]")) {
      el.href = `tel:${SITE.phoneRaw}`;
      return;
    }
    el.textContent = SITE.phone + suffix;
    if (el.tagName === "A") el.href = `tel:${SITE.phoneRaw}`;
  });

  document.querySelectorAll("[data-email]").forEach((el) => {
    el.textContent = SITE.email;
    if (el.tagName === "A") el.href = `mailto:${SITE.email}`;
  });

  document.querySelectorAll(".footer-contact ul").forEach((ul) => {
    if (!ul.querySelector("[data-address]")) {
      SITE.locations.forEach((loc) => {
        const addressLi = document.createElement("li");
        addressLi.innerHTML =
          `📍 <a href="#" data-maps-link data-location="${loc.id}" target="_blank" rel="noopener noreferrer"><span data-address data-location="${loc.id}"></span></a>`;
        ul.appendChild(addressLi);
      });
    }

    if (!ul.querySelector("[data-maps-reviews]")) {
      const reviewsLi = document.createElement("li");
      reviewsLi.innerHTML =
        '⭐ <a href="#" data-maps-link data-maps-reviews data-location="kartal" target="_blank" rel="noopener noreferrer">Google\'da yorumlar ve fotoğraflar</a>';
      ul.appendChild(reviewsLi);
    }
  });

  document.querySelectorAll("[data-address]").forEach((el) => {
    const loc = el.dataset.location ? getLocation(el.dataset.location) : null;
    el.textContent = loc ? loc.address : SITE.address;
  });

  document.querySelectorAll("[data-maps-link]").forEach((el) => {
    const loc = getLocation(el.dataset.location || SITE.locations[0].id);
    el.href = loc.mapsUrl;
    if (!el.getAttribute("target")) {
      el.target = "_blank";
      el.rel = "noopener noreferrer";
    }
  });

  document.querySelectorAll("[data-maps-embed]").forEach((el) => {
    const loc = getLocation(el.dataset.location || SITE.locations[0].id);
    el.src = loc.mapsEmbed;
  });
})();
